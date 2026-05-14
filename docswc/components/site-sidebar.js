import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { router } from './app-router.js';
import { headingSlug } from './content-service.js';

// Scroll to heading inside zero-md shadow DOM
function scrollToHeading(headingText) {
  const slug = headingSlug(headingText);
  const zeroMdEl = document.querySelector('.post zero-md');
  if (!zeroMdEl?.shadowRoot) return;
  const el = zeroMdEl.shadowRoot.getElementById(slug);
  if (!el) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
}

const MOON_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9.37 5.51C9.19 6.15 9.1 6.82 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7C5 9.07 6.81 6.55 9.37 5.51zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>`;
const MONITOR_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v1h12v-1l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/></svg>`;
const SUN_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>`;

class SiteSidebar extends LitElement {
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsubs = [
      store.subscribe('url.path', () => this.requestUpdate()),
      store.subscribe('content.pages', () => this.requestUpdate()),
      store.subscribe('content.currentToc', () => this.requestUpdate()),
      store.subscribe('ui.tocVisible', () => this.requestUpdate()),
      store.subscribe('ui.theme', () => this.requestUpdate()),
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubs?.forEach(u => u());
  }

  _toggleTheme() {
    const cycle = { light: 'dark', dark: 'system', system: 'light' };
    const current = store.get('ui.theme', 'system');
    const next = cycle[current] ?? 'system';
    store.set('ui.theme', next);
    if (next === 'system') {
      localStorage.removeItem('theme');
      const effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', effective);
    } else {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  _isActive(id) {
    const path = store.get('url.path', '/');
    if (id === '/') return path === '/';
    return path.startsWith(`/${id}`);
  }

  updated() {
    const iconEl = this.querySelector('#theme-icon');
    if (iconEl) {
      const theme = store.get('ui.theme', 'system');
      iconEl.innerHTML = theme === 'light' ? MOON_SVG : theme === 'dark' ? MONITOR_SVG : SUN_SVG;
    }
  }

  render() {
    const path = store.get('url.path', '/');
    const pages = store.get('content.pages', []);
    const toc = store.get('content.currentToc', []);
    const tocVisible = store.get('ui.tocVisible', false);
    const theme = store.get('ui.theme', 'system');
    const isArticle = /^\/articles\/[^/]+/.test(path);
    const asideClass = 'sidebar' + (isArticle && tocVisible ? ' toc-active' : '');

    const themeLabel = theme === 'light' ? 'Switch to dark theme' : theme === 'dark' ? 'Switch to system theme' : 'Switch to light theme';
    const themeTitle = theme === 'light' ? 'Dark' : theme === 'dark' ? 'System' : 'Light';

    return html`
      <aside class="${asideClass}" aria-label="Sidebar">
        <nav aria-label="Site navigation">
          <ul class="nav-links">
            <li>
              <a href="#/" class="${this._isActive('/') ? 'active' : ''}"
                 aria-current="${this._isActive('/') ? 'page' : ''}"
                 @click=${(e) => { e.preventDefault(); router.navigate('/'); }}>about</a>
            </li>
            <li>
              <a href="#/articles" class="${this._isActive('articles') ? 'active' : ''}"
                 aria-current="${this._isActive('articles') ? 'page' : ''}"
                 @click=${(e) => { e.preventDefault(); router.navigate('/articles'); }}>articles</a>
            </li>
            ${pages.filter(p => p.nav).map(p => html`
              <li>
                <a href="#/${p.id}" class="${this._isActive(p.id) ? 'active' : ''}"
                   aria-current="${this._isActive(p.id) ? 'page' : ''}"
                   @click=${(e) => { e.preventDefault(); router.navigate('/' + p.id); }}>${p.title}</a>
              </li>
            `)}
            <li class="theme-switch-item">
              <button id="theme-toggle" aria-label="${themeLabel}" title="${themeTitle}"
                      @click=${this._toggleTheme}>
                <span id="theme-icon"></span>
              </button>
            </li>
          </ul>
        </nav>
        ${isArticle && toc.length ? html`
          <nav aria-label="Table of contents"
               class="post-toc${tocVisible ? ' is-visible' : ''}">
            <div class="toc-title">Sections</div>
            <ul>
              ${toc.map(item => html`
                <li>
                  <a href="#${headingSlug(item)}"
                     tabindex="${tocVisible ? '0' : '-1'}"
                     @click=${(e) => { e.preventDefault(); scrollToHeading(item); }}>${item}</a>
                </li>
              `)}
            </ul>
          </nav>
        ` : ''}
      </aside>
    `;
  }
}

customElements.define('site-sidebar', SiteSidebar);
