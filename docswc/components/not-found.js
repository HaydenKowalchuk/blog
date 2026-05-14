import { LitElement, html } from '../lib/lit.js';
import { router } from './app-router.js';

class NotFound extends LitElement {
  createRenderRoot() { return this; }

  render() {
    return html`
      <div class="page">
        <h2>404 — Not Found</h2>
        <p><a href="#/" @click=${(e) => { e.preventDefault(); router.navigate('/'); }}>← Back home</a></p>
      </div>
    `;
  }
}

customElements.define('not-found', NotFound);
