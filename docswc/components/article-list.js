import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { router } from './app-router.js';
import { formatDate } from './content-service.js';

class ArticleList extends LitElement {
  static properties = {
    category: { type: String },
  };

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = store.subscribe('content.articles', () => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  render() {
    const all = store.get('content.articles', []);
    const cat = this.category;
    const filtered = cat ? all.filter(a => a.categories && a.categories.includes(cat)) : all;
    const list = cat ? filtered.slice(0, 5) : filtered;

    if (!list.length) {
      return html`<p class="empty-state">No articles yet.</p>`;
    }

    return html`
      <ul class="posts-list">
        ${list.map(article => html`
          <li class="post-item">
            <a class="post-link" href="#/articles/${article.slug}"
               @click=${(e) => { e.preventDefault(); router.navigate('/articles/' + article.slug); }}>
              <span class="post-title">${article.title}</span>
              <span class="dots"></span>
              <span class="post-date">${formatDate(article.date)}</span>
            </a>
          </li>
        `)}
      </ul>
    `;
  }
}

customElements.define('article-list', ArticleList);
