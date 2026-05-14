class SiteFooter extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		const tagline = this.getAttribute("tagline") || "";
		const email = this.getAttribute("email") || "";
		const linkedin = this.getAttribute("linkedin") || "";
		const github = this.getAttribute("github") || "";
		const gitlab = this.getAttribute("gitlab") || "";

		const links = [];
		if (email) links.push(`<span>${email}</span>`);
		if (linkedin)
			links.push(
				`<a href="${linkedin}" target="_blank" rel="noopener">LinkedIn</a>`,
			);
		if (github)
			links.push(
				`<a href="${github}" target="_blank" rel="noopener">GitHub</a>`,
			);
		if (gitlab)
			links.push(
				`<a href="${gitlab}" target="_blank" rel="noopener">GitLab</a>`,
			);

		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`
      :host {
        display: block;
        margin-top: 2rem;
        color: var(--rp-subtle);
        font-size: 0.875rem;
      }
      hr {
        border: none;
        border-top: 1px solid var(--rp-hl-med);
        margin-bottom: 1rem;
      }
      p {
        margin: 0.4em 0;
        line-height: 1.6;
      }
      a {
        color: var(--rp-pine);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `);
		this.shadowRoot.adoptedStyleSheets = [sheet];

		this.shadowRoot.innerHTML = `
      <hr>
      ${tagline ? `<p>${tagline}</p>` : ""}
      ${links.length ? `<p>${links.join(" · ")}.</p>` : ""}
    `;
	}
}

customElements.define("site-footer", SiteFooter);
