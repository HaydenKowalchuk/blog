import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { zeroMd } from './content-service.js';
import './article-list.js';

class StaticPage extends LitElement {
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsubs = [
      store.subscribe('content.currentMarkdown', () => this.requestUpdate()),
      store.subscribe('content.articles', () => this.requestUpdate()),
      store.subscribe('url.path', () => this.requestUpdate()),
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubs?.forEach(u => u());
  }

  render() {
    const path = store.get('url.path', '/');
    const pageId = path.replace(/^\//, '');
    const allArticles = store.get('content.articles', []);
    const hasArticles = allArticles.some(a => a.categories && a.categories.includes(pageId));

    return html`
      <div class="page">
        <div class="md-wrapper"></div>
        ${hasArticles ? html`<hr class="section-divider">` : ''}
        ${hasArticles ? html`<article-list category="${pageId}"></article-list>` : ''}
        <site-footer author="Hayden Kowalchuk" tagline="Hayden Kowalchuk's gamedev and interests." github="https://github.com/mrneo240" gitlab="https://gitlab.com/HaydenKow"></site-footer>
      </div>
    `;
  }

  updated() {
    const wrapper = this.querySelector('.md-wrapper');
    if (wrapper) {
      const md = store.get('content.currentMarkdown', '');
      wrapper.innerHTML = md ? zeroMd(md) : '';
    }
  }
}

customElements.define('static-page', StaticPage);
