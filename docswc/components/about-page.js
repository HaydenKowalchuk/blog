import { LitElement, html } from '../lib/lit.js';
import { store } from './app-store.js';
import { zeroMd } from './content-service.js';

class AboutPage extends LitElement {
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = store.subscribe('content.currentMarkdown', () => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  render() {
    return html`<div class="about"><div class="md-wrapper"></div><site-footer author="Hayden Kowalchuk" github="https://github.com/mrneo240" gitlab="https://gitlab.com/HaydenKow"></site-footer></div>`;
  }

  updated() {
    const wrapper = this.querySelector('.md-wrapper');
    if (wrapper) {
      const md = store.get('content.currentMarkdown', '');
      wrapper.innerHTML = md ? zeroMd(md) : '';
    }
  }
}

customElements.define('about-page', AboutPage);
