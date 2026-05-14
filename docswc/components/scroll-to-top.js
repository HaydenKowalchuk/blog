class ScrollToTop extends HTMLElement {
	connectedCallback() {
		this.attachShadow({ mode: "open" });

		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`
      :host { display: block; }
      button {
        position: fixed;
        bottom: calc(1.75rem + env(safe-area-inset-bottom, 0px));
        right: calc(1.75rem + env(safe-area-inset-right, 0px));
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid var(--border-color, #ddd);
        background: var(--bg-color, #fff);
        color: var(--rp-subtle, #797593);
        cursor: pointer;
        padding: 0;
        opacity: 0;
        transform: translateY(6px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease,
                    background 0.15s ease, color 0.15s ease,
                    border-color 0.15s ease;
        -webkit-tap-highlight-color: transparent;
      }
      button.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      button:hover,
      button:focus-visible {
        background: var(--rp-hl-low, #f4ede8);
        color: var(--rp-pine, #286983);
        border-color: var(--rp-pine, #286983);
        outline: none;
      }
      button:active {
        transform: translateY(1px);
      }
    `);
		this.shadowRoot.adoptedStyleSheets = [sheet];

		this.shadowRoot.innerHTML = `
      <button aria-label="Scroll to top" title="Scroll to top">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>`;

		this._btn = this.shadowRoot.querySelector("button");
		this._btn.addEventListener("click", () => this._scrollToTop());

		this._sentinel = document.createElement("div");
		this._sentinel.className = "scroll-sentinel";
		document.body.prepend(this._sentinel);

		this._observer = new IntersectionObserver(([entry]) => {
			this._btn.classList.toggle("visible", !entry.isIntersecting);
		});
		this._observer.observe(this._sentinel);
	}

	disconnectedCallback() {
		this._observer.disconnect();
		this._sentinel?.remove();
	}

	_scrollToTop() {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reducedMotion) {
			window.scrollTo(0, 0);
		} else if ("scrollBehavior" in document.documentElement.style) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			const start = window.scrollY;
			const startTime = performance.now();
			const duration = 380;
			// ease-in-out quad
			const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
			const step = (now) => {
				const p = Math.min((now - startTime) / duration, 1);
				window.scrollTo(0, start * (1 - ease(p)));
				if (p < 1) requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		}
	}
}

customElements.define("scroll-to-top", ScrollToTop);
