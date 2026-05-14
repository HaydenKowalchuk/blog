import { store } from './app-store.js';
import { router } from './app-router.js';

const ZERO_MD_TEMPLATE = `
  <template>
    <link rel="stylesheet" href="vendor/rosepine-markdown.css">
    <link rel="stylesheet" href="vendor/rosepine-highlight.css">
  </template>`;

export const zeroMd = (markdown) =>
  `<zero-md>${ZERO_MD_TEMPLATE}<script type="text/markdown">${markdown}<\/script></zero-md>`;

export const extractToc = (text) => {
  const lines = text.split('\n');
  return lines
    .filter(l => /^#{2,3}\s/.test(l))
    .filter(l => !/^#{1,3}\s+(article topics)\s*$/i.test(l.trim()))
    .map(l => l.replace(/^#+\s+/, '').trim());
};

export const extractTopics = (text) => {
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+(article topics)\s*$/i.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return [];
  const items = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^#/.test(line)) break;
    const m = line.match(/^[-*+]\s+(.+)/);
    if (m) items.push(m[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim());
  }
  return items;
};

export const stripTopics = (text) => {
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+(article topics)\s*$/i.test(lines[i].trim())) {
      start = i;
      break;
    }
  }
  if (start === -1) return text;
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end].trim();
    if (line && /^#/.test(line)) break;
    end++;
  }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n');
};

export const headingSlug = (text) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .trim()
    .replace(/['"\\!#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s+/g, '-');

export const extractDescription = (markdown) => {
  for (const line of markdown.split('\n')) {
    const t = line.trim();
    if (
      t &&
      !t.startsWith('#') &&
      !t.startsWith('```') &&
      !t.startsWith('- ') &&
      !t.startsWith('* ')
    ) {
      return t.replace(/[*_`[\]()]/g, '').substring(0, 160);
    }
  }
  return '';
};

export const formatDateLong = (iso) => {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDate = (iso) => {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-');
  return `${y}.${mo}.${d}`;
};

const updateMeta = (title, description) => {
  document.title = title ? `${title} — Hayden Kowalchuk` : 'Hayden Kowalchuk';
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', description || '');
};

let navGeneration = 0;
let tocObserver = null;

const setupTocObserver = () => {
  if (tocObserver) {
    tocObserver.disconnect();
    tocObserver = null;
  }
  if (!store.get('content.currentToc', []).length) return;
  requestAnimationFrame(() => {
    const sentinel = document.querySelector('.toc-sentinel');
    if (!sentinel) return;
    tocObserver = new IntersectionObserver(
      ([entry]) => {
        if (!document.contains(entry.target)) return;
        store.set('ui.tocVisible', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    tocObserver.observe(sentinel);
  });
};

const handleRoute = async () => {
  const path = router.path;
  store.set('url.path', path);
  const parts = path.split('/').filter(Boolean);
  const generation = ++navGeneration;

  if (tocObserver) {
    tocObserver.disconnect();
    tocObserver = null;
  }

  store.set('ui.tocVisible', false);
  store.set('content.currentToc', []);
  store.set('content.currentMarkdown', '');
  store.set('content.currentTopics', []);
  window.scrollTo(0, 0);

  let mdFile = null;

  if (parts[0] === 'articles' && parts[1]) {
    store.set('content.currentSlug', parts[1]);
    mdFile = `articles/${parts[1]}.md`;
  } else if (path === '/' || !path) {
    store.set('content.currentSlug', '');
    mdFile = 'about.md';
  } else {
    store.set('content.currentSlug', '');
    const pages = store.get('content.pages', []);
    const match = pages.find(p => `/${p.id}` === path);
    if (match) {
      store.set('content.currentPage', match.id);
      mdFile = `${match.id}.md`;
    }
  }

  if (mdFile) {
    try {
      const res = await fetch(mdFile);
      if (generation !== navGeneration) return;
      if (res.ok) {
        const text = await res.text();
        if (generation !== navGeneration) return;
        const stripped = stripTopics(text);
        store.set('content.currentMarkdown', stripped);
        store.set('content.currentToc', extractToc(stripped));
        store.set('content.currentTopics', extractTopics(text));

        if (parts[0] === 'articles' && parts[1]) {
          const articles = store.get('content.articles', []);
          const meta = articles.find(a => a.slug === parts[1]);
          const desc = meta?.description || extractDescription(text);
          updateMeta(meta?.title || parts[1], desc);
        } else if (path === '/' || !path) {
          updateMeta('About', '');
        } else {
          const pages = store.get('content.pages', []);
          const pg = pages.find(p => `/${p.id}` === path);
          updateMeta(pg?.title || '', '');
        }
      }
    } catch (err) {
      if (generation !== navGeneration) return;
      console.error(`Error loading ${mdFile}:`, err);
    }
  }

  setupTocObserver();
};

export async function initContentService() {
  // Load pages.json
  try {
    const res = await fetch('pages.json');
    const data = await res.json();
    store.set('content.pages', data.pages || []);
  } catch (e) {
    console.error('Failed to load pages.json', e);
  }

  // Load article index
  try {
    const res = await fetch('articles/index.md');
    const text = await res.text();
    const articles = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)\s+(\d{4}-\d{2}-\d{2})\s+(\S+)(?:\s*\|\s*(.+))?/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      articles.push({
        title: m[1],
        slug: m[2],
        date: m[3],
        categories: m[4].split(','),
        description: m[5] || '',
      });
    }
    articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    store.set('content.articles', articles);
  } catch (e) {
    console.error('Failed to load article index', e);
  }

  // Subscribe to TOC changes to set up observer
  store.subscribe('content.currentToc', setupTocObserver);

  // Intercept internal links (works inside zero-md shadow DOM)
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const a = e.composedPath().find(el => el.tagName === 'A');
    if (!a || !a.href) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const path = url.pathname.replace(/\/$/, '') || '/';
    e.preventDefault();
    router.navigate(path || '/');
  });

  // Listen to route changes
  router.listen(handleRoute);
}
