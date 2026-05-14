import { store } from './components/app-store.js';
import { initContentService } from './components/content-service.js';
import './components/app-shell.js';

// Theme init
const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const storedTheme = localStorage.getItem('theme');
const savedTheme = storedTheme || 'system';
document.documentElement.setAttribute('data-theme', storedTheme || systemPref);

// Initialize store with default state
store.set('url.path', location.hash.slice(1) || '/');
store.set('content.pages', []);
store.set('content.articles', []);
store.set('content.currentSlug', '');
store.set('content.currentPage', '');
store.set('content.currentMarkdown', '');
store.set('content.currentToc', []);
store.set('content.currentTopics', []);
store.set('ui.theme', savedTheme);
store.set('ui.tocVisible', false);

// Follow OS theme changes only when user hasn't set a manual preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.getItem('theme')) return;
  const next = e.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
});

// Start content service (loads pages.json, articles/index.md, sets up routing)
initContentService();
