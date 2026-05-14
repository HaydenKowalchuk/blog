import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { zeroMd, formatDateLong } from './content-service.js';

class ArticleView extends LitElement {
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsubs = [
      store.subscribe('content.currentSlug', () => this.requestUpdate()),
      store.subscribe('content.currentMarkdown', () => this.requestUpdate()),
      store.subscribe('content.currentToc', () => this.requestUpdate()),
      store.subscribe('content.currentTopics', () => this.requestUpdate()),
      store.subscribe('content.articles', () => this.requestUpdate()),
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubs?.forEach(u => u());
  }

  _toggleTopics(e) {
    const btn = e.currentTarget;
    const container = btn.closest('.article-topics');
    if (!container) return;
    const content = container.querySelector('.topics-content');
    if (!content) return;
    const isOpen = content.classList.contains('open');
    content.classList.toggle('open', !isOpen);
    container.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  }

  render() {
    const slug = store.get('content.currentSlug', '');
    const articles = store.get('content.articles', []);
    const meta = slug ? articles.find(a => a.slug === slug) || null : null;
    const topics = store.get('content.currentTopics', []);

    return html`
      <article class="post">
        <div class="toc-sentinel" aria-hidden="true"></div>
        ${meta ? html`<h1>${meta.title}</h1>` : ''}
        ${meta ? html`
          <div class="post-metadata">
            <time datetime="${meta.date}">${formatDateLong(meta.date)}</time>
          </div>` : ''}
        <hr>
        ${topics.length ? html`
          <div class="article-topics">
            <button type="button" class="topics-preview" aria-expanded="false" aria-controls="article-topics-content"
                    @click=${this._toggleTopics}>
              <span class="toc-icon"></span>
              <span>What's inside this article</span>
              <span class="chevron"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></span>
            </button>
            <div id="article-topics-content" class="topics-content">
              <div class="topics-inner">
                <ul>${topics.map(item => html`<li>${item}</li>`)}</ul>
              </div>
            </div>
          </div>
          <hr>
        ` : ''}
        ${slug ? html`<div class="md-wrapper"></div>` : ''}
        <site-footer author="Hayden Kowalchuk" tagline="Hayden Kowalchuk's gamedev and interests." github="https://github.com/mrneo240" gitlab="https://gitlab.com/HaydenKow"></site-footer>
      </article>
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

customElements.define('article-view', ArticleView);
