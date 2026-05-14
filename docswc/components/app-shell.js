import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { router } from './app-router.js';
import './site-sidebar.js';
import './about-page.js';
import './article-list.js';
import './article-view.js';
import './static-page.js';
import './not-found.js';

class AppShell extends LitElement {
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsubs = [
      store.subscribe('url.path', () => this.requestUpdate()),
      store.subscribe('content.pages', () => this.requestUpdate()),
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubs?.forEach(u => u());
  }

  _routeContent() {
    const path = store.get('url.path', '/');
    const parts = path.split('/').filter(Boolean);

    if (parts[0] === 'articles' && parts[1]) return html`<article-view></article-view>`;
    if (path === '/articles') return html`<div class="page"><article-list></article-list></div>`;
    if (path === '/' || !path) return html`<about-page></about-page>`;

    const pages = store.get('content.pages', []);
    if (pages.some(p => `/${p.id}` === path)) return html`<static-page></static-page>`;

    return html`<not-found></not-found>`;
  }

  render() {
    return html`
      <div class="container">
        <site-sidebar></site-sidebar>
        <main id="main-content" class="content">
          ${this._routeContent()}
        </main>
      </div>
    `;
  }
}

customElements.define('app-shell', AppShell);
