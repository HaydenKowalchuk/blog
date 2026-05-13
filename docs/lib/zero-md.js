var Cn = Object.defineProperty;
var Fn = (t, e, n) => e in t ? Cn(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var R = (t, e, n) => Fn(t, typeof e != "symbol" ? e + "" : e, n);
class An extends HTMLElement {
  get src() {
    return this.getAttribute("src");
  }
  set src(e) {
    e ? this.setAttribute("src", e) : this.removeAttribute("src");
  }
  get auto() {
    return !this.hasAttribute("no-auto");
  }
  get bodyClass() {
    const e = this.getAttribute("body-class");
    return `markdown-body${e ? " " + e : ""}`;
  }
  constructor() {
    super();
    try {
      this.version = "3.1.7";
    } catch {
    }
    this.template = "";
    const e = (n) => {
      var a;
      if (n.metaKey || n.ctrlKey || n.altKey || n.shiftKey || n.defaultPrevented) return;
      const o = (a = n.target) == null ? void 0 : a.closest("a");
      o && o.hash && o.host === location.host && o.pathname === location.pathname && this.goto(o.hash);
    };
    this._clicked = e.bind(this), this._observer = new MutationObserver(() => {
      this._observe(), this.auto && this.render();
    }), this._loaded = !1, this.root = this;
  }
  static get observedAttributes() {
    return ["src", "body-class"];
  }
  /**
   * @param {string} name
   * @param {string} old
   * @param {string} val
   */
  attributeChangedCallback(e, n, o) {
    var a;
    if (this.ready && n !== o)
      switch (e) {
        case "body-class":
          (a = this.root.querySelector(".markdown-body")) == null || a.setAttribute("class", this.bodyClass);
          break;
        case "src":
          this.auto && this.render();
      }
  }
  async connectedCallback() {
    var e;
    this._loaded || (await this.load(), this.hasAttribute("no-shadow") || (this.root = this.attachShadow({ mode: "open" })), this.root.prepend(
      this.frag(`<div class="markdown-styles"></div><div class="${this.bodyClass}"></div>`)
    ), this._loaded = !0), (e = this.shadowRoot) == null || e.addEventListener("click", this._clicked), this._observer.observe(this, { childList: !0 }), this._observe(), this.ready = !0, this.fire("zero-md-ready"), this.auto && this.render();
  }
  disconnectedCallback() {
    var e;
    (e = this.shadowRoot) == null || e.removeEventListener("click", this._clicked), this._observer.disconnect(), this.ready = !1;
  }
  _observe() {
    this.querySelectorAll('template,script[type="text/markdown"]').forEach(
      (e) => this._observer.observe(e.content || e, {
        childList: !0,
        subtree: !0,
        attributes: !0,
        characterData: !0
      })
    );
  }
  /**
   * Async load function that runs after constructor. Like constructor, only runs once.
   * @returns {Promise<*>}
   */
  async load() {
  }
  /**
   * Async parse function that takes in markdown and returns the html-formatted string.
   * Can use any md parser you prefer, like marked.js
   * @param {ZeroMdRenderObject} obj
   * @returns {Promise<string>}
   */
  async parse({ text: e = "" }) {
    return e;
  }
  /**
   * Scroll to heading id
   * @param {string} id
   */
  goto(e) {
    var o;
    const n = this.shadowRoot || document;
    e && ((o = n.getElementById(decodeURIComponent(e[0] === "#" ? e.slice(1) : e))) == null || o.scrollIntoView());
  }
  /**
   * Convert html string to document fragment
   * @param {string} html
   * @returns {DocumentFragment}
   */
  frag(e) {
    const n = document.createElement("template");
    return n.innerHTML = e, n.content;
  }
  /**
   * Compute 32-bit DJB2a hash in base36
   * @param {string} str
   * @returns {string}
   */
  hash(e) {
    let n = 5381;
    for (let o = 0; o < e.length; o++)
      n = (n << 5) + n ^ e.charCodeAt(o);
    return (n >>> 0).toString(36);
  }
  /**
   * Await the next tick
   * @returns {Promise<*>}
   */
  tick() {
    return new Promise((e) => requestAnimationFrame(e));
  }
  /**
   * Fire custom event
   * @param {string} name
   * @param {*} [detail]
   */
  fire(e, n = {}) {
    this.dispatchEvent(new CustomEvent(e, { detail: n, bubbles: !0 }));
  }
  /**
   * Retrieve raw style templates and markdown strings
   * @param {ZeroMdRenderObject} obj
   * @returns {Promise<ZeroMdRenderObject>}
   */
  async read(e) {
    const { target: n } = e, o = (a = "", r = "") => {
      var l;
      const i = this.hash(a), s = ((l = this.root.querySelector(`.markdown-${n}`)) == null ? void 0 : l.getAttribute("data-hash")) !== i;
      return { ...e, text: a, hash: i, changed: s, baseUrl: r };
    };
    switch (n) {
      case "styles": {
        const a = (r = "") => {
          var i;
          return (i = this.querySelector(r)) == null ? void 0 : i.innerHTML;
        };
        return o(
          (a("template[data-prepend]") ?? "") + (a("template:not([data-prepend],[data-append])") ?? this.template) + (a("template[data-append]") ?? "")
        );
      }
      case "body": {
        if (this.src) {
          const r = await fetch(this.src);
          if (r.ok) {
            const i = () => {
              const s = document.createElement("a");
              return s.href = this.src || "", s.href.substring(0, s.href.lastIndexOf("/") + 1);
            };
            return o(await r.text(), i());
          } else
            console.warn("[zero-md] error reading src", this.src);
        }
        const a = this.querySelector('script[type="text/markdown"]');
        return o((a == null ? void 0 : a.text) || "");
      }
      default:
        return o();
    }
  }
  /**
   * Stamp parsed html strings into dom
   * @param {ZeroMdRenderObject} obj
   * @returns {Promise<ZeroMdRenderObject>}
   */
  async stamp(e) {
    const { target: n, text: o = "", hash: a = "" } = e, r = this.root.querySelector(`.markdown-${n}`);
    if (!r) return e;
    r.setAttribute("data-hash", a);
    const i = this.frag(o), s = Array.from(i.querySelectorAll('link[rel="stylesheet"]') || []), l = Promise.all(
      s.map(
        (d) => new Promise((c) => {
          d.onload = c, d.onerror = (b) => {
            console.warn("[zero-md] error loading stylesheet", d.href), c(b);
          };
        })
      )
    );
    return r.innerHTML = "", r.append(i), await l, { ...e, stamped: !0 };
  }
  /**
   * Start rendering
   * @param {{ fire?: boolean, goto?: string|false }} obj
   * @returns {Promise<*>}
   */
  async render({ fire: e = !0, goto: n = location.hash } = {}) {
    const o = await this.read({ target: "styles" }), a = o.changed && this.stamp(o), r = await this.read({ target: "body" });
    if (r.changed) {
      const s = this.parse(r);
      await a, await this.tick(), await this.stamp({ ...r, text: await s });
    } else await a;
    await this.tick();
    const i = { styles: o.changed, body: r.changed };
    return e && this.fire("zero-md-rendered", i), this.auto && n && this.goto(n), i;
  }
}
const Nn = `.markdown-body{--base-size-16: 1rem;--base-size-24: 1.5rem;--base-size-4: .25rem;--base-size-40: 2.5rem;--base-size-8: .5rem;--base-text-weight-medium: 500;--base-text-weight-normal: 400;--base-text-weight-semibold: 600;--fontStack-monospace: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;--fontStack-sansSerif: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";--fgColor-accent: Highlight}@media (prefers-color-scheme: dark){.markdown-body,[data-theme=dark]{color-scheme:dark;--fgColor-accent: #4493f8;--bgColor-attention-muted: #bb800926;--bgColor-default: #0d1117;--bgColor-muted: #151b23;--bgColor-neutral-muted: #656c7633;--borderColor-accent-emphasis: #1f6feb;--borderColor-attention-emphasis: #9e6a03;--borderColor-danger-emphasis: #da3633;--borderColor-default: #3d444d;--borderColor-done-emphasis: #8957e5;--borderColor-success-emphasis: #238636;--color-prettylights-syntax-brackethighlighter-angle: #9198a1;--color-prettylights-syntax-brackethighlighter-unmatched: #f85149;--color-prettylights-syntax-carriage-return-bg: #b62324;--color-prettylights-syntax-carriage-return-text: #f0f6fc;--color-prettylights-syntax-comment: #9198a1;--color-prettylights-syntax-constant: #79c0ff;--color-prettylights-syntax-constant-other-reference-link: #a5d6ff;--color-prettylights-syntax-entity: #d2a8ff;--color-prettylights-syntax-entity-tag: #7ee787;--color-prettylights-syntax-keyword: #ff7b72;--color-prettylights-syntax-markup-bold: #f0f6fc;--color-prettylights-syntax-markup-changed-bg: #5a1e02;--color-prettylights-syntax-markup-changed-text: #ffdfb6;--color-prettylights-syntax-markup-deleted-bg: #67060c;--color-prettylights-syntax-markup-deleted-text: #ffdcd7;--color-prettylights-syntax-markup-heading: #1f6feb;--color-prettylights-syntax-markup-ignored-bg: #1158c7;--color-prettylights-syntax-markup-ignored-text: #f0f6fc;--color-prettylights-syntax-markup-inserted-bg: #033a16;--color-prettylights-syntax-markup-inserted-text: #aff5b4;--color-prettylights-syntax-markup-italic: #f0f6fc;--color-prettylights-syntax-markup-list: #f2cc60;--color-prettylights-syntax-meta-diff-range: #d2a8ff;--color-prettylights-syntax-storage-modifier-import: #f0f6fc;--color-prettylights-syntax-string: #a5d6ff;--color-prettylights-syntax-string-regexp: #7ee787;--color-prettylights-syntax-sublimelinter-gutter-mark: #3d444d;--color-prettylights-syntax-variable: #ffa657;--fgColor-attention: #d29922;--fgColor-danger: #f85149;--fgColor-default: #f0f6fc;--fgColor-done: #ab7df8;--fgColor-muted: #9198a1;--fgColor-success: #3fb950;--borderColor-muted: #3d444db3;--color-prettylights-syntax-invalid-illegal-bg: var(--bgColor-danger-muted);--color-prettylights-syntax-invalid-illegal-text: var(--fgColor-danger);--focus-outlineColor: var(--borderColor-accent-emphasis);--borderColor-neutral-muted: var(--borderColor-muted)}}@media (prefers-color-scheme: light){.markdown-body,[data-theme=light]{color-scheme:light;--fgColor-danger: #d1242f;--bgColor-attention-muted: #fff8c5;--bgColor-muted: #f6f8fa;--bgColor-neutral-muted: #818b981f;--borderColor-accent-emphasis: #0969da;--borderColor-attention-emphasis: #9a6700;--borderColor-danger-emphasis: #cf222e;--borderColor-default: #d1d9e0;--borderColor-done-emphasis: #8250df;--borderColor-success-emphasis: #1a7f37;--color-prettylights-syntax-brackethighlighter-angle: #59636e;--color-prettylights-syntax-brackethighlighter-unmatched: #82071e;--color-prettylights-syntax-carriage-return-bg: #cf222e;--color-prettylights-syntax-carriage-return-text: #f6f8fa;--color-prettylights-syntax-comment: #59636e;--color-prettylights-syntax-constant: #0550ae;--color-prettylights-syntax-constant-other-reference-link: #0a3069;--color-prettylights-syntax-entity: #6639ba;--color-prettylights-syntax-entity-tag: #0550ae;--color-prettylights-syntax-invalid-illegal-text: var(--fgColor-danger);--color-prettylights-syntax-keyword: #cf222e;--color-prettylights-syntax-markup-changed-bg: #ffd8b5;--color-prettylights-syntax-markup-changed-text: #953800;--color-prettylights-syntax-markup-deleted-bg: #ffebe9;--color-prettylights-syntax-markup-deleted-text: #82071e;--color-prettylights-syntax-markup-heading: #0550ae;--color-prettylights-syntax-markup-ignored-bg: #0550ae;--color-prettylights-syntax-markup-ignored-text: #d1d9e0;--color-prettylights-syntax-markup-inserted-bg: #dafbe1;--color-prettylights-syntax-markup-inserted-text: #116329;--color-prettylights-syntax-markup-list: #3b2300;--color-prettylights-syntax-meta-diff-range: #8250df;--color-prettylights-syntax-string: #0a3069;--color-prettylights-syntax-string-regexp: #116329;--color-prettylights-syntax-sublimelinter-gutter-mark: #818b98;--color-prettylights-syntax-variable: #953800;--fgColor-accent: #0969da;--fgColor-attention: #9a6700;--fgColor-done: #8250df;--fgColor-muted: #59636e;--fgColor-success: #1a7f37;--bgColor-default: #ffffff;--borderColor-muted: #d1d9e0b3;--color-prettylights-syntax-invalid-illegal-bg: var(--bgColor-danger-muted);--color-prettylights-syntax-markup-bold: #1f2328;--color-prettylights-syntax-markup-italic: #1f2328;--color-prettylights-syntax-storage-modifier-import: #1f2328;--fgColor-default: #1f2328;--focus-outlineColor: var(--borderColor-accent-emphasis);--borderColor-neutral-muted: var(--borderColor-muted)}}.markdown-body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;margin:0;font-weight:var(--base-text-weight-normal, 400);color:var(--fgColor-default);background-color:var(--bgColor-default);font-family:var(--fontStack-sansSerif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji");font-size:16px;line-height:1.5;word-wrap:break-word}.markdown-body a{text-decoration:underline;text-underline-offset:.2rem}.markdown-body .octicon{display:inline-block;fill:currentColor;vertical-align:text-bottom}.markdown-body h1:hover .anchor .octicon-link:before,.markdown-body h2:hover .anchor .octicon-link:before,.markdown-body h3:hover .anchor .octicon-link:before,.markdown-body h4:hover .anchor .octicon-link:before,.markdown-body h5:hover .anchor .octicon-link:before,.markdown-body h6:hover .anchor .octicon-link:before{width:16px;height:16px;content:" ";display:inline-block;background-color:currentColor;-webkit-mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>")}.markdown-body details,.markdown-body figcaption,.markdown-body figure{display:block}.markdown-body summary{display:list-item}.markdown-body [hidden]{display:none!important}.markdown-body a{background-color:#0000;color:var(--fgColor-accent);text-decoration:none}.markdown-body abbr[title]{border-bottom:none;-webkit-text-decoration:underline dotted;text-decoration:underline dotted}.markdown-body b,.markdown-body strong{font-weight:var(--base-text-weight-semibold, 600)}.markdown-body dfn{font-style:italic}.markdown-body h1{margin:.67em 0;font-weight:var(--base-text-weight-semibold, 600);padding-bottom:.3em;font-size:2em;border-bottom:1px solid var(--borderColor-muted)}.markdown-body mark{background-color:var(--bgColor-attention-muted);color:var(--fgColor-default)}.markdown-body small{font-size:90%}.markdown-body sub,.markdown-body sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}.markdown-body sub{bottom:-.25em}.markdown-body sup{top:-.5em}.markdown-body img{border-style:none;max-width:100%;box-sizing:content-box}.markdown-body code,.markdown-body kbd,.markdown-body pre,.markdown-body samp{font-family:monospace;font-size:1em}.markdown-body figure{margin:1em var(--base-size-40)}.markdown-body hr{box-sizing:content-box;overflow:hidden;background:#0000;border-bottom:1px solid var(--borderColor-muted);height:.25em;padding:0;margin:var(--base-size-24) 0;background-color:var(--borderColor-default);border:0}.markdown-body input{font:inherit;margin:0;overflow:visible;font-family:inherit;font-size:inherit;line-height:inherit}.markdown-body [type=button],.markdown-body [type=reset],.markdown-body [type=submit]{-webkit-appearance:button;-moz-appearance:button;appearance:button}.markdown-body [type=checkbox],.markdown-body [type=radio]{box-sizing:border-box;padding:0}.markdown-body [type=number]::-webkit-inner-spin-button,.markdown-body [type=number]::-webkit-outer-spin-button{height:auto}.markdown-body [type=search]::-webkit-search-cancel-button,.markdown-body [type=search]::-webkit-search-decoration{-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body ::-webkit-input-placeholder{color:inherit;opacity:.54}.markdown-body ::-webkit-file-upload-button{-webkit-appearance:button;-moz-appearance:button;appearance:button;font:inherit}.markdown-body a:hover{text-decoration:underline}.markdown-body ::placeholder{color:var(--fgColor-muted);opacity:1}.markdown-body hr:before{display:table;content:""}.markdown-body hr:after{display:table;clear:both;content:""}.markdown-body table{border-spacing:0;border-collapse:collapse;display:block;width:max-content;max-width:100%;overflow:auto;font-variant:tabular-nums}.markdown-body td,.markdown-body th{padding:0}.markdown-body details summary{cursor:pointer}.markdown-body a:focus,.markdown-body [role=button]:focus,.markdown-body input[type=radio]:focus,.markdown-body input[type=checkbox]:focus{outline:2px solid var(--focus-outlineColor);outline-offset:-2px;box-shadow:none}.markdown-body a:focus:not(:focus-visible),.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body input[type=radio]:focus:not(:focus-visible),.markdown-body input[type=checkbox]:focus:not(:focus-visible){outline:solid 1px rgba(0,0,0,0)}.markdown-body a:focus-visible,.markdown-body [role=button]:focus-visible,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus-visible{outline:2px solid var(--focus-outlineColor);outline-offset:-2px;box-shadow:none}.markdown-body a:not([class]):focus,.markdown-body a:not([class]):focus-visible,.markdown-body input[type=radio]:focus,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus,.markdown-body input[type=checkbox]:focus-visible{outline-offset:0}.markdown-body kbd{display:inline-block;padding:var(--base-size-4);font:11px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);line-height:10px;color:var(--fgColor-default);vertical-align:middle;background-color:var(--bgColor-muted);border:solid 1px var(--borderColor-neutral-muted);border-bottom-color:var(--borderColor-neutral-muted);border-radius:6px;box-shadow:inset 0 -1px 0 var(--borderColor-neutral-muted)}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:var(--base-size-24);margin-bottom:var(--base-size-16);font-weight:var(--base-text-weight-semibold, 600);line-height:1.25}.markdown-body h2{font-weight:var(--base-text-weight-semibold, 600);padding-bottom:.3em;font-size:1.5em;border-bottom:1px solid var(--borderColor-muted)}.markdown-body h3{font-weight:var(--base-text-weight-semibold, 600);font-size:1.25em}.markdown-body h4{font-weight:var(--base-text-weight-semibold, 600);font-size:1em}.markdown-body h5{font-weight:var(--base-text-weight-semibold, 600);font-size:.875em}.markdown-body h6{font-weight:var(--base-text-weight-semibold, 600);font-size:.85em;color:var(--fgColor-muted)}.markdown-body p{margin-top:0;margin-bottom:10px}.markdown-body blockquote{margin:0;padding:0 1em;color:var(--fgColor-muted);border-left:.25em solid var(--borderColor-default)}.markdown-body ul,.markdown-body ol{margin-top:0;margin-bottom:0;padding-left:2em}.markdown-body ol ol,.markdown-body ul ol{list-style-type:lower-roman}.markdown-body ul ul ol,.markdown-body ul ol ol,.markdown-body ol ul ol,.markdown-body ol ol ol{list-style-type:lower-alpha}.markdown-body dd{margin-left:0}.markdown-body tt,.markdown-body code,.markdown-body samp{font-family:var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);font-size:12px}.markdown-body pre{margin-top:0;margin-bottom:0;font-family:var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);font-size:12px;word-wrap:normal}.markdown-body .octicon{display:inline-block;overflow:visible!important;vertical-align:text-bottom;fill:currentColor}.markdown-body input::-webkit-outer-spin-button,.markdown-body input::-webkit-inner-spin-button{margin:0;-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body .mr-2{margin-right:var(--base-size-8, 8px)!important}.markdown-body:before{display:table;content:""}.markdown-body:after{display:table;clear:both;content:""}.markdown-body>*:first-child{margin-top:0!important}.markdown-body>*:last-child{margin-bottom:0!important}.markdown-body a:not([href]){color:inherit;text-decoration:none}.markdown-body .absent{color:var(--fgColor-danger)}.markdown-body .anchor{float:left;padding-right:var(--base-size-4);margin-left:-20px;line-height:1}.markdown-body .anchor:focus{outline:none}.markdown-body p,.markdown-body blockquote,.markdown-body ul,.markdown-body ol,.markdown-body dl,.markdown-body table,.markdown-body pre,.markdown-body details{margin-top:0;margin-bottom:var(--base-size-16)}.markdown-body blockquote>:first-child{margin-top:0}.markdown-body blockquote>:last-child{margin-bottom:0}.markdown-body h1 .octicon-link,.markdown-body h2 .octicon-link,.markdown-body h3 .octicon-link,.markdown-body h4 .octicon-link,.markdown-body h5 .octicon-link,.markdown-body h6 .octicon-link{color:var(--fgColor-default);vertical-align:middle;visibility:hidden}.markdown-body h1:hover .anchor,.markdown-body h2:hover .anchor,.markdown-body h3:hover .anchor,.markdown-body h4:hover .anchor,.markdown-body h5:hover .anchor,.markdown-body h6:hover .anchor{text-decoration:none}.markdown-body h1:hover .anchor .octicon-link,.markdown-body h2:hover .anchor .octicon-link,.markdown-body h3:hover .anchor .octicon-link,.markdown-body h4:hover .anchor .octicon-link,.markdown-body h5:hover .anchor .octicon-link,.markdown-body h6:hover .anchor .octicon-link{visibility:visible}.markdown-body h1 tt,.markdown-body h1 code,.markdown-body h2 tt,.markdown-body h2 code,.markdown-body h3 tt,.markdown-body h3 code,.markdown-body h4 tt,.markdown-body h4 code,.markdown-body h5 tt,.markdown-body h5 code,.markdown-body h6 tt,.markdown-body h6 code{padding:0 .2em;font-size:inherit}.markdown-body summary h1,.markdown-body summary h2,.markdown-body summary h3,.markdown-body summary h4,.markdown-body summary h5,.markdown-body summary h6{display:inline-block}.markdown-body summary h1 .anchor,.markdown-body summary h2 .anchor,.markdown-body summary h3 .anchor,.markdown-body summary h4 .anchor,.markdown-body summary h5 .anchor,.markdown-body summary h6 .anchor{margin-left:-40px}.markdown-body summary h1,.markdown-body summary h2{padding-bottom:0;border-bottom:0}.markdown-body ul.no-list,.markdown-body ol.no-list{padding:0;list-style-type:none}.markdown-body ol[type="a s"]{list-style-type:lower-alpha}.markdown-body ol[type="A s"]{list-style-type:upper-alpha}.markdown-body ol[type="i s"]{list-style-type:lower-roman}.markdown-body ol[type="I s"]{list-style-type:upper-roman}.markdown-body ol[type="1"]{list-style-type:decimal}.markdown-body div>ol:not([type]){list-style-type:decimal}.markdown-body ul ul,.markdown-body ul ol,.markdown-body ol ol,.markdown-body ol ul{margin-top:0;margin-bottom:0}.markdown-body li>p{margin-top:var(--base-size-16)}.markdown-body li+li{margin-top:.25em}.markdown-body dl{padding:0}.markdown-body dl dt{padding:0;margin-top:var(--base-size-16);font-size:1em;font-style:italic;font-weight:var(--base-text-weight-semibold, 600)}.markdown-body dl dd{padding:0 var(--base-size-16);margin-bottom:var(--base-size-16)}.markdown-body table th{font-weight:var(--base-text-weight-semibold, 600)}.markdown-body table th,.markdown-body table td{padding:6px 13px;border:1px solid var(--borderColor-default)}.markdown-body table td>:last-child{margin-bottom:0}.markdown-body table tr{background-color:var(--bgColor-default);border-top:1px solid var(--borderColor-muted)}.markdown-body table tr:nth-child(2n){background-color:var(--bgColor-muted)}.markdown-body table img{background-color:#0000}.markdown-body img[align=right]{padding-left:20px}.markdown-body img[align=left]{padding-right:20px}.markdown-body .emoji{max-width:none;vertical-align:text-top;background-color:#0000}.markdown-body span.frame{display:block;overflow:hidden}.markdown-body span.frame>span{display:block;float:left;width:auto;padding:7px;margin:13px 0 0;overflow:hidden;border:1px solid var(--borderColor-default)}.markdown-body span.frame span img{display:block;float:left}.markdown-body span.frame span span{display:block;padding:5px 0 0;clear:both;color:var(--fgColor-default)}.markdown-body span.align-center{display:block;overflow:hidden;clear:both}.markdown-body span.align-center>span{display:block;margin:13px auto 0;overflow:hidden;text-align:center}.markdown-body span.align-center span img{margin:0 auto;text-align:center}.markdown-body span.align-right{display:block;overflow:hidden;clear:both}.markdown-body span.align-right>span{display:block;margin:13px 0 0;overflow:hidden;text-align:right}.markdown-body span.align-right span img{margin:0;text-align:right}.markdown-body span.float-left{display:block;float:left;margin-right:13px;overflow:hidden}.markdown-body span.float-left span{margin:13px 0 0}.markdown-body span.float-right{display:block;float:right;margin-left:13px;overflow:hidden}.markdown-body span.float-right>span{display:block;margin:13px auto 0;overflow:hidden;text-align:right}.markdown-body code,.markdown-body tt{padding:.2em .4em;margin:0;font-size:85%;white-space:break-spaces;background-color:var(--bgColor-neutral-muted);border-radius:6px}.markdown-body code br,.markdown-body tt br{display:none}.markdown-body del code{text-decoration:inherit}.markdown-body samp{font-size:85%}.markdown-body pre code{font-size:100%}.markdown-body pre>code{padding:0;margin:0;word-break:normal;white-space:pre;background:#0000;border:0}.markdown-body .highlight{margin-bottom:var(--base-size-16)}.markdown-body .highlight pre{margin-bottom:0;word-break:normal}.markdown-body .highlight pre,.markdown-body pre{padding:var(--base-size-16);overflow:auto;font-size:85%;line-height:1.45;color:var(--fgColor-default);background-color:var(--bgColor-muted);border-radius:6px}.markdown-body pre code,.markdown-body pre tt{display:inline;padding:0;margin:0;overflow:visible;line-height:inherit;word-wrap:normal;background-color:#0000;border:0}.markdown-body .csv-data td,.markdown-body .csv-data th{padding:5px;overflow:hidden;font-size:12px;line-height:1;text-align:left;white-space:nowrap}.markdown-body .csv-data .blob-num{padding:10px var(--base-size-8) 9px;text-align:right;background:var(--bgColor-default);border:0}.markdown-body .csv-data tr{border-top:0}.markdown-body .csv-data th{font-weight:var(--base-text-weight-semibold, 600);background:var(--bgColor-muted);border-top:0}.markdown-body [data-footnote-ref]:before{content:"["}.markdown-body [data-footnote-ref]:after{content:"]"}.markdown-body .footnotes{font-size:12px;color:var(--fgColor-muted);border-top:1px solid var(--borderColor-default)}.markdown-body .footnotes ol{padding-left:var(--base-size-16)}.markdown-body .footnotes ol ul{display:inline-block;padding-left:var(--base-size-16);margin-top:var(--base-size-16)}.markdown-body .footnotes li{position:relative}.markdown-body .footnotes li:target:before{position:absolute;top:calc(var(--base-size-8)*-1);right:calc(var(--base-size-8)*-1);bottom:calc(var(--base-size-8)*-1);left:calc(var(--base-size-24)*-1);pointer-events:none;content:"";border:2px solid var(--borderColor-accent-emphasis);border-radius:6px}.markdown-body .footnotes li:target{color:var(--fgColor-default)}.markdown-body .footnotes .data-footnote-backref g-emoji{font-family:monospace}.markdown-body .pl-c{color:var(--color-prettylights-syntax-comment)}.markdown-body .pl-c1,.markdown-body .pl-s .pl-v{color:var(--color-prettylights-syntax-constant)}.markdown-body .pl-e,.markdown-body .pl-en{color:var(--color-prettylights-syntax-entity)}.markdown-body .pl-smi,.markdown-body .pl-s .pl-s1{color:var(--color-prettylights-syntax-storage-modifier-import)}.markdown-body .pl-ent{color:var(--color-prettylights-syntax-entity-tag)}.markdown-body .pl-k{color:var(--color-prettylights-syntax-keyword)}.markdown-body .pl-s,.markdown-body .pl-pds,.markdown-body .pl-s .pl-pse .pl-s1,.markdown-body .pl-sr,.markdown-body .pl-sr .pl-cce,.markdown-body .pl-sr .pl-sre,.markdown-body .pl-sr .pl-sra{color:var(--color-prettylights-syntax-string)}.markdown-body .pl-v,.markdown-body .pl-smw{color:var(--color-prettylights-syntax-variable)}.markdown-body .pl-bu{color:var(--color-prettylights-syntax-brackethighlighter-unmatched)}.markdown-body .pl-ii{color:var(--color-prettylights-syntax-invalid-illegal-text);background-color:var(--color-prettylights-syntax-invalid-illegal-bg)}.markdown-body .pl-c2{color:var(--color-prettylights-syntax-carriage-return-text);background-color:var(--color-prettylights-syntax-carriage-return-bg)}.markdown-body .pl-sr .pl-cce{font-weight:700;color:var(--color-prettylights-syntax-string-regexp)}.markdown-body .pl-ml{color:var(--color-prettylights-syntax-markup-list)}.markdown-body .pl-mh,.markdown-body .pl-mh .pl-en,.markdown-body .pl-ms{font-weight:700;color:var(--color-prettylights-syntax-markup-heading)}.markdown-body .pl-mi{font-style:italic;color:var(--color-prettylights-syntax-markup-italic)}.markdown-body .pl-mb{font-weight:700;color:var(--color-prettylights-syntax-markup-bold)}.markdown-body .pl-md{color:var(--color-prettylights-syntax-markup-deleted-text);background-color:var(--color-prettylights-syntax-markup-deleted-bg)}.markdown-body .pl-mi1{color:var(--color-prettylights-syntax-markup-inserted-text);background-color:var(--color-prettylights-syntax-markup-inserted-bg)}.markdown-body .pl-mc{color:var(--color-prettylights-syntax-markup-changed-text);background-color:var(--color-prettylights-syntax-markup-changed-bg)}.markdown-body .pl-mi2{color:var(--color-prettylights-syntax-markup-ignored-text);background-color:var(--color-prettylights-syntax-markup-ignored-bg)}.markdown-body .pl-mdr{font-weight:700;color:var(--color-prettylights-syntax-meta-diff-range)}.markdown-body .pl-ba{color:var(--color-prettylights-syntax-brackethighlighter-angle)}.markdown-body .pl-sg{color:var(--color-prettylights-syntax-sublimelinter-gutter-mark)}.markdown-body .pl-corl{text-decoration:underline;color:var(--color-prettylights-syntax-constant-other-reference-link)}.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body [role=tabpanel][tabindex="0"]:focus:not(:focus-visible),.markdown-body button:focus:not(:focus-visible),.markdown-body summary:focus:not(:focus-visible),.markdown-body a:focus:not(:focus-visible){outline:none;box-shadow:none}.markdown-body [tabindex="0"]:focus:not(:focus-visible),.markdown-body details-dialog:focus:not(:focus-visible){outline:none}.markdown-body g-emoji{display:inline-block;min-width:1ch;font-family:"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol;font-size:1em;font-style:normal!important;font-weight:var(--base-text-weight-normal, 400);line-height:1;vertical-align:-.075em}.markdown-body g-emoji img{width:1em;height:1em}.markdown-body a:has(>p,>div,>pre,>blockquote){display:block}.markdown-body a:has(>p,>div,>pre,>blockquote):not(:has(.snippet-clipboard-content,>pre)){width:fit-content}.markdown-body a:has(>p,>div,>pre,>blockquote):has(.snippet-clipboard-content,>pre):focus-visible{outline:2px solid var(--focus-outlineColor);outline-offset:2px}.markdown-body .task-list-item{list-style-type:none}.markdown-body .task-list-item label{font-weight:var(--base-text-weight-normal, 400)}.markdown-body .task-list-item.enabled label{cursor:pointer}.markdown-body .task-list-item+.task-list-item{margin-top:var(--base-size-4)}.markdown-body .task-list-item .handle{display:none}.markdown-body .task-list-item-checkbox{margin:0 .2em .25em -1.4em;vertical-align:middle}.markdown-body ul:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body ol:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body .contains-task-list:hover .task-list-item-convert-container,.markdown-body .contains-task-list:focus-within .task-list-item-convert-container{display:block;width:auto;height:24px;overflow:visible;clip-path:none}.markdown-body ::-webkit-calendar-picker-indicator{filter:invert(50%)}.markdown-body .markdown-alert{padding:var(--base-size-8) var(--base-size-16);margin-bottom:var(--base-size-16);color:inherit;border-left:.25em solid var(--borderColor-default)}.markdown-body .markdown-alert>:first-child{margin-top:0}.markdown-body .markdown-alert>:last-child{margin-bottom:0}.markdown-body .markdown-alert .markdown-alert-title{display:flex;font-weight:var(--base-text-weight-medium, 500);align-items:center;line-height:1}.markdown-body .markdown-alert.markdown-alert-note{border-left-color:var(--borderColor-accent-emphasis)}.markdown-body .markdown-alert.markdown-alert-note .markdown-alert-title{color:var(--fgColor-accent)}.markdown-body .markdown-alert.markdown-alert-important{border-left-color:var(--borderColor-done-emphasis)}.markdown-body .markdown-alert.markdown-alert-important .markdown-alert-title{color:var(--fgColor-done)}.markdown-body .markdown-alert.markdown-alert-warning{border-left-color:var(--borderColor-attention-emphasis)}.markdown-body .markdown-alert.markdown-alert-warning .markdown-alert-title{color:var(--fgColor-attention)}.markdown-body .markdown-alert.markdown-alert-tip{border-left-color:var(--borderColor-success-emphasis)}.markdown-body .markdown-alert.markdown-alert-tip .markdown-alert-title{color:var(--fgColor-success)}.markdown-body .markdown-alert.markdown-alert-caution{border-left-color:var(--borderColor-danger-emphasis)}.markdown-body .markdown-alert.markdown-alert-caution .markdown-alert-title{color:var(--fgColor-danger)}.markdown-body>*:first-child>.heading-element:first-child{margin-top:0!important}.markdown-body .highlight pre:has(+.zeroclipboard-container){min-height:52px}`, Sn = `.markdown-body{color-scheme:light;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;margin:0;font-weight:400;color:#1f2328;background-color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";font-size:16px;line-height:1.5;word-wrap:break-word}.markdown-body a{text-decoration:underline;text-underline-offset:.2rem}.markdown-body .octicon{display:inline-block;fill:currentColor;vertical-align:text-bottom}.markdown-body h1:hover .anchor .octicon-link:before,.markdown-body h2:hover .anchor .octicon-link:before,.markdown-body h3:hover .anchor .octicon-link:before,.markdown-body h4:hover .anchor .octicon-link:before,.markdown-body h5:hover .anchor .octicon-link:before,.markdown-body h6:hover .anchor .octicon-link:before{width:16px;height:16px;content:" ";display:inline-block;background-color:currentColor;-webkit-mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>")}.markdown-body details,.markdown-body figcaption,.markdown-body figure{display:block}.markdown-body summary{display:list-item}.markdown-body [hidden]{display:none!important}.markdown-body a{background-color:#0000;color:#0969da;text-decoration:none}.markdown-body abbr[title]{border-bottom:none;-webkit-text-decoration:underline dotted;text-decoration:underline dotted}.markdown-body b,.markdown-body strong{font-weight:600}.markdown-body dfn{font-style:italic}.markdown-body h1{margin:.67em 0;font-weight:600;padding-bottom:.3em;font-size:2em;border-bottom:1px solid #d1d9e0b3}.markdown-body mark{background-color:#fff8c5;color:#1f2328}.markdown-body small{font-size:90%}.markdown-body sub,.markdown-body sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}.markdown-body sub{bottom:-.25em}.markdown-body sup{top:-.5em}.markdown-body img{border-style:none;max-width:100%;box-sizing:content-box}.markdown-body code,.markdown-body kbd,.markdown-body pre,.markdown-body samp{font-family:monospace;font-size:1em}.markdown-body figure{margin:1em 2.5rem}.markdown-body hr{box-sizing:content-box;overflow:hidden;background:#0000;border-bottom:1px solid #d1d9e0b3;height:.25em;padding:0;margin:1.5rem 0;background-color:#d1d9e0;border:0}.markdown-body input{font:inherit;margin:0;overflow:visible;font-family:inherit;font-size:inherit;line-height:inherit}.markdown-body [type=button],.markdown-body [type=reset],.markdown-body [type=submit]{-webkit-appearance:button;-moz-appearance:button;appearance:button}.markdown-body [type=checkbox],.markdown-body [type=radio]{box-sizing:border-box;padding:0}.markdown-body [type=number]::-webkit-inner-spin-button,.markdown-body [type=number]::-webkit-outer-spin-button{height:auto}.markdown-body [type=search]::-webkit-search-cancel-button,.markdown-body [type=search]::-webkit-search-decoration{-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body ::-webkit-input-placeholder{color:inherit;opacity:.54}.markdown-body ::-webkit-file-upload-button{-webkit-appearance:button;-moz-appearance:button;appearance:button;font:inherit}.markdown-body a:hover{text-decoration:underline}.markdown-body ::placeholder{color:#59636e;opacity:1}.markdown-body hr:before{display:table;content:""}.markdown-body hr:after{display:table;clear:both;content:""}.markdown-body table{border-spacing:0;border-collapse:collapse;display:block;width:max-content;max-width:100%;overflow:auto;font-variant:tabular-nums}.markdown-body td,.markdown-body th{padding:0}.markdown-body details summary{cursor:pointer}.markdown-body a:focus,.markdown-body [role=button]:focus,.markdown-body input[type=radio]:focus,.markdown-body input[type=checkbox]:focus{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:-2px;box-shadow:none}.markdown-body a:focus:not(:focus-visible),.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body input[type=radio]:focus:not(:focus-visible),.markdown-body input[type=checkbox]:focus:not(:focus-visible){outline:solid 1px rgba(0,0,0,0)}.markdown-body a:focus-visible,.markdown-body [role=button]:focus-visible,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus-visible{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:-2px;box-shadow:none}.markdown-body a:not([class]):focus,.markdown-body a:not([class]):focus-visible,.markdown-body input[type=radio]:focus,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus,.markdown-body input[type=checkbox]:focus-visible{outline-offset:0}.markdown-body kbd{display:inline-block;padding:.25rem;font:11px ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;line-height:10px;color:#1f2328;vertical-align:middle;background-color:#f6f8fa;border:solid 1px var(--borderColor-muted);border-bottom-color:var(--borderColor-muted);border-radius:6px;box-shadow:inset 0 -1px 0 var(--borderColor-muted)}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:1.5rem;margin-bottom:1rem;font-weight:600;line-height:1.25}.markdown-body h2{font-weight:600;padding-bottom:.3em;font-size:1.5em;border-bottom:1px solid #d1d9e0b3}.markdown-body h3{font-weight:600;font-size:1.25em}.markdown-body h4{font-weight:600;font-size:1em}.markdown-body h5{font-weight:600;font-size:.875em}.markdown-body h6{font-weight:600;font-size:.85em;color:#59636e}.markdown-body p{margin-top:0;margin-bottom:10px}.markdown-body blockquote{margin:0;padding:0 1em;color:#59636e;border-left:.25em solid #d1d9e0}.markdown-body ul,.markdown-body ol{margin-top:0;margin-bottom:0;padding-left:2em}.markdown-body ol ol,.markdown-body ul ol{list-style-type:lower-roman}.markdown-body ul ul ol,.markdown-body ul ol ol,.markdown-body ol ul ol,.markdown-body ol ol ol{list-style-type:lower-alpha}.markdown-body dd{margin-left:0}.markdown-body tt,.markdown-body code,.markdown-body samp{font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px}.markdown-body pre{margin-top:0;margin-bottom:0;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;word-wrap:normal}.markdown-body .octicon{display:inline-block;overflow:visible!important;vertical-align:text-bottom;fill:currentColor}.markdown-body input::-webkit-outer-spin-button,.markdown-body input::-webkit-inner-spin-button{margin:0;-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body .mr-2{margin-right:.5rem!important}.markdown-body:before{display:table;content:""}.markdown-body:after{display:table;clear:both;content:""}.markdown-body>*:first-child{margin-top:0!important}.markdown-body>*:last-child{margin-bottom:0!important}.markdown-body a:not([href]){color:inherit;text-decoration:none}.markdown-body .absent{color:#d1242f}.markdown-body .anchor{float:left;padding-right:.25rem;margin-left:-20px;line-height:1}.markdown-body .anchor:focus{outline:none}.markdown-body p,.markdown-body blockquote,.markdown-body ul,.markdown-body ol,.markdown-body dl,.markdown-body table,.markdown-body pre,.markdown-body details{margin-top:0;margin-bottom:1rem}.markdown-body blockquote>:first-child{margin-top:0}.markdown-body blockquote>:last-child{margin-bottom:0}.markdown-body h1 .octicon-link,.markdown-body h2 .octicon-link,.markdown-body h3 .octicon-link,.markdown-body h4 .octicon-link,.markdown-body h5 .octicon-link,.markdown-body h6 .octicon-link{color:#1f2328;vertical-align:middle;visibility:hidden}.markdown-body h1:hover .anchor,.markdown-body h2:hover .anchor,.markdown-body h3:hover .anchor,.markdown-body h4:hover .anchor,.markdown-body h5:hover .anchor,.markdown-body h6:hover .anchor{text-decoration:none}.markdown-body h1:hover .anchor .octicon-link,.markdown-body h2:hover .anchor .octicon-link,.markdown-body h3:hover .anchor .octicon-link,.markdown-body h4:hover .anchor .octicon-link,.markdown-body h5:hover .anchor .octicon-link,.markdown-body h6:hover .anchor .octicon-link{visibility:visible}.markdown-body h1 tt,.markdown-body h1 code,.markdown-body h2 tt,.markdown-body h2 code,.markdown-body h3 tt,.markdown-body h3 code,.markdown-body h4 tt,.markdown-body h4 code,.markdown-body h5 tt,.markdown-body h5 code,.markdown-body h6 tt,.markdown-body h6 code{padding:0 .2em;font-size:inherit}.markdown-body summary h1,.markdown-body summary h2,.markdown-body summary h3,.markdown-body summary h4,.markdown-body summary h5,.markdown-body summary h6{display:inline-block}.markdown-body summary h1 .anchor,.markdown-body summary h2 .anchor,.markdown-body summary h3 .anchor,.markdown-body summary h4 .anchor,.markdown-body summary h5 .anchor,.markdown-body summary h6 .anchor{margin-left:-40px}.markdown-body summary h1,.markdown-body summary h2{padding-bottom:0;border-bottom:0}.markdown-body ul.no-list,.markdown-body ol.no-list{padding:0;list-style-type:none}.markdown-body ol[type="a s"]{list-style-type:lower-alpha}.markdown-body ol[type="A s"]{list-style-type:upper-alpha}.markdown-body ol[type="i s"]{list-style-type:lower-roman}.markdown-body ol[type="I s"]{list-style-type:upper-roman}.markdown-body ol[type="1"]{list-style-type:decimal}.markdown-body div>ol:not([type]){list-style-type:decimal}.markdown-body ul ul,.markdown-body ul ol,.markdown-body ol ol,.markdown-body ol ul{margin-top:0;margin-bottom:0}.markdown-body li>p{margin-top:1rem}.markdown-body li+li{margin-top:.25em}.markdown-body dl{padding:0}.markdown-body dl dt{padding:0;margin-top:1rem;font-size:1em;font-style:italic;font-weight:600}.markdown-body dl dd{padding:0 1rem;margin-bottom:1rem}.markdown-body table th{font-weight:600}.markdown-body table th,.markdown-body table td{padding:6px 13px;border:1px solid #d1d9e0}.markdown-body table td>:last-child{margin-bottom:0}.markdown-body table tr{background-color:#fff;border-top:1px solid #d1d9e0b3}.markdown-body table tr:nth-child(2n){background-color:#f6f8fa}.markdown-body table img{background-color:#0000}.markdown-body img[align=right]{padding-left:20px}.markdown-body img[align=left]{padding-right:20px}.markdown-body .emoji{max-width:none;vertical-align:text-top;background-color:#0000}.markdown-body span.frame{display:block;overflow:hidden}.markdown-body span.frame>span{display:block;float:left;width:auto;padding:7px;margin:13px 0 0;overflow:hidden;border:1px solid #d1d9e0}.markdown-body span.frame span img{display:block;float:left}.markdown-body span.frame span span{display:block;padding:5px 0 0;clear:both;color:#1f2328}.markdown-body span.align-center{display:block;overflow:hidden;clear:both}.markdown-body span.align-center>span{display:block;margin:13px auto 0;overflow:hidden;text-align:center}.markdown-body span.align-center span img{margin:0 auto;text-align:center}.markdown-body span.align-right{display:block;overflow:hidden;clear:both}.markdown-body span.align-right>span{display:block;margin:13px 0 0;overflow:hidden;text-align:right}.markdown-body span.align-right span img{margin:0;text-align:right}.markdown-body span.float-left{display:block;float:left;margin-right:13px;overflow:hidden}.markdown-body span.float-left span{margin:13px 0 0}.markdown-body span.float-right{display:block;float:right;margin-left:13px;overflow:hidden}.markdown-body span.float-right>span{display:block;margin:13px auto 0;overflow:hidden;text-align:right}.markdown-body code,.markdown-body tt{padding:.2em .4em;margin:0;font-size:85%;white-space:break-spaces;background-color:#818b981f;border-radius:6px}.markdown-body code br,.markdown-body tt br{display:none}.markdown-body del code{text-decoration:inherit}.markdown-body samp{font-size:85%}.markdown-body pre code{font-size:100%}.markdown-body pre>code{padding:0;margin:0;word-break:normal;white-space:pre;background:#0000;border:0}.markdown-body .highlight{margin-bottom:1rem}.markdown-body .highlight pre{margin-bottom:0;word-break:normal}.markdown-body .highlight pre,.markdown-body pre{padding:1rem;overflow:auto;font-size:85%;line-height:1.45;color:#1f2328;background-color:#f6f8fa;border-radius:6px}.markdown-body pre code,.markdown-body pre tt{display:inline;padding:0;margin:0;overflow:visible;line-height:inherit;word-wrap:normal;background-color:#0000;border:0}.markdown-body .csv-data td,.markdown-body .csv-data th{padding:5px;overflow:hidden;font-size:12px;line-height:1;text-align:left;white-space:nowrap}.markdown-body .csv-data .blob-num{padding:10px .5rem 9px;text-align:right;background:#fff;border:0}.markdown-body .csv-data tr{border-top:0}.markdown-body .csv-data th{font-weight:600;background:#f6f8fa;border-top:0}.markdown-body [data-footnote-ref]:before{content:"["}.markdown-body [data-footnote-ref]:after{content:"]"}.markdown-body .footnotes{font-size:12px;color:#59636e;border-top:1px solid #d1d9e0}.markdown-body .footnotes ol{padding-left:1rem}.markdown-body .footnotes ol ul{display:inline-block;padding-left:1rem;margin-top:1rem}.markdown-body .footnotes li{position:relative}.markdown-body .footnotes li:target:before{position:absolute;top:-.5rem;right:-.5rem;bottom:-.5rem;left:-1.5rem;pointer-events:none;content:"";border:2px solid #0969da;border-radius:6px}.markdown-body .footnotes li:target{color:#1f2328}.markdown-body .footnotes .data-footnote-backref g-emoji{font-family:monospace}.markdown-body .pl-c{color:#59636e}.markdown-body .pl-c1,.markdown-body .pl-s .pl-v{color:#0550ae}.markdown-body .pl-e,.markdown-body .pl-en{color:#6639ba}.markdown-body .pl-smi,.markdown-body .pl-s .pl-s1{color:#1f2328}.markdown-body .pl-ent{color:#0550ae}.markdown-body .pl-k{color:#cf222e}.markdown-body .pl-s,.markdown-body .pl-pds,.markdown-body .pl-s .pl-pse .pl-s1,.markdown-body .pl-sr,.markdown-body .pl-sr .pl-cce,.markdown-body .pl-sr .pl-sre,.markdown-body .pl-sr .pl-sra{color:#0a3069}.markdown-body .pl-v,.markdown-body .pl-smw{color:#953800}.markdown-body .pl-bu{color:#82071e}.markdown-body .pl-ii{color:var(--fgColor-danger);background-color:var(--bgColor-danger-muted)}.markdown-body .pl-c2{color:#f6f8fa;background-color:#cf222e}.markdown-body .pl-sr .pl-cce{font-weight:700;color:#116329}.markdown-body .pl-ml{color:#3b2300}.markdown-body .pl-mh,.markdown-body .pl-mh .pl-en,.markdown-body .pl-ms{font-weight:700;color:#0550ae}.markdown-body .pl-mi{font-style:italic;color:#1f2328}.markdown-body .pl-mb{font-weight:700;color:#1f2328}.markdown-body .pl-md{color:#82071e;background-color:#ffebe9}.markdown-body .pl-mi1{color:#116329;background-color:#dafbe1}.markdown-body .pl-mc{color:#953800;background-color:#ffd8b5}.markdown-body .pl-mi2{color:#d1d9e0;background-color:#0550ae}.markdown-body .pl-mdr{font-weight:700;color:#8250df}.markdown-body .pl-ba{color:#59636e}.markdown-body .pl-sg{color:#818b98}.markdown-body .pl-corl{text-decoration:underline;color:#0a3069}.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body [role=tabpanel][tabindex="0"]:focus:not(:focus-visible),.markdown-body button:focus:not(:focus-visible),.markdown-body summary:focus:not(:focus-visible),.markdown-body a:focus:not(:focus-visible){outline:none;box-shadow:none}.markdown-body [tabindex="0"]:focus:not(:focus-visible),.markdown-body details-dialog:focus:not(:focus-visible){outline:none}.markdown-body g-emoji{display:inline-block;min-width:1ch;font-family:"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol;font-size:1em;font-style:normal!important;font-weight:400;line-height:1;vertical-align:-.075em}.markdown-body g-emoji img{width:1em;height:1em}.markdown-body a:has(>p,>div,>pre,>blockquote){display:block}.markdown-body a:has(>p,>div,>pre,>blockquote):not(:has(.snippet-clipboard-content,>pre)){width:fit-content}.markdown-body a:has(>p,>div,>pre,>blockquote):has(.snippet-clipboard-content,>pre):focus-visible{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:2px}.markdown-body .task-list-item{list-style-type:none}.markdown-body .task-list-item label{font-weight:400}.markdown-body .task-list-item.enabled label{cursor:pointer}.markdown-body .task-list-item+.task-list-item{margin-top:.25rem}.markdown-body .task-list-item .handle{display:none}.markdown-body .task-list-item-checkbox{margin:0 .2em .25em -1.4em;vertical-align:middle}.markdown-body ul:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body ol:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body .contains-task-list:hover .task-list-item-convert-container,.markdown-body .contains-task-list:focus-within .task-list-item-convert-container{display:block;width:auto;height:24px;overflow:visible;clip-path:none}.markdown-body ::-webkit-calendar-picker-indicator{filter:invert(50%)}.markdown-body .markdown-alert{padding:.5rem 1rem;margin-bottom:1rem;color:inherit;border-left:.25em solid #d1d9e0}.markdown-body .markdown-alert>:first-child{margin-top:0}.markdown-body .markdown-alert>:last-child{margin-bottom:0}.markdown-body .markdown-alert .markdown-alert-title{display:flex;font-weight:500;align-items:center;line-height:1}.markdown-body .markdown-alert.markdown-alert-note{border-left-color:#0969da}.markdown-body .markdown-alert.markdown-alert-note .markdown-alert-title{color:#0969da}.markdown-body .markdown-alert.markdown-alert-important{border-left-color:#8250df}.markdown-body .markdown-alert.markdown-alert-important .markdown-alert-title{color:#8250df}.markdown-body .markdown-alert.markdown-alert-warning{border-left-color:#9a6700}.markdown-body .markdown-alert.markdown-alert-warning .markdown-alert-title{color:#9a6700}.markdown-body .markdown-alert.markdown-alert-tip{border-left-color:#1a7f37}.markdown-body .markdown-alert.markdown-alert-tip .markdown-alert-title{color:#1a7f37}.markdown-body .markdown-alert.markdown-alert-caution{border-left-color:#cf222e}.markdown-body .markdown-alert.markdown-alert-caution .markdown-alert-title{color:#d1242f}.markdown-body>*:first-child>.heading-element:first-child{margin-top:0!important}.markdown-body .highlight pre:has(+.zeroclipboard-container){min-height:52px}`, Mn = `.markdown-body{color-scheme:dark;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;margin:0;font-weight:400;color:#f0f6fc;background-color:#0d1117;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";font-size:16px;line-height:1.5;word-wrap:break-word}.markdown-body a{text-decoration:underline;text-underline-offset:.2rem}.markdown-body .octicon{display:inline-block;fill:currentColor;vertical-align:text-bottom}.markdown-body h1:hover .anchor .octicon-link:before,.markdown-body h2:hover .anchor .octicon-link:before,.markdown-body h3:hover .anchor .octicon-link:before,.markdown-body h4:hover .anchor .octicon-link:before,.markdown-body h5:hover .anchor .octicon-link:before,.markdown-body h6:hover .anchor .octicon-link:before{width:16px;height:16px;content:" ";display:inline-block;background-color:currentColor;-webkit-mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");mask-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>")}.markdown-body details,.markdown-body figcaption,.markdown-body figure{display:block}.markdown-body summary{display:list-item}.markdown-body [hidden]{display:none!important}.markdown-body a{background-color:#0000;color:#4493f8;text-decoration:none}.markdown-body abbr[title]{border-bottom:none;-webkit-text-decoration:underline dotted;text-decoration:underline dotted}.markdown-body b,.markdown-body strong{font-weight:600}.markdown-body dfn{font-style:italic}.markdown-body h1{margin:.67em 0;font-weight:600;padding-bottom:.3em;font-size:2em;border-bottom:1px solid #3d444db3}.markdown-body mark{background-color:#bb800926;color:#f0f6fc}.markdown-body small{font-size:90%}.markdown-body sub,.markdown-body sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}.markdown-body sub{bottom:-.25em}.markdown-body sup{top:-.5em}.markdown-body img{border-style:none;max-width:100%;box-sizing:content-box}.markdown-body code,.markdown-body kbd,.markdown-body pre,.markdown-body samp{font-family:monospace;font-size:1em}.markdown-body figure{margin:1em 2.5rem}.markdown-body hr{box-sizing:content-box;overflow:hidden;background:#0000;border-bottom:1px solid #3d444db3;height:.25em;padding:0;margin:1.5rem 0;background-color:#3d444d;border:0}.markdown-body input{font:inherit;margin:0;overflow:visible;font-family:inherit;font-size:inherit;line-height:inherit}.markdown-body [type=button],.markdown-body [type=reset],.markdown-body [type=submit]{-webkit-appearance:button;-moz-appearance:button;appearance:button}.markdown-body [type=checkbox],.markdown-body [type=radio]{box-sizing:border-box;padding:0}.markdown-body [type=number]::-webkit-inner-spin-button,.markdown-body [type=number]::-webkit-outer-spin-button{height:auto}.markdown-body [type=search]::-webkit-search-cancel-button,.markdown-body [type=search]::-webkit-search-decoration{-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body ::-webkit-input-placeholder{color:inherit;opacity:.54}.markdown-body ::-webkit-file-upload-button{-webkit-appearance:button;-moz-appearance:button;appearance:button;font:inherit}.markdown-body a:hover{text-decoration:underline}.markdown-body ::placeholder{color:#9198a1;opacity:1}.markdown-body hr:before{display:table;content:""}.markdown-body hr:after{display:table;clear:both;content:""}.markdown-body table{border-spacing:0;border-collapse:collapse;display:block;width:max-content;max-width:100%;overflow:auto;font-variant:tabular-nums}.markdown-body td,.markdown-body th{padding:0}.markdown-body details summary{cursor:pointer}.markdown-body a:focus,.markdown-body [role=button]:focus,.markdown-body input[type=radio]:focus,.markdown-body input[type=checkbox]:focus{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:-2px;box-shadow:none}.markdown-body a:focus:not(:focus-visible),.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body input[type=radio]:focus:not(:focus-visible),.markdown-body input[type=checkbox]:focus:not(:focus-visible){outline:solid 1px rgba(0,0,0,0)}.markdown-body a:focus-visible,.markdown-body [role=button]:focus-visible,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus-visible{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:-2px;box-shadow:none}.markdown-body a:not([class]):focus,.markdown-body a:not([class]):focus-visible,.markdown-body input[type=radio]:focus,.markdown-body input[type=radio]:focus-visible,.markdown-body input[type=checkbox]:focus,.markdown-body input[type=checkbox]:focus-visible{outline-offset:0}.markdown-body kbd{display:inline-block;padding:.25rem;font:11px ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;line-height:10px;color:#f0f6fc;vertical-align:middle;background-color:#151b23;border:solid 1px var(--borderColor-muted);border-bottom-color:var(--borderColor-muted);border-radius:6px;box-shadow:inset 0 -1px 0 var(--borderColor-muted)}.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6{margin-top:1.5rem;margin-bottom:1rem;font-weight:600;line-height:1.25}.markdown-body h2{font-weight:600;padding-bottom:.3em;font-size:1.5em;border-bottom:1px solid #3d444db3}.markdown-body h3{font-weight:600;font-size:1.25em}.markdown-body h4{font-weight:600;font-size:1em}.markdown-body h5{font-weight:600;font-size:.875em}.markdown-body h6{font-weight:600;font-size:.85em;color:#9198a1}.markdown-body p{margin-top:0;margin-bottom:10px}.markdown-body blockquote{margin:0;padding:0 1em;color:#9198a1;border-left:.25em solid #3d444d}.markdown-body ul,.markdown-body ol{margin-top:0;margin-bottom:0;padding-left:2em}.markdown-body ol ol,.markdown-body ul ol{list-style-type:lower-roman}.markdown-body ul ul ol,.markdown-body ul ol ol,.markdown-body ol ul ol,.markdown-body ol ol ol{list-style-type:lower-alpha}.markdown-body dd{margin-left:0}.markdown-body tt,.markdown-body code,.markdown-body samp{font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px}.markdown-body pre{margin-top:0;margin-bottom:0;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;word-wrap:normal}.markdown-body .octicon{display:inline-block;overflow:visible!important;vertical-align:text-bottom;fill:currentColor}.markdown-body input::-webkit-outer-spin-button,.markdown-body input::-webkit-inner-spin-button{margin:0;-webkit-appearance:none;-moz-appearance:none;appearance:none}.markdown-body .mr-2{margin-right:.5rem!important}.markdown-body:before{display:table;content:""}.markdown-body:after{display:table;clear:both;content:""}.markdown-body>*:first-child{margin-top:0!important}.markdown-body>*:last-child{margin-bottom:0!important}.markdown-body a:not([href]){color:inherit;text-decoration:none}.markdown-body .absent{color:#f85149}.markdown-body .anchor{float:left;padding-right:.25rem;margin-left:-20px;line-height:1}.markdown-body .anchor:focus{outline:none}.markdown-body p,.markdown-body blockquote,.markdown-body ul,.markdown-body ol,.markdown-body dl,.markdown-body table,.markdown-body pre,.markdown-body details{margin-top:0;margin-bottom:1rem}.markdown-body blockquote>:first-child{margin-top:0}.markdown-body blockquote>:last-child{margin-bottom:0}.markdown-body h1 .octicon-link,.markdown-body h2 .octicon-link,.markdown-body h3 .octicon-link,.markdown-body h4 .octicon-link,.markdown-body h5 .octicon-link,.markdown-body h6 .octicon-link{color:#f0f6fc;vertical-align:middle;visibility:hidden}.markdown-body h1:hover .anchor,.markdown-body h2:hover .anchor,.markdown-body h3:hover .anchor,.markdown-body h4:hover .anchor,.markdown-body h5:hover .anchor,.markdown-body h6:hover .anchor{text-decoration:none}.markdown-body h1:hover .anchor .octicon-link,.markdown-body h2:hover .anchor .octicon-link,.markdown-body h3:hover .anchor .octicon-link,.markdown-body h4:hover .anchor .octicon-link,.markdown-body h5:hover .anchor .octicon-link,.markdown-body h6:hover .anchor .octicon-link{visibility:visible}.markdown-body h1 tt,.markdown-body h1 code,.markdown-body h2 tt,.markdown-body h2 code,.markdown-body h3 tt,.markdown-body h3 code,.markdown-body h4 tt,.markdown-body h4 code,.markdown-body h5 tt,.markdown-body h5 code,.markdown-body h6 tt,.markdown-body h6 code{padding:0 .2em;font-size:inherit}.markdown-body summary h1,.markdown-body summary h2,.markdown-body summary h3,.markdown-body summary h4,.markdown-body summary h5,.markdown-body summary h6{display:inline-block}.markdown-body summary h1 .anchor,.markdown-body summary h2 .anchor,.markdown-body summary h3 .anchor,.markdown-body summary h4 .anchor,.markdown-body summary h5 .anchor,.markdown-body summary h6 .anchor{margin-left:-40px}.markdown-body summary h1,.markdown-body summary h2{padding-bottom:0;border-bottom:0}.markdown-body ul.no-list,.markdown-body ol.no-list{padding:0;list-style-type:none}.markdown-body ol[type="a s"]{list-style-type:lower-alpha}.markdown-body ol[type="A s"]{list-style-type:upper-alpha}.markdown-body ol[type="i s"]{list-style-type:lower-roman}.markdown-body ol[type="I s"]{list-style-type:upper-roman}.markdown-body ol[type="1"]{list-style-type:decimal}.markdown-body div>ol:not([type]){list-style-type:decimal}.markdown-body ul ul,.markdown-body ul ol,.markdown-body ol ol,.markdown-body ol ul{margin-top:0;margin-bottom:0}.markdown-body li>p{margin-top:1rem}.markdown-body li+li{margin-top:.25em}.markdown-body dl{padding:0}.markdown-body dl dt{padding:0;margin-top:1rem;font-size:1em;font-style:italic;font-weight:600}.markdown-body dl dd{padding:0 1rem;margin-bottom:1rem}.markdown-body table th{font-weight:600}.markdown-body table th,.markdown-body table td{padding:6px 13px;border:1px solid #3d444d}.markdown-body table td>:last-child{margin-bottom:0}.markdown-body table tr{background-color:#0d1117;border-top:1px solid #3d444db3}.markdown-body table tr:nth-child(2n){background-color:#151b23}.markdown-body table img{background-color:#0000}.markdown-body img[align=right]{padding-left:20px}.markdown-body img[align=left]{padding-right:20px}.markdown-body .emoji{max-width:none;vertical-align:text-top;background-color:#0000}.markdown-body span.frame{display:block;overflow:hidden}.markdown-body span.frame>span{display:block;float:left;width:auto;padding:7px;margin:13px 0 0;overflow:hidden;border:1px solid #3d444d}.markdown-body span.frame span img{display:block;float:left}.markdown-body span.frame span span{display:block;padding:5px 0 0;clear:both;color:#f0f6fc}.markdown-body span.align-center{display:block;overflow:hidden;clear:both}.markdown-body span.align-center>span{display:block;margin:13px auto 0;overflow:hidden;text-align:center}.markdown-body span.align-center span img{margin:0 auto;text-align:center}.markdown-body span.align-right{display:block;overflow:hidden;clear:both}.markdown-body span.align-right>span{display:block;margin:13px 0 0;overflow:hidden;text-align:right}.markdown-body span.align-right span img{margin:0;text-align:right}.markdown-body span.float-left{display:block;float:left;margin-right:13px;overflow:hidden}.markdown-body span.float-left span{margin:13px 0 0}.markdown-body span.float-right{display:block;float:right;margin-left:13px;overflow:hidden}.markdown-body span.float-right>span{display:block;margin:13px auto 0;overflow:hidden;text-align:right}.markdown-body code,.markdown-body tt{padding:.2em .4em;margin:0;font-size:85%;white-space:break-spaces;background-color:#656c7633;border-radius:6px}.markdown-body code br,.markdown-body tt br{display:none}.markdown-body del code{text-decoration:inherit}.markdown-body samp{font-size:85%}.markdown-body pre code{font-size:100%}.markdown-body pre>code{padding:0;margin:0;word-break:normal;white-space:pre;background:#0000;border:0}.markdown-body .highlight{margin-bottom:1rem}.markdown-body .highlight pre{margin-bottom:0;word-break:normal}.markdown-body .highlight pre,.markdown-body pre{padding:1rem;overflow:auto;font-size:85%;line-height:1.45;color:#f0f6fc;background-color:#151b23;border-radius:6px}.markdown-body pre code,.markdown-body pre tt{display:inline;padding:0;margin:0;overflow:visible;line-height:inherit;word-wrap:normal;background-color:#0000;border:0}.markdown-body .csv-data td,.markdown-body .csv-data th{padding:5px;overflow:hidden;font-size:12px;line-height:1;text-align:left;white-space:nowrap}.markdown-body .csv-data .blob-num{padding:10px .5rem 9px;text-align:right;background:#0d1117;border:0}.markdown-body .csv-data tr{border-top:0}.markdown-body .csv-data th{font-weight:600;background:#151b23;border-top:0}.markdown-body [data-footnote-ref]:before{content:"["}.markdown-body [data-footnote-ref]:after{content:"]"}.markdown-body .footnotes{font-size:12px;color:#9198a1;border-top:1px solid #3d444d}.markdown-body .footnotes ol{padding-left:1rem}.markdown-body .footnotes ol ul{display:inline-block;padding-left:1rem;margin-top:1rem}.markdown-body .footnotes li{position:relative}.markdown-body .footnotes li:target:before{position:absolute;top:-.5rem;right:-.5rem;bottom:-.5rem;left:-1.5rem;pointer-events:none;content:"";border:2px solid #1f6feb;border-radius:6px}.markdown-body .footnotes li:target{color:#f0f6fc}.markdown-body .footnotes .data-footnote-backref g-emoji{font-family:monospace}.markdown-body .pl-c{color:#9198a1}.markdown-body .pl-c1,.markdown-body .pl-s .pl-v{color:#79c0ff}.markdown-body .pl-e,.markdown-body .pl-en{color:#d2a8ff}.markdown-body .pl-smi,.markdown-body .pl-s .pl-s1{color:#f0f6fc}.markdown-body .pl-ent{color:#7ee787}.markdown-body .pl-k{color:#ff7b72}.markdown-body .pl-s,.markdown-body .pl-pds,.markdown-body .pl-s .pl-pse .pl-s1,.markdown-body .pl-sr,.markdown-body .pl-sr .pl-cce,.markdown-body .pl-sr .pl-sre,.markdown-body .pl-sr .pl-sra{color:#a5d6ff}.markdown-body .pl-v,.markdown-body .pl-smw{color:#ffa657}.markdown-body .pl-bu{color:#f85149}.markdown-body .pl-ii{color:var(--fgColor-danger);background-color:var(--bgColor-danger-muted)}.markdown-body .pl-c2{color:#f0f6fc;background-color:#b62324}.markdown-body .pl-sr .pl-cce{font-weight:700;color:#7ee787}.markdown-body .pl-ml{color:#f2cc60}.markdown-body .pl-mh,.markdown-body .pl-mh .pl-en,.markdown-body .pl-ms{font-weight:700;color:#1f6feb}.markdown-body .pl-mi{font-style:italic;color:#f0f6fc}.markdown-body .pl-mb{font-weight:700;color:#f0f6fc}.markdown-body .pl-md{color:#ffdcd7;background-color:#67060c}.markdown-body .pl-mi1{color:#aff5b4;background-color:#033a16}.markdown-body .pl-mc{color:#ffdfb6;background-color:#5a1e02}.markdown-body .pl-mi2{color:#f0f6fc;background-color:#1158c7}.markdown-body .pl-mdr{font-weight:700;color:#d2a8ff}.markdown-body .pl-ba{color:#9198a1}.markdown-body .pl-sg{color:#3d444d}.markdown-body .pl-corl{text-decoration:underline;color:#a5d6ff}.markdown-body [role=button]:focus:not(:focus-visible),.markdown-body [role=tabpanel][tabindex="0"]:focus:not(:focus-visible),.markdown-body button:focus:not(:focus-visible),.markdown-body summary:focus:not(:focus-visible),.markdown-body a:focus:not(:focus-visible){outline:none;box-shadow:none}.markdown-body [tabindex="0"]:focus:not(:focus-visible),.markdown-body details-dialog:focus:not(:focus-visible){outline:none}.markdown-body g-emoji{display:inline-block;min-width:1ch;font-family:"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol;font-size:1em;font-style:normal!important;font-weight:400;line-height:1;vertical-align:-.075em}.markdown-body g-emoji img{width:1em;height:1em}.markdown-body a:has(>p,>div,>pre,>blockquote){display:block}.markdown-body a:has(>p,>div,>pre,>blockquote):not(:has(.snippet-clipboard-content,>pre)){width:fit-content}.markdown-body a:has(>p,>div,>pre,>blockquote):has(.snippet-clipboard-content,>pre):focus-visible{outline:2px solid var(--borderColor-accent-emphasis);outline-offset:2px}.markdown-body .task-list-item{list-style-type:none}.markdown-body .task-list-item label{font-weight:400}.markdown-body .task-list-item.enabled label{cursor:pointer}.markdown-body .task-list-item+.task-list-item{margin-top:.25rem}.markdown-body .task-list-item .handle{display:none}.markdown-body .task-list-item-checkbox{margin:0 .2em .25em -1.4em;vertical-align:middle}.markdown-body ul:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body ol:dir(rtl) .task-list-item-checkbox{margin:0 -1.6em .25em .2em}.markdown-body .contains-task-list:hover .task-list-item-convert-container,.markdown-body .contains-task-list:focus-within .task-list-item-convert-container{display:block;width:auto;height:24px;overflow:visible;clip-path:none}.markdown-body ::-webkit-calendar-picker-indicator{filter:invert(50%)}.markdown-body .markdown-alert{padding:.5rem 1rem;margin-bottom:1rem;color:inherit;border-left:.25em solid #3d444d}.markdown-body .markdown-alert>:first-child{margin-top:0}.markdown-body .markdown-alert>:last-child{margin-bottom:0}.markdown-body .markdown-alert .markdown-alert-title{display:flex;font-weight:500;align-items:center;line-height:1}.markdown-body .markdown-alert.markdown-alert-note{border-left-color:#1f6feb}.markdown-body .markdown-alert.markdown-alert-note .markdown-alert-title{color:#4493f8}.markdown-body .markdown-alert.markdown-alert-important{border-left-color:#8957e5}.markdown-body .markdown-alert.markdown-alert-important .markdown-alert-title{color:#ab7df8}.markdown-body .markdown-alert.markdown-alert-warning{border-left-color:#9e6a03}.markdown-body .markdown-alert.markdown-alert-warning .markdown-alert-title{color:#d29922}.markdown-body .markdown-alert.markdown-alert-tip{border-left-color:#238636}.markdown-body .markdown-alert.markdown-alert-tip .markdown-alert-title{color:#3fb950}.markdown-body .markdown-alert.markdown-alert-caution{border-left-color:#da3633}.markdown-body .markdown-alert.markdown-alert-caution .markdown-alert-title{color:#f85149}.markdown-body>*:first-child>.heading-element:first-child{margin-top:0!important}.markdown-body .highlight pre:has(+.zeroclipboard-container){min-height:52px}`, Bn = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!
  Theme: GitHub
  Description: Light theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-light
  Current colors taken from GitHub's CSS
*/.hljs{color:#24292e;background:#fff}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#005cc5}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#032f62}.hljs-built_in,.hljs-symbol{color:#e36209}.hljs-code,.hljs-comment,.hljs-formula{color:#6a737d}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#22863a}.hljs-subst{color:#24292e}.hljs-section{color:#005cc5;font-weight:700}.hljs-bullet{color:#735c0f}.hljs-emphasis{color:#24292e;font-style:italic}.hljs-strong{color:#24292e;font-weight:700}.hljs-addition{color:#22863a;background-color:#f0fff4}.hljs-deletion{color:#b31d28;background-color:#ffeef0}`, pt = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!
  Theme: GitHub Dark
  Description: Dark theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-dark
  Current colors taken from GitHub's CSS
*/.hljs{color:#c9d1d9;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}`, ge = (t) => `<style>${t}</style>`, On = (t) => `<style>@media(prefers-color-scheme:dark){${t}}</style>`, Tn = {
  HOST: "<style>:host{display:block;position:relative;contain:content;}:host([hidden]){display:none;}</style>",
  MARKDOWN: ge(Nn),
  MARKDOWN_LIGHT: ge(Sn),
  MARKDOWN_DARK: ge(Mn),
  HIGHLIGHT_LIGHT: ge(Bn),
  HIGHLIGHT_DARK: ge(pt),
  HIGHLIGHT_PREFERS_DARK: On(pt),
  preset(t = "") {
    const { HOST: e, MARKDOWN: n, MARKDOWN_LIGHT: o, MARKDOWN_DARK: a, HIGHLIGHT_LIGHT: r, HIGHLIGHT_DARK: i, HIGHLIGHT_PREFERS_DARK: s } = this;
    switch (t) {
      case "light":
        return e + o + r;
      case "dark":
        return e + a + i;
      default:
        return e + n + r + s;
    }
  }
};
function ot() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var de = ot();
function Kt(t) {
  de = t;
}
var ie = { exec: () => null };
function D(t, e = "") {
  let n = typeof t == "string" ? t : t.source, o = { replace: (a, r) => {
    let i = typeof r == "string" ? r : r.source;
    return i = i.replace(q.caret, "$1"), n = n.replace(a, i), o;
  }, getRegex: () => new RegExp(n, e) };
  return o;
}
var Rn = ((t = "") => {
  try {
    return !!new RegExp("(?<=1)(?<!1)" + t);
  } catch {
    return !1;
  }
})(), q = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (t) => new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}#`), htmlBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}<(?:[a-z].*>|!--)`, "i"), blockquoteBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}>`) }, $n = /^(?:[ \t]*(?:\n|$))+/, zn = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, In = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, we = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Ln = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, rt = / {0,3}(?:[*+-]|\d{1,9}[.)])/, Zt = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Gt = D(Zt).replace(/bull/g, rt).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), jn = D(Zt).replace(/bull/g, rt).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), at = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Pn = /^[^\n]+/, it = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Un = D(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", it).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), qn = D(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, rt).getRegex(), Ie = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", st = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Hn = D("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", st).replace("tag", Ie).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Wt = D(at).replace("hr", we).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ie).getRegex(), Kn = D(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Wt).getRegex(), lt = { blockquote: Kn, code: zn, def: Un, fences: In, heading: Ln, hr: we, html: Hn, lheading: Gt, list: qn, newline: $n, paragraph: Wt, table: ie, text: Pn }, gt = D("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", we).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ie).getRegex(), Zn = { ...lt, lheading: jn, table: gt, paragraph: D(at).replace("hr", we).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gt).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ie).getRegex() }, Gn = { ...lt, html: D(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", st).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: ie, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: D(at).replace("hr", we).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Gt).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, Wn = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Qn = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Qt = /^( {2,}|\\)\n(?!\s*$)/, Xn = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, be = /[\p{P}\p{S}]/u, Le = /[\s\p{P}\p{S}]/u, ct = /[^\s\p{P}\p{S}]/u, Vn = D(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Le).getRegex(), Xt = /(?!~)[\p{P}\p{S}]/u, Jn = /(?!~)[\s\p{P}\p{S}]/u, Yn = /(?:[^\s\p{P}\p{S}]|~)/u, eo = D(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Rn ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), Vt = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, to = D(Vt, "u").replace(/punct/g, be).getRegex(), no = D(Vt, "u").replace(/punct/g, Xt).getRegex(), Jt = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", oo = D(Jt, "gu").replace(/notPunctSpace/g, ct).replace(/punctSpace/g, Le).replace(/punct/g, be).getRegex(), ro = D(Jt, "gu").replace(/notPunctSpace/g, Yn).replace(/punctSpace/g, Jn).replace(/punct/g, Xt).getRegex(), ao = D("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ct).replace(/punctSpace/g, Le).replace(/punct/g, be).getRegex(), io = D(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, be).getRegex(), so = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", lo = D(so, "gu").replace(/notPunctSpace/g, ct).replace(/punctSpace/g, Le).replace(/punct/g, be).getRegex(), co = D(/\\(punct)/, "gu").replace(/punct/g, be).getRegex(), uo = D(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), mo = D(st).replace("(?:-->|$)", "-->").getRegex(), bo = D("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", mo).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Oe = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, po = D(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", Oe).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Yt = D(/^!?\[(label)\]\[(ref)\]/).replace("label", Oe).replace("ref", it).getRegex(), en = D(/^!?\[(ref)\](?:\[\])?/).replace("ref", it).getRegex(), go = D("reflink|nolink(?!\\()", "g").replace("reflink", Yt).replace("nolink", en).getRegex(), ht = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, dt = { _backpedal: ie, anyPunctuation: co, autolink: uo, blockSkip: eo, br: Qt, code: Qn, del: ie, delLDelim: ie, delRDelim: ie, emStrongLDelim: to, emStrongRDelimAst: oo, emStrongRDelimUnd: ao, escape: Wn, link: po, nolink: en, punctuation: Vn, reflink: Yt, reflinkSearch: go, tag: bo, text: Xn, url: ie }, ho = { ...dt, link: D(/^!?\[(label)\]\((.*?)\)/).replace("label", Oe).getRegex(), reflink: D(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Oe).getRegex() }, Ye = { ...dt, emStrongRDelimAst: ro, emStrongLDelim: no, delLDelim: io, delRDelim: lo, url: D(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ht).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: D(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ht).getRegex() }, fo = { ...Ye, br: D(Qt).replace("{2,}", "*").getRegex(), text: D(Ye.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, ve = { normal: lt, gfm: Zn, pedantic: Gn }, he = { normal: dt, gfm: Ye, breaks: fo, pedantic: ho }, ko = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, ft = (t) => ko[t];
function X(t, e) {
  if (e) {
    if (q.escapeTest.test(t)) return t.replace(q.escapeReplace, ft);
  } else if (q.escapeTestNoEncode.test(t)) return t.replace(q.escapeReplaceNoEncode, ft);
  return t;
}
function kt(t) {
  try {
    t = encodeURI(t).replace(q.percentDecode, "%");
  } catch {
    return null;
  }
  return t;
}
function yt(t, e) {
  var r;
  let n = t.replace(q.findPipe, (i, s, l) => {
    let d = !1, c = s;
    for (; --c >= 0 && l[c] === "\\"; ) d = !d;
    return d ? "|" : " |";
  }), o = n.split(q.splitPipe), a = 0;
  if (o[0].trim() || o.shift(), o.length > 0 && !((r = o.at(-1)) != null && r.trim()) && o.pop(), e) if (o.length > e) o.splice(e);
  else for (; o.length < e; ) o.push("");
  for (; a < o.length; a++) o[a] = o[a].trim().replace(q.slashPipe, "|");
  return o;
}
function ne(t, e, n) {
  let o = t.length;
  if (o === 0) return "";
  let a = 0;
  for (; a < o && t.charAt(o - a - 1) === e; )
    a++;
  return t.slice(0, o - a);
}
function wt(t) {
  let e = t.split(`
`), n = e.length - 1;
  for (; n >= 0 && q.blankLine.test(e[n]); ) n--;
  return e.length - n <= 2 ? t : e.slice(0, n + 1).join(`
`);
}
function yo(t, e) {
  if (t.indexOf(e[1]) === -1) return -1;
  let n = 0;
  for (let o = 0; o < t.length; o++) if (t[o] === "\\") o++;
  else if (t[o] === e[0]) n++;
  else if (t[o] === e[1] && (n--, n < 0)) return o;
  return n > 0 ? -2 : -1;
}
function wo(t, e = 0) {
  let n = e, o = "";
  for (let a of t) if (a === "	") {
    let r = 4 - n % 4;
    o += " ".repeat(r), n += r;
  } else o += a, n++;
  return o;
}
function _t(t, e, n, o, a) {
  let r = e.href, i = e.title || null, s = t[1].replace(a.other.outputLinkReplace, "$1");
  o.state.inLink = !0;
  let l = { type: t[0].charAt(0) === "!" ? "image" : "link", raw: n, href: r, title: i, text: s, tokens: o.inlineTokens(s) };
  return o.state.inLink = !1, l;
}
function _o(t, e, n) {
  let o = t.match(n.other.indentCodeCompensation);
  if (o === null) return e;
  let a = o[1];
  return e.split(`
`).map((r) => {
    let i = r.match(n.other.beginningSpace);
    if (i === null) return r;
    let [s] = i;
    return s.length >= a.length ? r.slice(a.length) : r;
  }).join(`
`);
}
var Te = class {
  constructor(e) {
    R(this, "options");
    R(this, "rules");
    R(this, "lexer");
    this.options = e || de;
  }
  space(e) {
    let n = this.rules.block.newline.exec(e);
    if (n && n[0].length > 0) return { type: "space", raw: n[0] };
  }
  code(e) {
    let n = this.rules.block.code.exec(e);
    if (n) {
      let o = this.options.pedantic ? n[0] : wt(n[0]), a = o.replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: o, codeBlockStyle: "indented", text: a };
    }
  }
  fences(e) {
    let n = this.rules.block.fences.exec(e);
    if (n) {
      let o = n[0], a = _o(o, n[3] || "", this.rules);
      return { type: "code", raw: o, lang: n[2] ? n[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : n[2], text: a };
    }
  }
  heading(e) {
    let n = this.rules.block.heading.exec(e);
    if (n) {
      let o = n[2].trim();
      if (this.rules.other.endingHash.test(o)) {
        let a = ne(o, "#");
        (this.options.pedantic || !a || this.rules.other.endingSpaceChar.test(a)) && (o = a.trim());
      }
      return { type: "heading", raw: ne(n[0], `
`), depth: n[1].length, text: o, tokens: this.lexer.inline(o) };
    }
  }
  hr(e) {
    let n = this.rules.block.hr.exec(e);
    if (n) return { type: "hr", raw: ne(n[0], `
`) };
  }
  blockquote(e) {
    let n = this.rules.block.blockquote.exec(e);
    if (n) {
      let o = ne(n[0], `
`).split(`
`), a = "", r = "", i = [];
      for (; o.length > 0; ) {
        let s = !1, l = [], d;
        for (d = 0; d < o.length; d++) if (this.rules.other.blockquoteStart.test(o[d])) l.push(o[d]), s = !0;
        else if (!s) l.push(o[d]);
        else break;
        o = o.slice(d);
        let c = l.join(`
`), b = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        a = a ? `${a}
${c}` : c, r = r ? `${r}
${b}` : b;
        let u = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(b, i, !0), this.lexer.state.top = u, o.length === 0) break;
        let p = i.at(-1);
        if ((p == null ? void 0 : p.type) === "code") break;
        if ((p == null ? void 0 : p.type) === "blockquote") {
          let m = p, h = m.raw + `
` + o.join(`
`), y = this.blockquote(h);
          i[i.length - 1] = y, a = a.substring(0, a.length - m.raw.length) + y.raw, r = r.substring(0, r.length - m.text.length) + y.text;
          break;
        } else if ((p == null ? void 0 : p.type) === "list") {
          let m = p, h = m.raw + `
` + o.join(`
`), y = this.list(h);
          i[i.length - 1] = y, a = a.substring(0, a.length - p.raw.length) + y.raw, r = r.substring(0, r.length - m.raw.length) + y.raw, o = h.substring(i.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: a, tokens: i, text: r };
    }
  }
  list(e) {
    let n = this.rules.block.list.exec(e);
    if (n) {
      let o = n[1].trim(), a = o.length > 1, r = { type: "list", raw: "", ordered: a, start: a ? +o.slice(0, -1) : "", loose: !1, items: [] };
      o = a ? `\\d{1,9}\\${o.slice(-1)}` : `\\${o}`, this.options.pedantic && (o = a ? o : "[*+-]");
      let i = this.rules.other.listItemRegex(o), s = !1;
      for (; e; ) {
        let d = !1, c = "", b = "";
        if (!(n = i.exec(e)) || this.rules.block.hr.test(e)) break;
        c = n[0], e = e.substring(c.length);
        let u = wo(n[2].split(`
`, 1)[0], n[1].length), p = e.split(`
`, 1)[0], m = !u.trim(), h = 0;
        if (this.options.pedantic ? (h = 2, b = u.trimStart()) : m ? h = n[1].length + 1 : (h = u.search(this.rules.other.nonSpaceChar), h = h > 4 ? 1 : h, b = u.slice(h), h += n[1].length), m && this.rules.other.blankLine.test(p) && (c += p + `
`, e = e.substring(p.length + 1), d = !0), !d) {
          let y = this.rules.other.nextBulletRegex(h), j = this.rules.other.hrRegex(h), B = this.rules.other.fencesBeginRegex(h), g = this.rules.other.headingBeginRegex(h), k = this.rules.other.htmlBeginRegex(h), _ = this.rules.other.blockquoteBeginRegex(h);
          for (; e; ) {
            let M = e.split(`
`, 1)[0], C;
            if (p = M, this.options.pedantic ? (p = p.replace(this.rules.other.listReplaceNesting, "  "), C = p) : C = p.replace(this.rules.other.tabCharGlobal, "    "), B.test(p) || g.test(p) || k.test(p) || _.test(p) || y.test(p) || j.test(p)) break;
            if (C.search(this.rules.other.nonSpaceChar) >= h || !p.trim()) b += `
` + C.slice(h);
            else {
              if (m || u.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || B.test(u) || g.test(u) || j.test(u)) break;
              b += `
` + p;
            }
            m = !p.trim(), c += M + `
`, e = e.substring(M.length + 1), u = C.slice(h);
          }
        }
        r.loose || (s ? r.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (s = !0)), r.items.push({ type: "list_item", raw: c, task: !!this.options.gfm && this.rules.other.listIsTask.test(b), loose: !1, text: b, tokens: [] }), r.raw += c;
      }
      let l = r.items.at(-1);
      if (l) l.raw = l.raw.trimEnd(), l.text = l.text.trimEnd();
      else return;
      r.raw = r.raw.trimEnd();
      for (let d of r.items) {
        this.lexer.state.top = !1, d.tokens = this.lexer.blockTokens(d.text, []);
        let c = d.tokens[0];
        if (d.task && ((c == null ? void 0 : c.type) === "text" || (c == null ? void 0 : c.type) === "paragraph")) {
          d.text = d.text.replace(this.rules.other.listReplaceTask, ""), c.raw = c.raw.replace(this.rules.other.listReplaceTask, ""), c.text = c.text.replace(this.rules.other.listReplaceTask, "");
          for (let u = this.lexer.inlineQueue.length - 1; u >= 0; u--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[u].src)) {
            this.lexer.inlineQueue[u].src = this.lexer.inlineQueue[u].src.replace(this.rules.other.listReplaceTask, "");
            break;
          }
          let b = this.rules.other.listTaskCheckbox.exec(d.raw);
          if (b) {
            let u = { type: "checkbox", raw: b[0] + " ", checked: b[0] !== "[ ]" };
            d.checked = u.checked, r.loose ? d.tokens[0] && ["paragraph", "text"].includes(d.tokens[0].type) && "tokens" in d.tokens[0] && d.tokens[0].tokens ? (d.tokens[0].raw = u.raw + d.tokens[0].raw, d.tokens[0].text = u.raw + d.tokens[0].text, d.tokens[0].tokens.unshift(u)) : d.tokens.unshift({ type: "paragraph", raw: u.raw, text: u.raw, tokens: [u] }) : d.tokens.unshift(u);
          }
        } else d.task && (d.task = !1);
        if (!r.loose) {
          let b = d.tokens.filter((p) => p.type === "space"), u = b.length > 0 && b.some((p) => this.rules.other.anyLine.test(p.raw));
          r.loose = u;
        }
      }
      if (r.loose) for (let d of r.items) {
        d.loose = !0;
        for (let c of d.tokens) c.type === "text" && (c.type = "paragraph");
      }
      return r;
    }
  }
  html(e) {
    let n = this.rules.block.html.exec(e);
    if (n) {
      let o = wt(n[0]);
      return { type: "html", block: !0, raw: o, pre: n[1] === "pre" || n[1] === "script" || n[1] === "style", text: o };
    }
  }
  def(e) {
    let n = this.rules.block.def.exec(e);
    if (n) {
      let o = n[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), a = n[2] ? n[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = n[3] ? n[3].substring(1, n[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : n[3];
      return { type: "def", tag: o, raw: ne(n[0], `
`), href: a, title: r };
    }
  }
  table(e) {
    var s;
    let n = this.rules.block.table.exec(e);
    if (!n || !this.rules.other.tableDelimiter.test(n[2])) return;
    let o = yt(n[1]), a = n[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = (s = n[3]) != null && s.trim() ? n[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: ne(n[0], `
`), header: [], align: [], rows: [] };
    if (o.length === a.length) {
      for (let l of a) this.rules.other.tableAlignRight.test(l) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(l) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(l) ? i.align.push("left") : i.align.push(null);
      for (let l = 0; l < o.length; l++) i.header.push({ text: o[l], tokens: this.lexer.inline(o[l]), header: !0, align: i.align[l] });
      for (let l of r) i.rows.push(yt(l, i.header.length).map((d, c) => ({ text: d, tokens: this.lexer.inline(d), header: !1, align: i.align[c] })));
      return i;
    }
  }
  lheading(e) {
    let n = this.rules.block.lheading.exec(e);
    if (n) {
      let o = n[1].trim();
      return { type: "heading", raw: ne(n[0], `
`), depth: n[2].charAt(0) === "=" ? 1 : 2, text: o, tokens: this.lexer.inline(o) };
    }
  }
  paragraph(e) {
    let n = this.rules.block.paragraph.exec(e);
    if (n) {
      let o = n[1].charAt(n[1].length - 1) === `
` ? n[1].slice(0, -1) : n[1];
      return { type: "paragraph", raw: n[0], text: o, tokens: this.lexer.inline(o) };
    }
  }
  text(e) {
    let n = this.rules.block.text.exec(e);
    if (n) return { type: "text", raw: n[0], text: n[0], tokens: this.lexer.inline(n[0]) };
  }
  escape(e) {
    let n = this.rules.inline.escape.exec(e);
    if (n) return { type: "escape", raw: n[0], text: n[1] };
  }
  tag(e) {
    let n = this.rules.inline.tag.exec(e);
    if (n) return !this.lexer.state.inLink && this.rules.other.startATag.test(n[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(n[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(n[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(n[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: n[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: n[0] };
  }
  link(e) {
    let n = this.rules.inline.link.exec(e);
    if (n) {
      let o = n[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(o)) {
        if (!this.rules.other.endAngleBracket.test(o)) return;
        let i = ne(o.slice(0, -1), "\\");
        if ((o.length - i.length) % 2 === 0) return;
      } else {
        let i = yo(n[2], "()");
        if (i === -2) return;
        if (i > -1) {
          let s = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + i;
          n[2] = n[2].substring(0, i), n[0] = n[0].substring(0, s).trim(), n[3] = "";
        }
      }
      let a = n[2], r = "";
      if (this.options.pedantic) {
        let i = this.rules.other.pedanticHrefTitle.exec(a);
        i && (a = i[1], r = i[3]);
      } else r = n[3] ? n[3].slice(1, -1) : "";
      return a = a.trim(), this.rules.other.startAngleBracket.test(a) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(o) ? a = a.slice(1) : a = a.slice(1, -1)), _t(n, { href: a && a.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, n[0], this.lexer, this.rules);
    }
  }
  reflink(e, n) {
    let o;
    if ((o = this.rules.inline.reflink.exec(e)) || (o = this.rules.inline.nolink.exec(e))) {
      let a = (o[2] || o[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = n[a.toLowerCase()];
      if (!r) {
        let i = o[0].charAt(0);
        return { type: "text", raw: i, text: i };
      }
      return _t(o, r, o[0], this.lexer, this.rules);
    }
  }
  emStrong(e, n, o = "") {
    let a = this.rules.inline.emStrongLDelim.exec(e);
    if (!(!a || !a[1] && !a[2] && !a[3] && !a[4] || a[4] && o.match(this.rules.other.unicodeAlphaNumeric)) && (!(a[1] || a[3]) || !o || this.rules.inline.punctuation.exec(o))) {
      let r = [...a[0]].length - 1, i, s, l = r, d = 0, c = a[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, n = n.slice(-1 * e.length + r); (a = c.exec(n)) !== null; ) {
        if (i = a[1] || a[2] || a[3] || a[4] || a[5] || a[6], !i) continue;
        if (s = [...i].length, a[3] || a[4]) {
          l += s;
          continue;
        } else if ((a[5] || a[6]) && r % 3 && !((r + s) % 3)) {
          d += s;
          continue;
        }
        if (l -= s, l > 0) continue;
        s = Math.min(s, s + l + d);
        let b = [...a[0]][0].length, u = e.slice(0, r + a.index + b + s);
        if (Math.min(r, s) % 2) {
          let m = u.slice(1, -1);
          return { type: "em", raw: u, text: m, tokens: this.lexer.inlineTokens(m) };
        }
        let p = u.slice(2, -2);
        return { type: "strong", raw: u, text: p, tokens: this.lexer.inlineTokens(p) };
      }
    }
  }
  codespan(e) {
    let n = this.rules.inline.code.exec(e);
    if (n) {
      let o = n[2].replace(this.rules.other.newLineCharGlobal, " "), a = this.rules.other.nonSpaceChar.test(o), r = this.rules.other.startingSpaceChar.test(o) && this.rules.other.endingSpaceChar.test(o);
      return a && r && (o = o.substring(1, o.length - 1)), { type: "codespan", raw: n[0], text: o };
    }
  }
  br(e) {
    let n = this.rules.inline.br.exec(e);
    if (n) return { type: "br", raw: n[0] };
  }
  del(e, n, o = "") {
    let a = this.rules.inline.delLDelim.exec(e);
    if (a && (!a[1] || !o || this.rules.inline.punctuation.exec(o))) {
      let r = [...a[0]].length - 1, i, s, l = r, d = this.rules.inline.delRDelim;
      for (d.lastIndex = 0, n = n.slice(-1 * e.length + r); (a = d.exec(n)) !== null; ) {
        if (i = a[1] || a[2] || a[3] || a[4] || a[5] || a[6], !i || (s = [...i].length, s !== r)) continue;
        if (a[3] || a[4]) {
          l += s;
          continue;
        }
        if (l -= s, l > 0) continue;
        s = Math.min(s, s + l);
        let c = [...a[0]][0].length, b = e.slice(0, r + a.index + c + s), u = b.slice(r, -r);
        return { type: "del", raw: b, text: u, tokens: this.lexer.inlineTokens(u) };
      }
    }
  }
  autolink(e) {
    let n = this.rules.inline.autolink.exec(e);
    if (n) {
      let o, a;
      return n[2] === "@" ? (o = n[1], a = "mailto:" + o) : (o = n[1], a = o), { type: "link", raw: n[0], text: o, href: a, tokens: [{ type: "text", raw: o, text: o }] };
    }
  }
  url(e) {
    var o;
    let n;
    if (n = this.rules.inline.url.exec(e)) {
      let a, r;
      if (n[2] === "@") a = n[0], r = "mailto:" + a;
      else {
        let i;
        do
          i = n[0], n[0] = ((o = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : o[0]) ?? "";
        while (i !== n[0]);
        a = n[0], n[1] === "www." ? r = "http://" + n[0] : r = n[0];
      }
      return { type: "link", raw: n[0], text: a, href: r, tokens: [{ type: "text", raw: a, text: a }] };
    }
  }
  inlineText(e) {
    let n = this.rules.inline.text.exec(e);
    if (n) {
      let o = this.lexer.state.inRawBlock;
      return { type: "text", raw: n[0], text: n[0], escaped: o };
    }
  }
}, G = class et {
  constructor(e) {
    R(this, "tokens");
    R(this, "options");
    R(this, "state");
    R(this, "inlineQueue");
    R(this, "tokenizer");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || de, this.options.tokenizer = this.options.tokenizer || new Te(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let n = { other: q, block: ve.normal, inline: he.normal };
    this.options.pedantic ? (n.block = ve.pedantic, n.inline = he.pedantic) : this.options.gfm && (n.block = ve.gfm, this.options.breaks ? n.inline = he.breaks : n.inline = he.gfm), this.tokenizer.rules = n;
  }
  static get rules() {
    return { block: ve, inline: he };
  }
  static lex(e, n) {
    return new et(n).lex(e);
  }
  static lexInline(e, n) {
    return new et(n).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(q.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      let o = this.inlineQueue[n];
      this.inlineTokens(o.src, o.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, n = [], o = !1) {
    var r, i, s;
    this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(q.tabCharGlobal, "    ").replace(q.spaceLine, ""));
    let a = 1 / 0;
    for (; e; ) {
      if (e.length < a) a = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      let l;
      if ((i = (r = this.options.extensions) == null ? void 0 : r.block) != null && i.some((c) => (l = c.call({ lexer: this }, e, n)) ? (e = e.substring(l.raw.length), n.push(l), !0) : !1)) continue;
      if (l = this.tokenizer.space(e)) {
        e = e.substring(l.raw.length);
        let c = n.at(-1);
        l.raw.length === 1 && c !== void 0 ? c.raw += `
` : n.push(l);
        continue;
      }
      if (l = this.tokenizer.code(e)) {
        e = e.substring(l.raw.length);
        let c = n.at(-1);
        (c == null ? void 0 : c.type) === "paragraph" || (c == null ? void 0 : c.type) === "text" ? (c.raw += (c.raw.endsWith(`
`) ? "" : `
`) + l.raw, c.text += `
` + l.text, this.inlineQueue.at(-1).src = c.text) : n.push(l);
        continue;
      }
      if (l = this.tokenizer.fences(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.heading(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.hr(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.blockquote(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.list(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.html(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.def(e)) {
        e = e.substring(l.raw.length);
        let c = n.at(-1);
        (c == null ? void 0 : c.type) === "paragraph" || (c == null ? void 0 : c.type) === "text" ? (c.raw += (c.raw.endsWith(`
`) ? "" : `
`) + l.raw, c.text += `
` + l.raw, this.inlineQueue.at(-1).src = c.text) : this.tokens.links[l.tag] || (this.tokens.links[l.tag] = { href: l.href, title: l.title }, n.push(l));
        continue;
      }
      if (l = this.tokenizer.table(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      if (l = this.tokenizer.lheading(e)) {
        e = e.substring(l.raw.length), n.push(l);
        continue;
      }
      let d = e;
      if ((s = this.options.extensions) != null && s.startBlock) {
        let c = 1 / 0, b = e.slice(1), u;
        this.options.extensions.startBlock.forEach((p) => {
          u = p.call({ lexer: this }, b), typeof u == "number" && u >= 0 && (c = Math.min(c, u));
        }), c < 1 / 0 && c >= 0 && (d = e.substring(0, c + 1));
      }
      if (this.state.top && (l = this.tokenizer.paragraph(d))) {
        let c = n.at(-1);
        o && (c == null ? void 0 : c.type) === "paragraph" ? (c.raw += (c.raw.endsWith(`
`) ? "" : `
`) + l.raw, c.text += `
` + l.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = c.text) : n.push(l), o = d.length !== e.length, e = e.substring(l.raw.length);
        continue;
      }
      if (l = this.tokenizer.text(e)) {
        e = e.substring(l.raw.length);
        let c = n.at(-1);
        (c == null ? void 0 : c.type) === "text" ? (c.raw += (c.raw.endsWith(`
`) ? "" : `
`) + l.raw, c.text += `
` + l.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = c.text) : n.push(l);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return this.state.top = !0, n;
  }
  inline(e, n = []) {
    return this.inlineQueue.push({ src: e, tokens: n }), n;
  }
  inlineTokens(e, n = []) {
    var d, c, b, u, p;
    this.tokenizer.lexer = this;
    let o = e, a = null;
    if (this.tokens.links) {
      let m = Object.keys(this.tokens.links);
      if (m.length > 0) for (; (a = this.tokenizer.rules.inline.reflinkSearch.exec(o)) !== null; ) m.includes(a[0].slice(a[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, a.index) + "[" + "a".repeat(a[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (a = this.tokenizer.rules.inline.anyPunctuation.exec(o)) !== null; ) o = o.slice(0, a.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let r;
    for (; (a = this.tokenizer.rules.inline.blockSkip.exec(o)) !== null; ) r = a[2] ? a[2].length : 0, o = o.slice(0, a.index + r) + "[" + "a".repeat(a[0].length - r - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    o = ((c = (d = this.options.hooks) == null ? void 0 : d.emStrongMask) == null ? void 0 : c.call({ lexer: this }, o)) ?? o;
    let i = !1, s = "", l = 1 / 0;
    for (; e; ) {
      if (e.length < l) l = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      i || (s = ""), i = !1;
      let m;
      if ((u = (b = this.options.extensions) == null ? void 0 : b.inline) != null && u.some((y) => (m = y.call({ lexer: this }, e, n)) ? (e = e.substring(m.raw.length), n.push(m), !0) : !1)) continue;
      if (m = this.tokenizer.escape(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.tag(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.link(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(m.raw.length);
        let y = n.at(-1);
        m.type === "text" && (y == null ? void 0 : y.type) === "text" ? (y.raw += m.raw, y.text += m.text) : n.push(m);
        continue;
      }
      if (m = this.tokenizer.emStrong(e, o, s)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.codespan(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.br(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.del(e, o, s)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (m = this.tokenizer.autolink(e)) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      if (!this.state.inLink && (m = this.tokenizer.url(e))) {
        e = e.substring(m.raw.length), n.push(m);
        continue;
      }
      let h = e;
      if ((p = this.options.extensions) != null && p.startInline) {
        let y = 1 / 0, j = e.slice(1), B;
        this.options.extensions.startInline.forEach((g) => {
          B = g.call({ lexer: this }, j), typeof B == "number" && B >= 0 && (y = Math.min(y, B));
        }), y < 1 / 0 && y >= 0 && (h = e.substring(0, y + 1));
      }
      if (m = this.tokenizer.inlineText(h)) {
        e = e.substring(m.raw.length), m.raw.slice(-1) !== "_" && (s = m.raw.slice(-1)), i = !0;
        let y = n.at(-1);
        (y == null ? void 0 : y.type) === "text" ? (y.raw += m.raw, y.text += m.text) : n.push(m);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return n;
  }
  infiniteLoopError(e) {
    let n = "Infinite loop on byte: " + e;
    if (this.options.silent) console.error(n);
    else throw new Error(n);
  }
}, Re = class {
  constructor(e) {
    R(this, "options");
    R(this, "parser");
    this.options = e || de;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: n, escaped: o }) {
    var i;
    let a = (i = (n || "").match(q.notSpaceStart)) == null ? void 0 : i[0], r = e.replace(q.endingNewline, "") + `
`;
    return a ? '<pre><code class="language-' + X(a) + '">' + (o ? r : X(r, !0)) + `</code></pre>
` : "<pre><code>" + (o ? r : X(r, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: n }) {
    return `<h${n}>${this.parser.parseInline(e)}</h${n}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let n = e.ordered, o = e.start, a = "";
    for (let s = 0; s < e.items.length; s++) {
      let l = e.items[s];
      a += this.listitem(l);
    }
    let r = n ? "ol" : "ul", i = n && o !== 1 ? ' start="' + o + '"' : "";
    return "<" + r + i + `>
` + a + "</" + r + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let n = "", o = "";
    for (let r = 0; r < e.header.length; r++) o += this.tablecell(e.header[r]);
    n += this.tablerow({ text: o });
    let a = "";
    for (let r = 0; r < e.rows.length; r++) {
      let i = e.rows[r];
      o = "";
      for (let s = 0; s < i.length; s++) o += this.tablecell(i[s]);
      a += this.tablerow({ text: o });
    }
    return a && (a = `<tbody>${a}</tbody>`), `<table>
<thead>
` + n + `</thead>
` + a + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let n = this.parser.parseInline(e.tokens), o = e.header ? "th" : "td";
    return (e.align ? `<${o} align="${e.align}">` : `<${o}>`) + n + `</${o}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${X(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: n, tokens: o }) {
    let a = this.parser.parseInline(o), r = kt(e);
    if (r === null) return a;
    e = r;
    let i = '<a href="' + e + '"';
    return n && (i += ' title="' + X(n) + '"'), i += ">" + a + "</a>", i;
  }
  image({ href: e, title: n, text: o, tokens: a }) {
    a && (o = this.parser.parseInline(a, this.parser.textRenderer));
    let r = kt(e);
    if (r === null) return X(o);
    e = r;
    let i = `<img src="${e}" alt="${X(o)}"`;
    return n && (i += ` title="${X(n)}"`), i += ">", i;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : X(e.text);
  }
}, ut = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
}, W = class tt {
  constructor(e) {
    R(this, "options");
    R(this, "renderer");
    R(this, "textRenderer");
    this.options = e || de, this.options.renderer = this.options.renderer || new Re(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new ut();
  }
  static parse(e, n) {
    return new tt(n).parse(e);
  }
  static parseInline(e, n) {
    return new tt(n).parseInline(e);
  }
  parse(e) {
    var o, a;
    this.renderer.parser = this;
    let n = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if ((a = (o = this.options.extensions) == null ? void 0 : o.renderers) != null && a[i.type]) {
        let l = i, d = this.options.extensions.renderers[l.type].call({ parser: this }, l);
        if (d !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(l.type)) {
          n += d || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "space": {
          n += this.renderer.space(s);
          break;
        }
        case "hr": {
          n += this.renderer.hr(s);
          break;
        }
        case "heading": {
          n += this.renderer.heading(s);
          break;
        }
        case "code": {
          n += this.renderer.code(s);
          break;
        }
        case "table": {
          n += this.renderer.table(s);
          break;
        }
        case "blockquote": {
          n += this.renderer.blockquote(s);
          break;
        }
        case "list": {
          n += this.renderer.list(s);
          break;
        }
        case "checkbox": {
          n += this.renderer.checkbox(s);
          break;
        }
        case "html": {
          n += this.renderer.html(s);
          break;
        }
        case "def": {
          n += this.renderer.def(s);
          break;
        }
        case "paragraph": {
          n += this.renderer.paragraph(s);
          break;
        }
        case "text": {
          n += this.renderer.text(s);
          break;
        }
        default: {
          let l = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent) return console.error(l), "";
          throw new Error(l);
        }
      }
    }
    return n;
  }
  parseInline(e, n = this.renderer) {
    var a, r;
    this.renderer.parser = this;
    let o = "";
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      if ((r = (a = this.options.extensions) == null ? void 0 : a.renderers) != null && r[s.type]) {
        let d = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (d !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          o += d || "";
          continue;
        }
      }
      let l = s;
      switch (l.type) {
        case "escape": {
          o += n.text(l);
          break;
        }
        case "html": {
          o += n.html(l);
          break;
        }
        case "link": {
          o += n.link(l);
          break;
        }
        case "image": {
          o += n.image(l);
          break;
        }
        case "checkbox": {
          o += n.checkbox(l);
          break;
        }
        case "strong": {
          o += n.strong(l);
          break;
        }
        case "em": {
          o += n.em(l);
          break;
        }
        case "codespan": {
          o += n.codespan(l);
          break;
        }
        case "br": {
          o += n.br(l);
          break;
        }
        case "del": {
          o += n.del(l);
          break;
        }
        case "text": {
          o += n.text(l);
          break;
        }
        default: {
          let d = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent) return console.error(d), "";
          throw new Error(d);
        }
      }
    }
    return o;
  }
}, Ne, fe = (Ne = class {
  constructor(e) {
    R(this, "options");
    R(this, "block");
    this.options = e || de;
  }
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer(e = this.block) {
    return e ? G.lex : G.lexInline;
  }
  provideParser(e = this.block) {
    return e ? W.parse : W.parseInline;
  }
}, R(Ne, "passThroughHooks", /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"])), R(Ne, "passThroughHooksRespectAsync", /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"])), Ne), tn = class {
  constructor(...e) {
    R(this, "defaults", ot());
    R(this, "options", this.setOptions);
    R(this, "parse", this.parseMarkdown(!0));
    R(this, "parseInline", this.parseMarkdown(!1));
    R(this, "Parser", W);
    R(this, "Renderer", Re);
    R(this, "TextRenderer", ut);
    R(this, "Lexer", G);
    R(this, "Tokenizer", Te);
    R(this, "Hooks", fe);
    this.use(...e);
  }
  walkTokens(e, n) {
    var a, r;
    let o = [];
    for (let i of e) switch (o = o.concat(n.call(this, i)), i.type) {
      case "table": {
        let s = i;
        for (let l of s.header) o = o.concat(this.walkTokens(l.tokens, n));
        for (let l of s.rows) for (let d of l) o = o.concat(this.walkTokens(d.tokens, n));
        break;
      }
      case "list": {
        let s = i;
        o = o.concat(this.walkTokens(s.items, n));
        break;
      }
      default: {
        let s = i;
        (r = (a = this.defaults.extensions) == null ? void 0 : a.childTokens) != null && r[s.type] ? this.defaults.extensions.childTokens[s.type].forEach((l) => {
          let d = s[l].flat(1 / 0);
          o = o.concat(this.walkTokens(d, n));
        }) : s.tokens && (o = o.concat(this.walkTokens(s.tokens, n)));
      }
    }
    return o;
  }
  use(...e) {
    let n = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((o) => {
      let a = { ...o };
      if (a.async = this.defaults.async || a.async || !1, o.extensions && (o.extensions.forEach((r) => {
        if (!r.name) throw new Error("extension name required");
        if ("renderer" in r) {
          let i = n.renderers[r.name];
          i ? n.renderers[r.name] = function(...s) {
            let l = r.renderer.apply(this, s);
            return l === !1 && (l = i.apply(this, s)), l;
          } : n.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let i = n[r.level];
          i ? i.unshift(r.tokenizer) : n[r.level] = [r.tokenizer], r.start && (r.level === "block" ? n.startBlock ? n.startBlock.push(r.start) : n.startBlock = [r.start] : r.level === "inline" && (n.startInline ? n.startInline.push(r.start) : n.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (n.childTokens[r.name] = r.childTokens);
      }), a.extensions = n), o.renderer) {
        let r = this.defaults.renderer || new Re(this.defaults);
        for (let i in o.renderer) {
          if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
          if (["options", "parser"].includes(i)) continue;
          let s = i, l = o.renderer[s], d = r[s];
          r[s] = (...c) => {
            let b = l.apply(r, c);
            return b === !1 && (b = d.apply(r, c)), b || "";
          };
        }
        a.renderer = r;
      }
      if (o.tokenizer) {
        let r = this.defaults.tokenizer || new Te(this.defaults);
        for (let i in o.tokenizer) {
          if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i)) continue;
          let s = i, l = o.tokenizer[s], d = r[s];
          r[s] = (...c) => {
            let b = l.apply(r, c);
            return b === !1 && (b = d.apply(r, c)), b;
          };
        }
        a.tokenizer = r;
      }
      if (o.hooks) {
        let r = this.defaults.hooks || new fe();
        for (let i in o.hooks) {
          if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
          if (["options", "block"].includes(i)) continue;
          let s = i, l = o.hooks[s], d = r[s];
          fe.passThroughHooks.has(i) ? r[s] = (c) => {
            if (this.defaults.async && fe.passThroughHooksRespectAsync.has(i)) return (async () => {
              let u = await l.call(r, c);
              return d.call(r, u);
            })();
            let b = l.call(r, c);
            return d.call(r, b);
          } : r[s] = (...c) => {
            if (this.defaults.async) return (async () => {
              let u = await l.apply(r, c);
              return u === !1 && (u = await d.apply(r, c)), u;
            })();
            let b = l.apply(r, c);
            return b === !1 && (b = d.apply(r, c)), b;
          };
        }
        a.hooks = r;
      }
      if (o.walkTokens) {
        let r = this.defaults.walkTokens, i = o.walkTokens;
        a.walkTokens = function(s) {
          let l = [];
          return l.push(i.call(this, s)), r && (l = l.concat(r.call(this, s))), l;
        };
      }
      this.defaults = { ...this.defaults, ...a };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, n) {
    return G.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return W.parse(e, n ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, o) => {
      let a = { ...o }, r = { ...this.defaults, ...a }, i = this.onError(!!r.silent, !!r.async);
      if (this.defaults.async === !0 && a.async === !1) return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return i(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (r.hooks && (r.hooks.options = r, r.hooks.block = e), r.async) return (async () => {
        let s = r.hooks ? await r.hooks.preprocess(n) : n, l = await (r.hooks ? await r.hooks.provideLexer(e) : e ? G.lex : G.lexInline)(s, r), d = r.hooks ? await r.hooks.processAllTokens(l) : l;
        r.walkTokens && await Promise.all(this.walkTokens(d, r.walkTokens));
        let c = await (r.hooks ? await r.hooks.provideParser(e) : e ? W.parse : W.parseInline)(d, r);
        return r.hooks ? await r.hooks.postprocess(c) : c;
      })().catch(i);
      try {
        r.hooks && (n = r.hooks.preprocess(n));
        let s = (r.hooks ? r.hooks.provideLexer(e) : e ? G.lex : G.lexInline)(n, r);
        r.hooks && (s = r.hooks.processAllTokens(s)), r.walkTokens && this.walkTokens(s, r.walkTokens);
        let l = (r.hooks ? r.hooks.provideParser(e) : e ? W.parse : W.parseInline)(s, r);
        return r.hooks && (l = r.hooks.postprocess(l)), l;
      } catch (s) {
        return i(s);
      }
    };
  }
  onError(e, n) {
    return (o) => {
      if (o.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let a = "<p>An error occurred:</p><pre>" + X(o.message + "", !0) + "</pre>";
        return n ? Promise.resolve(a) : a;
      }
      if (n) return Promise.reject(o);
      throw o;
    };
  }
}, ce = new tn();
function $(t, e) {
  return ce.parse(t, e);
}
$.options = $.setOptions = function(t) {
  return ce.setOptions(t), $.defaults = ce.defaults, Kt($.defaults), $;
};
$.getDefaults = ot;
$.defaults = de;
$.use = function(...t) {
  return ce.use(...t), $.defaults = ce.defaults, Kt($.defaults), $;
};
$.walkTokens = function(t, e) {
  return ce.walkTokens(t, e);
};
$.parseInline = ce.parseInline;
$.Parser = W;
$.parser = W.parse;
$.Renderer = Re;
$.TextRenderer = ut;
$.Lexer = G;
$.lexer = G.lex;
$.Tokenizer = Te;
$.Hooks = fe;
$.parse = $;
$.options;
$.setOptions;
$.use;
$.walkTokens;
$.parseInline;
W.parse;
G.lex;
function xo(t) {
  t = t.trim().replace(/\/+$/, "/");
  const e = /^[\w+]+:\/\//, n = e.test(t), o = "http://__dummy__", a = new URL(t, o), r = o.length + (t.startsWith("/") ? 0 : 1);
  return {
    walkTokens(i) {
      if (["link", "image"].includes(i.type) && !e.test(i.href) && !i.href.startsWith("#"))
        if (n)
          try {
            i.href = new URL(i.href, t).href;
          } catch {
          }
        else {
          if (i.href.startsWith("/"))
            return;
          try {
            const s = new URL(i.href, a).href;
            i.href = s.slice(r);
          } catch {
          }
        }
    }
  };
}
function vo(t) {
  if (typeof t == "function" && (t = {
    highlight: t
  }), !t || typeof t.highlight != "function")
    throw new Error("Must provide highlight function");
  return typeof t.langPrefix != "string" && (t.langPrefix = "language-"), typeof t.emptyLangClass != "string" && (t.emptyLangClass = ""), {
    async: !!t.async,
    walkTokens(e) {
      if (e.type !== "code")
        return;
      const n = xt(e.lang);
      if (t.async)
        return Promise.resolve(t.highlight(e.text, n, e.lang || "")).then(vt(e));
      const o = t.highlight(e.text, n, e.lang || "");
      if (o instanceof Promise)
        throw new Error("markedHighlight is not set to async but the highlight function is async. Set the async option to true on markedHighlight to await the async highlight function.");
      vt(e)(o);
    },
    useNewRenderer: !0,
    renderer: {
      code(e, n, o) {
        typeof e == "object" && (o = e.escaped, n = e.lang, e = e.text);
        const a = xt(n), r = a ? t.langPrefix + Dt(a) : t.emptyLangClass, i = r ? ` class="${r}"` : "";
        return e = e.replace(/\n$/, ""), `<pre><code${i}>${o ? e : Dt(e, !0)}
</code></pre>`;
      }
    }
  };
}
function xt(t) {
  return (t || "").match(/\S*/)[0];
}
function vt(t) {
  return (e) => {
    typeof e == "string" && e !== t.text && (t.escaped = !0, t.text = e);
  };
}
const nn = /[&<>"']/, Eo = new RegExp(nn.source, "g"), on = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Do = new RegExp(on.source, "g"), Co = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Et = (t) => Co[t];
function Dt(t, e) {
  if (e) {
    if (nn.test(t))
      return t.replace(Eo, Et);
  } else if (on.test(t))
    return t.replace(Do, Et);
  return t;
}
const Fo = /[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g, Ao = Object.hasOwnProperty;
class rn {
  /**
   * Create a new slug class.
   */
  constructor() {
    this.occurrences, this.reset();
  }
  /**
   * Generate a unique slug.
  *
  * Tracks previously generated slugs: repeated calls with the same value
  * will result in different slugs.
  * Use the `slug` function to get same slugs.
   *
   * @param  {string} value
   *   String of text to slugify
   * @param  {boolean} [maintainCase=false]
   *   Keep the current case, otherwise make all lowercase
   * @return {string}
   *   A unique slug string
   */
  slug(e, n) {
    const o = this;
    let a = No(e, n === !0);
    const r = a;
    for (; Ao.call(o.occurrences, a); )
      o.occurrences[r]++, a = r + "-" + o.occurrences[r];
    return o.occurrences[a] = 0, a;
  }
  /**
   * Reset - Forget all previous slugs
   *
   * @return void
   */
  reset() {
    this.occurrences = /* @__PURE__ */ Object.create(null);
  }
}
function No(t, e) {
  return typeof t != "string" ? "" : (e || (t = t.toLowerCase()), t.replace(Fo, "").replace(/ /g, "-"));
}
let an = new rn(), sn = [];
const So = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Mo(t) {
  return t.replace(So, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
function Bo({ prefix: t = "", globalSlugs: e = !1 } = {}) {
  return {
    headerIds: !1,
    // prevent deprecation warning; remove this once headerIds option is removed
    hooks: {
      preprocess(n) {
        return e || Oo(), n;
      }
    },
    useNewRenderer: !0,
    renderer: {
      heading({ tokens: n, depth: o }) {
        const a = this.parser.parseInline(n), r = Mo(a).trim().replace(/<[!\/a-z].*?>/gi, ""), i = o, s = `${t}${an.slug(r.toLowerCase())}`, l = { level: i, text: a, id: s, raw: r };
        return sn.push(l), `<h${i} id="${s}">${a}</h${i}>
`;
      }
    }
  };
}
function Oo() {
  sn = [], an = new rn();
}
const Ct = [
  {
    type: "note",
    icon: '<svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
  },
  {
    type: "tip",
    icon: '<svg class="octicon octicon-light-bulb mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>'
  },
  {
    type: "important",
    icon: '<svg class="octicon octicon-report mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>'
  },
  {
    type: "warning",
    icon: '<svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>'
  },
  {
    type: "caution",
    icon: '<svg class="octicon octicon-stop mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
  }
];
function To(t) {
  return t.length ? Object.values(
    [...Ct, ...t].reduce(
      (e, n) => (e[n.type] = n, e),
      {}
    )
  ) : Ct;
}
function Ft(t) {
  return `^(?:\\[!${t.toUpperCase()}])\\s*?
*`;
}
function Ro(t) {
  return t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase();
}
function $o(t = {}) {
  const { className: e = "markdown-alert", variants: n = [] } = t, o = To(n);
  return {
    walkTokens(a) {
      var r, i, s, l;
      if (a.type !== "blockquote") return;
      const d = o.find(
        ({ type: c }) => new RegExp(Ft(c)).test(a.text)
      );
      if (d) {
        const {
          type: c,
          icon: b,
          title: u = Ro(c),
          titleClassName: p = `${e}-title`
        } = d, m = new RegExp(Ft(c));
        Object.assign(a, {
          type: "alert",
          meta: {
            className: e,
            variant: c,
            icon: b,
            title: u,
            titleClassName: p
          }
        });
        const h = (r = a.tokens) == null ? void 0 : r[0];
        if ((i = h.raw) != null && i.replace(m, "").trim()) {
          const y = h.tokens[0];
          Object.assign(y, {
            raw: y.raw.replace(m, ""),
            text: y.text.replace(m, "")
          }), ((s = h.tokens[1]) == null ? void 0 : s.type) === "br" && h.tokens.splice(1, 1);
        } else
          (l = a.tokens) == null || l.shift();
      }
    },
    extensions: [
      {
        name: "alert",
        level: "block",
        renderer({ meta: a, tokens: r = [] }) {
          let i = `<div class="${a.className} ${a.className}-${a.variant}">
`;
          return i += `<p class="${a.titleClassName}">`, i += a.icon, i += a.title, i += `</p>
`, i += this.parser.parse(r), i += `</div>
`, i;
        }
      }
    ]
  };
}
/*!
  Highlight.js v11.11.1 (git: 08cb242e7d)
  (c) 2006-2024 Josh Goebel <hello@joshgoebel.com> and other contributors
  License: BSD-3-Clause
 */
function ln(t) {
  return t instanceof Map ? t.clear = t.delete = t.set = () => {
    throw Error("map is read-only");
  } : t instanceof Set && (t.add = t.clear = t.delete = () => {
    throw Error("set is read-only");
  }), Object.freeze(t), Object.getOwnPropertyNames(t).forEach((e) => {
    const n = t[e], o = typeof n;
    o !== "object" && o !== "function" || Object.isFrozen(n) || ln(n);
  }), t;
}
class At {
  constructor(e) {
    e.data === void 0 && (e.data = {}), this.data = e.data, this.isMatchIgnored = !1;
  }
  ignoreMatch() {
    this.isMatchIgnored = !0;
  }
}
function cn(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function oe(t, ...e) {
  const n = /* @__PURE__ */ Object.create(null);
  for (const o in t) n[o] = t[o];
  return e.forEach((o) => {
    for (const a in o) n[a] = o[a];
  }), n;
}
const Nt = (t) => !!t.scope;
class zo {
  constructor(e, n) {
    this.buffer = "", this.classPrefix = n.classPrefix, e.walk(this);
  }
  addText(e) {
    this.buffer += cn(e);
  }
  openNode(e) {
    if (!Nt(e)) return;
    const n = ((o, { prefix: a }) => {
      if (o.startsWith("language:")) return o.replace("language:", "language-");
      if (o.includes(".")) {
        const r = o.split(".");
        return [`${a}${r.shift()}`, ...r.map((i, s) => `${i}${"_".repeat(s + 1)}`)].join(" ");
      }
      return `${a}${o}`;
    })(e.scope, { prefix: this.classPrefix });
    this.span(n);
  }
  closeNode(e) {
    Nt(e) && (this.buffer += "</span>");
  }
  value() {
    return this.buffer;
  }
  span(e) {
    this.buffer += `<span class="${e}">`;
  }
}
const St = (t = {}) => {
  const e = { children: [] };
  return Object.assign(e, t), e;
};
class mt {
  constructor() {
    this.rootNode = St(), this.stack = [this.rootNode];
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  get root() {
    return this.rootNode;
  }
  add(e) {
    this.top.children.push(e);
  }
  openNode(e) {
    const n = St({ scope: e });
    this.add(n), this.stack.push(n);
  }
  closeNode() {
    if (this.stack.length > 1) return this.stack.pop();
  }
  closeAllNodes() {
    for (; this.closeNode(); ) ;
  }
  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  walk(e) {
    return this.constructor._walk(e, this.rootNode);
  }
  static _walk(e, n) {
    return typeof n == "string" ? e.addText(n) : n.children && (e.openNode(n), n.children.forEach((o) => this._walk(e, o)), e.closeNode(n)), e;
  }
  static _collapse(e) {
    typeof e != "string" && e.children && (e.children.every((n) => typeof n == "string") ? e.children = [e.children.join("")] : e.children.forEach((n) => {
      mt._collapse(n);
    }));
  }
}
class Io extends mt {
  constructor(e) {
    super(), this.options = e;
  }
  addText(e) {
    e !== "" && this.add(e);
  }
  startScope(e) {
    this.openNode(e);
  }
  endScope() {
    this.closeNode();
  }
  __addSublanguage(e, n) {
    const o = e.root;
    n && (o.scope = "language:" + n), this.add(o);
  }
  toHTML() {
    return new zo(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function ye(t) {
  return t ? typeof t == "string" ? t : t.source : null;
}
function se(t) {
  return E("(?=", t, ")");
}
function Lo(t) {
  return E("(?:", t, ")*");
}
function jo(t) {
  return E("(?:", t, ")?");
}
function E(...t) {
  return t.map((e) => ye(e)).join("");
}
function P(...t) {
  return "(" + (((n) => {
    const o = n[n.length - 1];
    return typeof o == "object" && o.constructor === Object ? (n.splice(n.length - 1, 1), o) : {};
  })(t).capture ? "" : "?:") + t.map((n) => ye(n)).join("|") + ")";
}
function dn(t) {
  return RegExp(t.toString() + "|").exec("").length - 1;
}
const Po = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function nt(t, { joinWith: e }) {
  let n = 0;
  return t.map((o) => {
    n += 1;
    const a = n;
    let r = ye(o), i = "";
    for (; r.length > 0; ) {
      const s = Po.exec(r);
      if (!s) {
        i += r;
        break;
      }
      i += r.substring(0, s.index), r = r.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? i += "\\" + (Number(s[1]) + a) : (i += s[0], s[0] === "(" && n++);
    }
    return i;
  }).map((o) => `(${o})`).join(e);
}
const Mt = "[a-zA-Z]\\w*", He = "[a-zA-Z_]\\w*", Bt = "\\b\\d+(\\.\\d+)?", Ot = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", Tt = "\\b(0b[01]+)", ke = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, Uo = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [ke]
}, qo = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [ke]
}, je = (t, e, n = {}) => {
  const o = oe({
    scope: "comment",
    begin: t,
    end: e,
    contains: []
  }, n);
  o.contains.push({
    scope: "doctag",
    begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
    end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
    excludeBegin: !0,
    relevance: 0
  });
  const a = P("I", "a", "is", "so", "us", "to", "at", "if", "in", "it", "on", /[A-Za-z]+['](d|ve|re|ll|t|s|n)/, /[A-Za-z]+[-][a-z]+/, /[A-Za-z][a-z]{2,}/);
  return o.contains.push({ begin: E(/[ ]+/, "(", a, /[.]?[:]?([.][ ]|[ ])/, "){3}") }), o;
}, Ho = je("//", "$"), Ko = je("/\\*", "\\*/"), Zo = je("#", "$");
var Ee = Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: Uo,
  BACKSLASH_ESCAPE: ke,
  BINARY_NUMBER_MODE: {
    scope: "number",
    begin: Tt,
    relevance: 0
  },
  BINARY_NUMBER_RE: Tt,
  COMMENT: je,
  C_BLOCK_COMMENT_MODE: Ko,
  C_LINE_COMMENT_MODE: Ho,
  C_NUMBER_MODE: {
    scope: "number",
    begin: Ot,
    relevance: 0
  },
  C_NUMBER_RE: Ot,
  END_SAME_AS_BEGIN: (t) => Object.assign(t, {
    "on:begin": (e, n) => {
      n.data._beginMatch = e[1];
    },
    "on:end": (e, n) => {
      n.data._beginMatch !== e[1] && n.ignoreMatch();
    }
  }),
  HASH_COMMENT_MODE: Zo,
  IDENT_RE: Mt,
  MATCH_NOTHING_RE: /\b\B/,
  METHOD_GUARD: { begin: "\\.\\s*" + He, relevance: 0 },
  NUMBER_MODE: { scope: "number", begin: Bt, relevance: 0 },
  NUMBER_RE: Bt,
  PHRASAL_WORDS_MODE: {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  },
  QUOTE_STRING_MODE: qo,
  REGEXP_MODE: {
    scope: "regexp",
    begin: /\/(?=[^/\n]*\/)/,
    end: /\/[gimuy]*/,
    contains: [ke, { begin: /\[/, end: /\]/, relevance: 0, contains: [ke] }]
  },
  RE_STARTERS_RE: "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
  SHEBANG: (t = {}) => {
    const e = /^#![ ]*\//;
    return t.binary && (t.begin = E(e, /.*\b/, t.binary, /\b.*/)), oe({
      scope: "meta",
      begin: e,
      end: /$/,
      relevance: 0,
      "on:begin": (n, o) => {
        n.index !== 0 && o.ignoreMatch();
      }
    }, t);
  },
  TITLE_MODE: { scope: "title", begin: Mt, relevance: 0 },
  UNDERSCORE_IDENT_RE: He,
  UNDERSCORE_TITLE_MODE: { scope: "title", begin: He, relevance: 0 }
});
function Go(t, e) {
  t.input[t.index - 1] === "." && e.ignoreMatch();
}
function Wo(t, e) {
  t.className !== void 0 && (t.scope = t.className, delete t.className);
}
function Qo(t, e) {
  e && t.beginKeywords && (t.begin = "\\b(" + t.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", t.__beforeBegin = Go, t.keywords = t.keywords || t.beginKeywords, delete t.beginKeywords, t.relevance === void 0 && (t.relevance = 0));
}
function Xo(t, e) {
  Array.isArray(t.illegal) && (t.illegal = P(...t.illegal));
}
function Vo(t, e) {
  if (t.match) {
    if (t.begin || t.end) throw Error("begin & end are not supported with match");
    t.begin = t.match, delete t.match;
  }
}
function Jo(t, e) {
  t.relevance === void 0 && (t.relevance = 1);
}
const Yo = (t, e) => {
  if (!t.beforeMatch) return;
  if (t.starts) throw Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, t);
  Object.keys(t).forEach((o) => {
    delete t[o];
  }), t.keywords = n.keywords, t.begin = E(n.beforeMatch, se(n.begin)), t.starts = {
    relevance: 0,
    contains: [Object.assign(n, { endsParent: !0 })]
  }, t.relevance = 0, delete n.beforeMatch;
}, er = ["of", "and", "for", "in", "not", "or", "if", "then", "parent", "list", "value"];
function un(t, e, n = "keyword") {
  const o = /* @__PURE__ */ Object.create(null);
  return typeof t == "string" ? a(n, t.split(" ")) : Array.isArray(t) ? a(n, t) : Object.keys(t).forEach((r) => {
    Object.assign(o, un(t[r], e, r));
  }), o;
  function a(r, i) {
    e && (i = i.map((s) => s.toLowerCase())), i.forEach((s) => {
      const l = s.split("|");
      o[l[0]] = [r, tr(l[0], l[1])];
    });
  }
}
function tr(t, e) {
  return e ? Number(e) : ((n) => er.includes(n.toLowerCase()))(t) ? 0 : 1;
}
const Rt = {}, le = (t) => {
  console.error(t);
}, $t = (t, ...e) => {
  console.log("WARN: " + t, ...e);
}, ue = (t, e) => {
  Rt[`${t}/${e}`] || (console.log(`Deprecated as of ${t}. ${e}`), Rt[`${t}/${e}`] = !0);
}, De = Error();
function zt(t, e, { key: n }) {
  let o = 0;
  const a = t[n], r = {}, i = {};
  for (let s = 1; s <= e.length; s++) i[s + o] = a[s], r[s + o] = !0, o += dn(e[s - 1]);
  t[n] = i, t[n]._emit = r, t[n]._multi = !0;
}
function nr(t) {
  ((e) => {
    e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
  })(t), typeof t.beginScope == "string" && (t.beginScope = {
    _wrap: t.beginScope
  }), typeof t.endScope == "string" && (t.endScope = {
    _wrap: t.endScope
  }), ((e) => {
    if (Array.isArray(e.begin)) {
      if (e.skip || e.excludeBegin || e.returnBegin) throw le("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), De;
      if (typeof e.beginScope != "object" || e.beginScope === null) throw le("beginScope must be object"), De;
      zt(e, e.begin, { key: "beginScope" }), e.begin = nt(e.begin, { joinWith: "" });
    }
  })(t), ((e) => {
    if (Array.isArray(e.end)) {
      if (e.skip || e.excludeEnd || e.returnEnd) throw le("skip, excludeEnd, returnEnd not compatible with endScope: {}"), De;
      if (typeof e.endScope != "object" || e.endScope === null) throw le("endScope must be object"), De;
      zt(e, e.end, { key: "endScope" }), e.end = nt(e.end, { joinWith: "" });
    }
  })(t);
}
function or(t) {
  function e(a, r) {
    return RegExp(ye(a), "m" + (t.case_insensitive ? "i" : "") + (t.unicodeRegex ? "u" : "") + (r ? "g" : ""));
  }
  class n {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    addRule(r, i) {
      i.position = this.position++, this.matchIndexes[this.matchAt] = i, this.regexes.push([i, r]), this.matchAt += dn(r) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const r = this.regexes.map((i) => i[1]);
      this.matcherRe = e(nt(r, {
        joinWith: "|"
      }), !0), this.lastIndex = 0;
    }
    exec(r) {
      this.matcherRe.lastIndex = this.lastIndex;
      const i = this.matcherRe.exec(r);
      if (!i) return null;
      const s = i.findIndex((d, c) => c > 0 && d !== void 0), l = this.matchIndexes[s];
      return i.splice(0, s), Object.assign(i, l);
    }
  }
  class o {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    getMatcher(r) {
      if (this.multiRegexes[r]) return this.multiRegexes[r];
      const i = new n();
      return this.rules.slice(r).forEach(([s, l]) => i.addRule(s, l)), i.compile(), this.multiRegexes[r] = i, i;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    addRule(r, i) {
      this.rules.push([r, i]), i.type === "begin" && this.count++;
    }
    exec(r) {
      const i = this.getMatcher(this.regexIndex);
      i.lastIndex = this.lastIndex;
      let s = i.exec(r);
      if (this.resumingScanAtSamePosition() && !(s && s.index === this.lastIndex)) {
        const l = this.getMatcher(0);
        l.lastIndex = this.lastIndex + 1, s = l.exec(r);
      }
      return s && (this.regexIndex += s.position + 1, this.regexIndex === this.count && this.considerAll()), s;
    }
  }
  if (t.compilerExtensions || (t.compilerExtensions = []), t.contains && t.contains.includes("self")) throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return t.classNameAliases = oe(t.classNameAliases || {}), function a(r, i) {
    const s = r;
    if (r.isCompiled) return s;
    [Wo, Vo, nr, Yo].forEach((d) => d(r, i)), t.compilerExtensions.forEach((d) => d(r, i)), r.__beforeBegin = null, [Qo, Xo, Jo].forEach((d) => d(r, i)), r.isCompiled = !0;
    let l = null;
    return typeof r.keywords == "object" && r.keywords.$pattern && (r.keywords = Object.assign({}, r.keywords), l = r.keywords.$pattern, delete r.keywords.$pattern), l = l || /\w+/, r.keywords && (r.keywords = un(r.keywords, t.case_insensitive)), s.keywordPatternRe = e(l, !0), i && (r.begin || (r.begin = /\B|\b/), s.beginRe = e(s.begin), r.end || r.endsWithParent || (r.end = /\B|\b/), r.end && (s.endRe = e(s.end)), s.terminatorEnd = ye(s.end) || "", r.endsWithParent && i.terminatorEnd && (s.terminatorEnd += (r.end ? "|" : "") + i.terminatorEnd)), r.illegal && (s.illegalRe = e(r.illegal)), r.contains || (r.contains = []), r.contains = [].concat(...r.contains.map((d) => ((c) => (c.variants && !c.cachedVariants && (c.cachedVariants = c.variants.map((b) => oe(c, {
      variants: null
    }, b))), c.cachedVariants ? c.cachedVariants : mn(c) ? oe(c, {
      starts: c.starts ? oe(c.starts) : null
    }) : Object.isFrozen(c) ? oe(c) : c))(d === "self" ? r : d))), r.contains.forEach((d) => {
      a(d, s);
    }), r.starts && a(r.starts, i), s.matcher = ((d) => {
      const c = new o();
      return d.contains.forEach((b) => c.addRule(b.begin, {
        rule: b,
        type: "begin"
      })), d.terminatorEnd && c.addRule(d.terminatorEnd, {
        type: "end"
      }), d.illegal && c.addRule(d.illegal, { type: "illegal" }), c;
    })(s), s;
  }(t);
}
function mn(t) {
  return !!t && (t.endsWithParent || mn(t.starts));
}
class rr extends Error {
  constructor(e, n) {
    super(e), this.name = "HTMLInjectionError", this.html = n;
  }
}
const Ke = cn, It = oe, Lt = Symbol("nomatch"), bn = (t) => {
  const e = /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null), o = [];
  let a = !0;
  const r = "Could not find the language '{}', did you forget to load/include a language module?", i = {
    disableAutodetect: !0,
    name: "Plain text",
    contains: []
  };
  let s = {
    ignoreUnescapedHTML: !1,
    throwUnescapedHTML: !1,
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    cssSelector: "pre code",
    languages: null,
    __emitter: Io
  };
  function l(g) {
    return s.noHighlightRe.test(g);
  }
  function d(g, k, _) {
    let M = "", C = "";
    typeof k == "object" ? (M = g, _ = k.ignoreIllegals, C = k.language) : (ue("10.7.0", "highlight(lang, code, ...args) has been deprecated."), ue("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), C = g, M = k), _ === void 0 && (_ = !0);
    const O = { code: M, language: C };
    B("before:highlight", O);
    const A = O.result ? O.result : c(O.language, O.code, _);
    return A.code = O.code, B("after:highlight", A), A;
  }
  function c(g, k, _, M) {
    const C = /* @__PURE__ */ Object.create(null);
    function O() {
      if (!x.keywords) return void v.addText(S);
      let f = 0;
      x.keywordPatternRe.lastIndex = 0;
      let w = x.keywordPatternRe.exec(S), z = "";
      for (; w; ) {
        z += S.substring(f, w.index);
        const I = H.case_insensitive ? w[0].toLowerCase() : w[0], U = (T = I, x.keywords[T]);
        if (U) {
          const [Y, qe] = U;
          if (v.addText(z), z = "", C[I] = (C[I] || 0) + 1, C[I] <= 7 && (Q += qe), Y.startsWith("_")) z += w[0];
          else {
            const xe = H.classNameAliases[Y] || Y;
            N(w[0], xe);
          }
        } else z += w[0];
        f = x.keywordPatternRe.lastIndex, w = x.keywordPatternRe.exec(S);
      }
      var T;
      z += S.substring(f), v.addText(z);
    }
    function A() {
      x.subLanguage != null ? (() => {
        if (S === "") return;
        let f = null;
        if (typeof x.subLanguage == "string") {
          if (!e[x.subLanguage]) return void v.addText(S);
          f = c(x.subLanguage, S, !0, _e[x.subLanguage]), _e[x.subLanguage] = f._top;
        } else f = b(S, x.subLanguage.length ? x.subLanguage : null);
        x.relevance > 0 && (Q += f.relevance), v.__addSublanguage(f._emitter, f.language);
      })() : O(), S = "";
    }
    function N(f, w) {
      f !== "" && (v.startScope(w), v.addText(f), v.endScope());
    }
    function F(f, w) {
      let z = 1;
      const T = w.length - 1;
      for (; z <= T; ) {
        if (!f._emit[z]) {
          z++;
          continue;
        }
        const I = H.classNameAliases[f[z]] || f[z], U = w[z];
        I ? N(U, I) : (S = U, O(), S = ""), z++;
      }
    }
    function L(f, w) {
      return f.scope && typeof f.scope == "string" && v.openNode(H.classNameAliases[f.scope] || f.scope), f.beginScope && (f.beginScope._wrap ? (N(S, H.classNameAliases[f.beginScope._wrap] || f.beginScope._wrap), S = "") : f.beginScope._multi && (F(f.beginScope, w), S = "")), x = Object.create(f, { parent: {
        value: x
      } }), x;
    }
    function K(f, w, z) {
      let T = ((I, U) => {
        const Y = I && I.exec(U);
        return Y && Y.index === 0;
      })(f.endRe, z);
      if (T) {
        if (f["on:end"]) {
          const I = new At(f);
          f["on:end"](w, I), I.isMatchIgnored && (T = !1);
        }
        if (T) {
          for (; f.endsParent && f.parent; ) f = f.parent;
          return f;
        }
      }
      if (f.endsWithParent) return K(f.parent, w, z);
    }
    function re(f) {
      return x.matcher.regexIndex === 0 ? (S += f[0], 1) : (Ue = !0, 0);
    }
    function ee(f) {
      const w = f[0], z = k.substring(f.index), T = K(x, f, z);
      if (!T) return Lt;
      const I = x;
      x.endScope && x.endScope._wrap ? (A(), N(w, x.endScope._wrap)) : x.endScope && x.endScope._multi ? (A(), F(x.endScope, f)) : I.skip ? S += w : (I.returnEnd || I.excludeEnd || (S += w), A(), I.excludeEnd && (S = w));
      do
        x.scope && v.closeNode(), x.skip || x.subLanguage || (Q += x.relevance), x = x.parent;
      while (x !== T.parent);
      return T.starts && L(T.starts, f), I.returnEnd ? 0 : w.length;
    }
    let Z = {};
    function te(f, w) {
      const z = w && w[0];
      if (S += f, z == null) return A(), 0;
      if (Z.type === "begin" && w.type === "end" && Z.index === w.index && z === "") {
        if (S += k.slice(w.index, w.index + 1), !a) {
          const T = Error(`0 width match regex (${g})`);
          throw T.languageName = g, T.badRule = Z.rule, T;
        }
        return 1;
      }
      if (Z = w, w.type === "begin") return ((T) => {
        const I = T[0], U = T.rule, Y = new At(U), qe = [U.__beforeBegin, U["on:begin"]];
        for (const xe of qe) if (xe && (xe(T, Y), Y.isMatchIgnored)) return re(I);
        return U.skip ? S += I : (U.excludeBegin && (S += I), A(), U.returnBegin || U.excludeBegin || (S = I)), L(U, T), U.returnBegin ? 0 : I.length;
      })(w);
      if (w.type === "illegal" && !_) {
        const T = Error('Illegal lexeme "' + z + '" for mode "' + (x.scope || "<unnamed>") + '"');
        throw T.mode = x, T;
      }
      if (w.type === "end") {
        const T = ee(w);
        if (T !== Lt) return T;
      }
      if (w.type === "illegal" && z === "") return S += `
`, 1;
      if (Pe > 1e5 && Pe > 3 * w.index) throw Error("potential infinite loop, way more iterations than matches");
      return S += z, z.length;
    }
    const H = h(g);
    if (!H) throw le(r.replace("{}", g)), Error('Unknown language: "' + g + '"');
    const pe = or(H);
    let ae = "", x = M || pe;
    const _e = {}, v = new s.__emitter(s);
    (() => {
      const f = [];
      for (let w = x; w !== H; w = w.parent) w.scope && f.unshift(w.scope);
      f.forEach((w) => v.openNode(w));
    })();
    let S = "", Q = 0, J = 0, Pe = 0, Ue = !1;
    try {
      if (H.__emitTokens) H.__emitTokens(k, v);
      else {
        for (x.matcher.considerAll(); ; ) {
          Pe++, Ue ? Ue = !1 : x.matcher.considerAll(), x.matcher.lastIndex = J;
          const f = x.matcher.exec(k);
          if (!f) break;
          const w = te(k.substring(J, f.index), f);
          J = f.index + w;
        }
        te(k.substring(J));
      }
      return v.finalize(), ae = v.toHTML(), {
        language: g,
        value: ae,
        relevance: Q,
        illegal: !1,
        _emitter: v,
        _top: x
      };
    } catch (f) {
      if (f.message && f.message.includes("Illegal")) return {
        language: g,
        value: Ke(k),
        illegal: !0,
        relevance: 0,
        _illegalBy: {
          message: f.message,
          index: J,
          context: k.slice(J - 100, J + 100),
          mode: f.mode,
          resultSoFar: ae
        },
        _emitter: v
      };
      if (a) return {
        language: g,
        value: Ke(k),
        illegal: !1,
        relevance: 0,
        errorRaised: f,
        _emitter: v,
        _top: x
      };
      throw f;
    }
  }
  function b(g, k) {
    k = k || s.languages || Object.keys(e);
    const _ = ((F) => {
      const L = { value: Ke(F), illegal: !1, relevance: 0, _top: i, _emitter: new s.__emitter(s) };
      return L._emitter.addText(F), L;
    })(g), M = k.filter(h).filter(j).map((F) => c(F, g, !1));
    M.unshift(_);
    const C = M.sort((F, L) => {
      if (F.relevance !== L.relevance) return L.relevance - F.relevance;
      if (F.language && L.language) {
        if (h(F.language).supersetOf === L.language) return 1;
        if (h(L.language).supersetOf === F.language) return -1;
      }
      return 0;
    }), [O, A] = C, N = O;
    return N.secondBest = A, N;
  }
  function u(g) {
    let k = null;
    const _ = ((O) => {
      let A = O.className + " ";
      A += O.parentNode ? O.parentNode.className : "";
      const N = s.languageDetectRe.exec(A);
      if (N) {
        const F = h(N[1]);
        return F || ($t(r.replace("{}", N[1])), $t("Falling back to no-highlight mode for this block.", O)), F ? N[1] : "no-highlight";
      }
      return A.split(/\s+/).find((F) => l(F) || h(F));
    })(g);
    if (l(_)) return;
    if (B("before:highlightElement", {
      el: g,
      language: _
    }), g.dataset.highlighted) return void console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", g);
    if (g.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(g)), s.throwUnescapedHTML)) throw new rr("One of your code blocks includes unescaped HTML.", g.innerHTML);
    k = g;
    const M = k.textContent, C = _ ? d(M, { language: _, ignoreIllegals: !0 }) : b(M);
    g.innerHTML = C.value, g.dataset.highlighted = "yes", ((O, A, N) => {
      const F = A && n[A] || N;
      O.classList.add("hljs"), O.classList.add("language-" + F);
    })(g, _, C.language), g.result = {
      language: C.language,
      re: C.relevance,
      relevance: C.relevance
    }, C.secondBest && (g.secondBest = {
      language: C.secondBest.language,
      relevance: C.secondBest.relevance
    }), B("after:highlightElement", { el: g, result: C, text: M });
  }
  let p = !1;
  function m() {
    if (document.readyState === "loading") return p || window.addEventListener("DOMContentLoaded", () => {
      m();
    }, !1), void (p = !0);
    document.querySelectorAll(s.cssSelector).forEach(u);
  }
  function h(g) {
    return g = (g || "").toLowerCase(), e[g] || e[n[g]];
  }
  function y(g, { languageName: k }) {
    typeof g == "string" && (g = [g]), g.forEach((_) => {
      n[_.toLowerCase()] = k;
    });
  }
  function j(g) {
    const k = h(g);
    return k && !k.disableAutodetect;
  }
  function B(g, k) {
    const _ = g;
    o.forEach((M) => {
      M[_] && M[_](k);
    });
  }
  Object.assign(t, {
    highlight: d,
    highlightAuto: b,
    highlightAll: m,
    highlightElement: u,
    highlightBlock: (g) => (ue("10.7.0", "highlightBlock will be removed entirely in v12.0"), ue("10.7.0", "Please use highlightElement now."), u(g)),
    configure: (g) => {
      s = It(s, g);
    },
    initHighlighting: () => {
      m(), ue("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
    },
    initHighlightingOnLoad: () => {
      m(), ue("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
    },
    registerLanguage: (g, k) => {
      let _ = null;
      try {
        _ = k(t);
      } catch (M) {
        if (le("Language definition for '{}' could not be registered.".replace("{}", g)), !a) throw M;
        le(M), _ = i;
      }
      _.name || (_.name = g), e[g] = _, _.rawDefinition = k.bind(null, t), _.aliases && y(_.aliases, {
        languageName: g
      });
    },
    unregisterLanguage: (g) => {
      delete e[g];
      for (const k of Object.keys(n)) n[k] === g && delete n[k];
    },
    listLanguages: () => Object.keys(e),
    getLanguage: h,
    registerAliases: y,
    autoDetection: j,
    inherit: It,
    addPlugin: (g) => {
      ((k) => {
        k["before:highlightBlock"] && !k["before:highlightElement"] && (k["before:highlightElement"] = (_) => {
          k["before:highlightBlock"](Object.assign({ block: _.el }, _));
        }), k["after:highlightBlock"] && !k["after:highlightElement"] && (k["after:highlightElement"] = (_) => {
          k["after:highlightBlock"](Object.assign({ block: _.el }, _));
        });
      })(g), o.push(g);
    },
    removePlugin: (g) => {
      const k = o.indexOf(g);
      k !== -1 && o.splice(k, 1);
    }
  }), t.debugMode = () => {
    a = !1;
  }, t.safeMode = () => {
    a = !0;
  }, t.versionString = "11.11.1", t.regex = {
    concat: E,
    lookahead: se,
    either: P,
    optional: jo,
    anyNumberOfTimes: Lo
  };
  for (const g in Ee) typeof Ee[g] == "object" && ln(Ee[g]);
  return Object.assign(t, Ee), t;
}, pn = bn({});
pn.newInstance = () => bn({});
const Ze = (t) => ({
  IMPORTANT: {
    scope: "meta",
    begin: "!important"
  },
  BLOCK_COMMENT: t.C_BLOCK_COMMENT_MODE,
  HEXCOLOR: {
    scope: "number",
    begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
  },
  FUNCTION_DISPATCH: { className: "built_in", begin: /[\w-]+(?=\()/ },
  ATTRIBUTE_SELECTOR_MODE: {
    scope: "selector-attr",
    begin: /\[/,
    end: /\]/,
    illegal: "$",
    contains: [t.APOS_STRING_MODE, t.QUOTE_STRING_MODE]
  },
  CSS_NUMBER_MODE: {
    scope: "number",
    begin: t.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
    relevance: 0
  },
  CSS_VARIABLE: { className: "attr", begin: /--[A-Za-z_][A-Za-z0-9_-]*/ }
}), Ge = ["a", "abbr", "address", "article", "aside", "audio", "b", "blockquote", "body", "button", "canvas", "caption", "cite", "code", "dd", "del", "details", "dfn", "div", "dl", "dt", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "mark", "menu", "nav", "object", "ol", "optgroup", "option", "p", "picture", "q", "quote", "samp", "section", "select", "source", "span", "strong", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "tr", "ul", "var", "video", "defs", "g", "marker", "mask", "pattern", "svg", "switch", "symbol", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feFlood", "feGaussianBlur", "feImage", "feMerge", "feMorphology", "feOffset", "feSpecularLighting", "feTile", "feTurbulence", "linearGradient", "radialGradient", "stop", "circle", "ellipse", "image", "line", "path", "polygon", "polyline", "rect", "text", "use", "textPath", "tspan", "foreignObject", "clipPath"], We = ["any-hover", "any-pointer", "aspect-ratio", "color", "color-gamut", "color-index", "device-aspect-ratio", "device-height", "device-width", "display-mode", "forced-colors", "grid", "height", "hover", "inverted-colors", "monochrome", "orientation", "overflow-block", "overflow-inline", "pointer", "prefers-color-scheme", "prefers-contrast", "prefers-reduced-motion", "prefers-reduced-transparency", "resolution", "scan", "scripting", "update", "width", "min-width", "max-width", "min-height", "max-height"].sort().reverse(), Se = ["active", "any-link", "blank", "checked", "current", "default", "defined", "dir", "disabled", "drop", "empty", "enabled", "first", "first-child", "first-of-type", "fullscreen", "future", "focus", "focus-visible", "focus-within", "has", "host", "host-context", "hover", "indeterminate", "in-range", "invalid", "is", "lang", "last-child", "last-of-type", "left", "link", "local-link", "not", "nth-child", "nth-col", "nth-last-child", "nth-last-col", "nth-last-of-type", "nth-of-type", "only-child", "only-of-type", "optional", "out-of-range", "past", "placeholder-shown", "read-only", "read-write", "required", "right", "root", "scope", "target", "target-within", "user-invalid", "valid", "visited", "where"].sort().reverse(), Me = ["after", "backdrop", "before", "cue", "cue-region", "first-letter", "first-line", "grammar-error", "marker", "part", "placeholder", "selection", "slotted", "spelling-error"].sort().reverse(), Qe = ["accent-color", "align-content", "align-items", "align-self", "alignment-baseline", "all", "anchor-name", "animation", "animation-composition", "animation-delay", "animation-direction", "animation-duration", "animation-fill-mode", "animation-iteration-count", "animation-name", "animation-play-state", "animation-range", "animation-range-end", "animation-range-start", "animation-timeline", "animation-timing-function", "appearance", "aspect-ratio", "backdrop-filter", "backface-visibility", "background", "background-attachment", "background-blend-mode", "background-clip", "background-color", "background-image", "background-origin", "background-position", "background-position-x", "background-position-y", "background-repeat", "background-size", "baseline-shift", "block-size", "border", "border-block", "border-block-color", "border-block-end", "border-block-end-color", "border-block-end-style", "border-block-end-width", "border-block-start", "border-block-start-color", "border-block-start-style", "border-block-start-width", "border-block-style", "border-block-width", "border-bottom", "border-bottom-color", "border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-collapse", "border-color", "border-end-end-radius", "border-end-start-radius", "border-image", "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source", "border-image-width", "border-inline", "border-inline-color", "border-inline-end", "border-inline-end-color", "border-inline-end-style", "border-inline-end-width", "border-inline-start", "border-inline-start-color", "border-inline-start-style", "border-inline-start-width", "border-inline-style", "border-inline-width", "border-left", "border-left-color", "border-left-style", "border-left-width", "border-radius", "border-right", "border-right-color", "border-right-style", "border-right-width", "border-spacing", "border-start-end-radius", "border-start-start-radius", "border-style", "border-top", "border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-width", "bottom", "box-align", "box-decoration-break", "box-direction", "box-flex", "box-flex-group", "box-lines", "box-ordinal-group", "box-orient", "box-pack", "box-shadow", "box-sizing", "break-after", "break-before", "break-inside", "caption-side", "caret-color", "clear", "clip", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "color-scheme", "column-count", "column-fill", "column-gap", "column-rule", "column-rule-color", "column-rule-style", "column-rule-width", "column-span", "column-width", "columns", "contain", "contain-intrinsic-block-size", "contain-intrinsic-height", "contain-intrinsic-inline-size", "contain-intrinsic-size", "contain-intrinsic-width", "container", "container-name", "container-type", "content", "content-visibility", "counter-increment", "counter-reset", "counter-set", "cue", "cue-after", "cue-before", "cursor", "cx", "cy", "direction", "display", "dominant-baseline", "empty-cells", "enable-background", "field-sizing", "fill", "fill-opacity", "fill-rule", "filter", "flex", "flex-basis", "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap", "float", "flood-color", "flood-opacity", "flow", "font", "font-display", "font-family", "font-feature-settings", "font-kerning", "font-language-override", "font-optical-sizing", "font-palette", "font-size", "font-size-adjust", "font-smooth", "font-smoothing", "font-stretch", "font-style", "font-synthesis", "font-synthesis-position", "font-synthesis-small-caps", "font-synthesis-style", "font-synthesis-weight", "font-variant", "font-variant-alternates", "font-variant-caps", "font-variant-east-asian", "font-variant-emoji", "font-variant-ligatures", "font-variant-numeric", "font-variant-position", "font-variation-settings", "font-weight", "forced-color-adjust", "gap", "glyph-orientation-horizontal", "glyph-orientation-vertical", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow", "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-start", "grid-gap", "grid-row", "grid-row-end", "grid-row-start", "grid-template", "grid-template-areas", "grid-template-columns", "grid-template-rows", "hanging-punctuation", "height", "hyphenate-character", "hyphenate-limit-chars", "hyphens", "icon", "image-orientation", "image-rendering", "image-resolution", "ime-mode", "initial-letter", "initial-letter-align", "inline-size", "inset", "inset-area", "inset-block", "inset-block-end", "inset-block-start", "inset-inline", "inset-inline-end", "inset-inline-start", "isolation", "justify-content", "justify-items", "justify-self", "kerning", "left", "letter-spacing", "lighting-color", "line-break", "line-height", "line-height-step", "list-style", "list-style-image", "list-style-position", "list-style-type", "margin", "margin-block", "margin-block-end", "margin-block-start", "margin-bottom", "margin-inline", "margin-inline-end", "margin-inline-start", "margin-left", "margin-right", "margin-top", "margin-trim", "marker", "marker-end", "marker-mid", "marker-start", "marks", "mask", "mask-border", "mask-border-mode", "mask-border-outset", "mask-border-repeat", "mask-border-slice", "mask-border-source", "mask-border-width", "mask-clip", "mask-composite", "mask-image", "mask-mode", "mask-origin", "mask-position", "mask-repeat", "mask-size", "mask-type", "masonry-auto-flow", "math-depth", "math-shift", "math-style", "max-block-size", "max-height", "max-inline-size", "max-width", "min-block-size", "min-height", "min-inline-size", "min-width", "mix-blend-mode", "nav-down", "nav-index", "nav-left", "nav-right", "nav-up", "none", "normal", "object-fit", "object-position", "offset", "offset-anchor", "offset-distance", "offset-path", "offset-position", "offset-rotate", "opacity", "order", "orphans", "outline", "outline-color", "outline-offset", "outline-style", "outline-width", "overflow", "overflow-anchor", "overflow-block", "overflow-clip-margin", "overflow-inline", "overflow-wrap", "overflow-x", "overflow-y", "overlay", "overscroll-behavior", "overscroll-behavior-block", "overscroll-behavior-inline", "overscroll-behavior-x", "overscroll-behavior-y", "padding", "padding-block", "padding-block-end", "padding-block-start", "padding-bottom", "padding-inline", "padding-inline-end", "padding-inline-start", "padding-left", "padding-right", "padding-top", "page", "page-break-after", "page-break-before", "page-break-inside", "paint-order", "pause", "pause-after", "pause-before", "perspective", "perspective-origin", "place-content", "place-items", "place-self", "pointer-events", "position", "position-anchor", "position-visibility", "print-color-adjust", "quotes", "r", "resize", "rest", "rest-after", "rest-before", "right", "rotate", "row-gap", "ruby-align", "ruby-position", "scale", "scroll-behavior", "scroll-margin", "scroll-margin-block", "scroll-margin-block-end", "scroll-margin-block-start", "scroll-margin-bottom", "scroll-margin-inline", "scroll-margin-inline-end", "scroll-margin-inline-start", "scroll-margin-left", "scroll-margin-right", "scroll-margin-top", "scroll-padding", "scroll-padding-block", "scroll-padding-block-end", "scroll-padding-block-start", "scroll-padding-bottom", "scroll-padding-inline", "scroll-padding-inline-end", "scroll-padding-inline-start", "scroll-padding-left", "scroll-padding-right", "scroll-padding-top", "scroll-snap-align", "scroll-snap-stop", "scroll-snap-type", "scroll-timeline", "scroll-timeline-axis", "scroll-timeline-name", "scrollbar-color", "scrollbar-gutter", "scrollbar-width", "shape-image-threshold", "shape-margin", "shape-outside", "shape-rendering", "speak", "speak-as", "src", "stop-color", "stop-opacity", "stroke", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "table-layout", "text-align", "text-align-all", "text-align-last", "text-anchor", "text-combine-upright", "text-decoration", "text-decoration-color", "text-decoration-line", "text-decoration-skip", "text-decoration-skip-ink", "text-decoration-style", "text-decoration-thickness", "text-emphasis", "text-emphasis-color", "text-emphasis-position", "text-emphasis-style", "text-indent", "text-justify", "text-orientation", "text-overflow", "text-rendering", "text-shadow", "text-size-adjust", "text-transform", "text-underline-offset", "text-underline-position", "text-wrap", "text-wrap-mode", "text-wrap-style", "timeline-scope", "top", "touch-action", "transform", "transform-box", "transform-origin", "transform-style", "transition", "transition-behavior", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "translate", "unicode-bidi", "user-modify", "user-select", "vector-effect", "vertical-align", "view-timeline", "view-timeline-axis", "view-timeline-inset", "view-timeline-name", "view-transition-name", "visibility", "voice-balance", "voice-duration", "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress", "voice-volume", "white-space", "white-space-collapse", "widows", "width", "will-change", "word-break", "word-spacing", "word-wrap", "writing-mode", "x", "y", "z-index", "zoom"].sort().reverse(), ar = Se.concat(Me).sort().reverse();
var me = "[0-9](_*[0-9])*", Ce = `\\.(${me})`, Fe = "[0-9a-fA-F](_*[0-9a-fA-F])*", Xe = {
  className: "number",
  variants: [{
    begin: `(\\b(${me})((${Ce})|\\.)?|(${Ce}))[eE][+-]?(${me})[fFdD]?\\b`
  }, {
    begin: `\\b(${me})((${Ce})[fFdD]?\\b|\\.([fFdD]\\b)?)`
  }, {
    begin: `(${Ce})[fFdD]?\\b`
  }, { begin: `\\b(${me})[fFdD]\\b` }, {
    begin: `\\b0[xX]((${Fe})\\.?|(${Fe})?\\.(${Fe}))[pP][+-]?(${me})[fFdD]?\\b`
  }, {
    begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b"
  }, { begin: `\\b0[xX](${Fe})[lL]?\\b` }, {
    begin: "\\b0(_*[0-7])*[lL]?\\b"
  }, { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }],
  relevance: 0
};
function gn(t, e, n) {
  return n === -1 ? "" : t.replace(e, (o) => gn(t, e, n - 1));
}
const $e = "[A-Za-z$_][0-9A-Za-z$_]*", hn = ["as", "in", "of", "if", "for", "while", "finally", "var", "new", "function", "do", "return", "void", "else", "break", "catch", "instanceof", "with", "throw", "case", "default", "try", "switch", "continue", "typeof", "delete", "let", "yield", "const", "class", "debugger", "async", "await", "static", "import", "from", "export", "extends", "using"], fn = ["true", "false", "null", "undefined", "NaN", "Infinity"], kn = ["Object", "Function", "Boolean", "Symbol", "Math", "Date", "Number", "BigInt", "String", "RegExp", "Array", "Float32Array", "Float64Array", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Int32Array", "Uint16Array", "Uint32Array", "BigInt64Array", "BigUint64Array", "Set", "Map", "WeakSet", "WeakMap", "ArrayBuffer", "SharedArrayBuffer", "Atomics", "DataView", "JSON", "Promise", "Generator", "GeneratorFunction", "AsyncFunction", "Reflect", "Proxy", "Intl", "WebAssembly"], yn = ["Error", "EvalError", "InternalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"], wn = ["setInterval", "setTimeout", "clearInterval", "clearTimeout", "require", "exports", "eval", "isFinite", "isNaN", "parseFloat", "parseInt", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "unescape"], _n = ["arguments", "this", "super", "console", "window", "document", "localStorage", "sessionStorage", "module", "global"], xn = [].concat(wn, kn, yn);
function jt(t) {
  const e = t.regex, n = $e, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    isTrulyOpeningTag: (L, K) => {
      const re = L[0].length + L.index, ee = L.input[re];
      if (ee === "<" || ee === ",") return void K.ignoreMatch();
      let Z;
      ee === ">" && (((H, { after: pe }) => {
        const ae = "</" + H[0].slice(1);
        return H.input.indexOf(ae, pe) !== -1;
      })(L, { after: re }) || K.ignoreMatch());
      const te = L.input.substring(re);
      ((Z = te.match(/^\s*=/)) || (Z = te.match(/^\s+extends\s+/)) && Z.index === 0) && K.ignoreMatch();
    }
  }, a = {
    $pattern: $e,
    keyword: hn,
    literal: fn,
    built_in: xn,
    "variable.language": _n
  }, r = "[0-9](_?[0-9])*", i = `\\.(${r})`, s = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", l = {
    className: "number",
    variants: [{
      begin: `(\\b(${s})((${i})|\\.)?|(${i}))[eE][+-]?(${r})\\b`
    }, {
      begin: `\\b(${s})\\b((${i})\\b|\\.)?|(${i})\\b`
    }, {
      begin: "\\b(0|[1-9](_?[0-9])*)n\\b"
    }, {
      begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"
    }, {
      begin: "\\b0[bB][0-1](_?[0-1])*n?\\b"
    }, { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" }, {
      begin: "\\b0[0-7]+n?\\b"
    }],
    relevance: 0
  }, d = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: a,
    contains: []
  }, c = { begin: ".?html`", end: "", starts: {
    end: "`",
    returnEnd: !1,
    contains: [t.BACKSLASH_ESCAPE, d],
    subLanguage: "xml"
  } }, b = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [t.BACKSLASH_ESCAPE, d],
      subLanguage: "css"
    }
  }, u = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [t.BACKSLASH_ESCAPE, d],
      subLanguage: "graphql"
    }
  }, p = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [t.BACKSLASH_ESCAPE, d]
  }, m = {
    className: "comment",
    variants: [t.COMMENT(/\/\*\*(?!\/)/, "\\*/", {
      relevance: 0,
      contains: [{
        begin: "(?=@[A-Za-z]+)",
        relevance: 0,
        contains: [{
          className: "doctag",
          begin: "@[A-Za-z]+"
        }, {
          className: "type",
          begin: "\\{",
          end: "\\}",
          excludeEnd: !0,
          excludeBegin: !0,
          relevance: 0
        }, {
          className: "variable",
          begin: n + "(?=\\s*(-)|$)",
          endsParent: !0,
          relevance: 0
        }, { begin: /(?=[^\n])\s/, relevance: 0 }]
      }]
    }), t.C_BLOCK_COMMENT_MODE, t.C_LINE_COMMENT_MODE]
  }, h = [t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, c, b, u, p, { match: /\$\d+/ }, l];
  d.contains = h.concat({
    begin: /\{/,
    end: /\}/,
    keywords: a,
    contains: ["self"].concat(h)
  });
  const y = [].concat(m, d.contains), j = y.concat([{
    begin: /(\s*)\(/,
    end: /\)/,
    keywords: a,
    contains: ["self"].concat(y)
  }]), B = {
    className: "params",
    begin: /(\s*)\(/,
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: a,
    contains: j
  }, g = { variants: [{
    match: [/class/, /\s+/, n, /\s+/, /extends/, /\s+/, e.concat(n, "(", e.concat(/\./, n), ")*")],
    scope: { 1: "keyword", 3: "title.class", 5: "keyword", 7: "title.class.inherited" }
  }, {
    match: [/class/, /\s+/, n],
    scope: { 1: "keyword", 3: "title.class" }
  }] }, k = {
    relevance: 0,
    match: e.either(/\bJSON/, /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/, /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/, /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
    className: "title.class",
    keywords: { _: [...kn, ...yn] }
  }, _ = {
    variants: [{
      match: [/function/, /\s+/, n, /(?=\s*\()/]
    }, { match: [/function/, /\s*(?=\()/] }],
    className: { 1: "keyword", 3: "title.function" },
    label: "func.def",
    contains: [B],
    illegal: /%/
  }, M = {
    match: e.concat(/\b/, (C = [...wn, "super", "import"].map((L) => L + "\\s*\\("), e.concat("(?!", C.join("|"), ")")), n, e.lookahead(/\s*\(/)),
    className: "title.function",
    relevance: 0
  };
  var C;
  const O = {
    begin: e.concat(/\./, e.lookahead(e.concat(n, /(?![0-9A-Za-z$_(])/))),
    end: n,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, A = {
    match: [/get|set/, /\s+/, n, /(?=\()/],
    className: { 1: "keyword", 3: "title.function" },
    contains: [{ begin: /\(\)/ }, B]
  }, N = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + t.UNDERSCORE_IDENT_RE + ")\\s*=>", F = {
    match: [/const|var|let/, /\s+/, n, /\s*/, /=\s*/, /(async\s*)?/, e.lookahead(N)],
    keywords: "async",
    className: { 1: "keyword", 3: "title.function" },
    contains: [B]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: a,
    exports: {
      PARAMS_CONTAINS: j,
      CLASS_REFERENCE: k
    },
    illegal: /#(?![$_A-z])/,
    contains: [t.SHEBANG({ label: "shebang", binary: "node", relevance: 5 }), {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    }, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, c, b, u, p, m, { match: /\$\d+/ }, l, k, {
      scope: "attr",
      match: n + e.lookahead(":"),
      relevance: 0
    }, F, {
      begin: "(" + t.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
      keywords: "return throw case",
      relevance: 0,
      contains: [m, t.REGEXP_MODE, {
        className: "function",
        begin: N,
        returnBegin: !0,
        end: "\\s*=>",
        contains: [{
          className: "params",
          variants: [{ begin: t.UNDERSCORE_IDENT_RE, relevance: 0 }, {
            className: null,
            begin: /\(\s*\)/,
            skip: !0
          }, {
            begin: /(\s*)\(/,
            end: /\)/,
            excludeBegin: !0,
            excludeEnd: !0,
            keywords: a,
            contains: j
          }]
        }]
      }, {
        begin: /,/,
        relevance: 0
      }, { match: /\s+/, relevance: 0 }, { variants: [{ begin: "<>", end: "</>" }, {
        match: /<[A-Za-z0-9\\._:-]+\s*\/>/
      }, {
        begin: o.begin,
        "on:begin": o.isTrulyOpeningTag,
        end: o.end
      }], subLanguage: "xml", contains: [{
        begin: o.begin,
        end: o.end,
        skip: !0,
        contains: ["self"]
      }] }]
    }, _, {
      beginKeywords: "while if switch catch for"
    }, {
      begin: "\\b(?!function)" + t.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
      returnBegin: !0,
      label: "func.def",
      contains: [B, t.inherit(t.TITLE_MODE, {
        begin: n,
        className: "title.function"
      })]
    }, { match: /\.\.\./, relevance: 0 }, O, {
      match: "\\$" + n,
      relevance: 0
    }, {
      match: [/\bconstructor(?=\s*\()/],
      className: { 1: "title.function" },
      contains: [B]
    }, M, {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    }, g, A, { match: /\$[(.]/ }]
  };
}
const bt = (t) => E(/\b/, t, /\w$/.test(t) ? /\b/ : /\B/), ir = ["Protocol", "Type"].map(bt), Pt = ["init", "self"].map(bt), sr = ["Any", "Self"], Ve = ["actor", "any", "associatedtype", "async", "await", /as\?/, /as!/, "as", "borrowing", "break", "case", "catch", "class", "consume", "consuming", "continue", "convenience", "copy", "default", "defer", "deinit", "didSet", "distributed", "do", "dynamic", "each", "else", "enum", "extension", "fallthrough", /fileprivate\(set\)/, "fileprivate", "final", "for", "func", "get", "guard", "if", "import", "indirect", "infix", /init\?/, /init!/, "inout", /internal\(set\)/, "internal", "in", "is", "isolated", "nonisolated", "lazy", "let", "macro", "mutating", "nonmutating", /open\(set\)/, "open", "operator", "optional", "override", "package", "postfix", "precedencegroup", "prefix", /private\(set\)/, "private", "protocol", /public\(set\)/, "public", "repeat", "required", "rethrows", "return", "set", "some", "static", "struct", "subscript", "super", "switch", "throws", "throw", /try\?/, /try!/, "try", "typealias", /unowned\(safe\)/, /unowned\(unsafe\)/, "unowned", "var", "weak", "where", "while", "willSet"], Ut = ["false", "nil", "true"], lr = ["assignment", "associativity", "higherThan", "left", "lowerThan", "none", "right"], cr = ["#colorLiteral", "#column", "#dsohandle", "#else", "#elseif", "#endif", "#error", "#file", "#fileID", "#fileLiteral", "#filePath", "#function", "#if", "#imageLiteral", "#keyPath", "#line", "#selector", "#sourceLocation", "#warning"], qt = ["abs", "all", "any", "assert", "assertionFailure", "debugPrint", "dump", "fatalError", "getVaList", "isKnownUniquelyReferenced", "max", "min", "numericCast", "pointwiseMax", "pointwiseMin", "precondition", "preconditionFailure", "print", "readLine", "repeatElement", "sequence", "stride", "swap", "swift_unboxFromSwiftValueWithType", "transcode", "type", "unsafeBitCast", "unsafeDowncast", "withExtendedLifetime", "withUnsafeMutablePointer", "withUnsafePointer", "withVaList", "withoutActuallyEscaping", "zip"], vn = P(/[/=\-+!*%<>&|^~?]/, /[\u00A1-\u00A7]/, /[\u00A9\u00AB]/, /[\u00AC\u00AE]/, /[\u00B0\u00B1]/, /[\u00B6\u00BB\u00BF\u00D7\u00F7]/, /[\u2016-\u2017]/, /[\u2020-\u2027]/, /[\u2030-\u203E]/, /[\u2041-\u2053]/, /[\u2055-\u205E]/, /[\u2190-\u23FF]/, /[\u2500-\u2775]/, /[\u2794-\u2BFF]/, /[\u2E00-\u2E7F]/, /[\u3001-\u3003]/, /[\u3008-\u3020]/, /[\u3030]/), En = P(vn, /[\u0300-\u036F]/, /[\u1DC0-\u1DFF]/, /[\u20D0-\u20FF]/, /[\uFE00-\uFE0F]/, /[\uFE20-\uFE2F]/), Je = E(vn, En, "*"), Dn = P(/[a-zA-Z_]/, /[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/, /[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/, /[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/, /[\u1E00-\u1FFF]/, /[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/, /[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/, /[\u2C00-\u2DFF\u2E80-\u2FFF]/, /[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/, /[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/, /[\uFE47-\uFEFE\uFF00-\uFFFD]/), ze = P(Dn, /\d/, /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/), V = E(Dn, ze, "*"), Ae = E(/[A-Z]/, ze, "*"), dr = ["attached", "autoclosure", E(/convention\(/, P("swift", "block", "c"), /\)/), "discardableResult", "dynamicCallable", "dynamicMemberLookup", "escaping", "freestanding", "frozen", "GKInspectable", "IBAction", "IBDesignable", "IBInspectable", "IBOutlet", "IBSegueAction", "inlinable", "main", "nonobjc", "NSApplicationMain", "NSCopying", "NSManaged", E(/objc\(/, V, /\)/), "objc", "objcMembers", "propertyWrapper", "requires_stored_property_inits", "resultBuilder", "Sendable", "testable", "UIApplicationMain", "unchecked", "unknown", "usableFromInline", "warn_unqualified_access"], ur = ["iOS", "iOSApplicationExtension", "macOS", "macOSApplicationExtension", "macCatalyst", "macCatalystApplicationExtension", "watchOS", "watchOSApplicationExtension", "tvOS", "tvOSApplicationExtension", "swift"];
var Ht = Object.freeze({
  __proto__: null,
  grmr_bash: (t) => {
    const e = t.regex, n = {}, o = {
      begin: /\$\{/,
      end: /\}/,
      contains: ["self", { begin: /:-/, contains: [n] }]
    };
    Object.assign(n, { className: "variable", variants: [{
      begin: e.concat(/\$[\w\d#@][\w\d_]*/, "(?![\\w\\d])(?![$])")
    }, o] });
    const a = {
      className: "subst",
      begin: /\$\(/,
      end: /\)/,
      contains: [t.BACKSLASH_ESCAPE]
    }, r = t.inherit(t.COMMENT(), { match: [/(^|\s)/, /#.*$/], scope: { 2: "comment" } }), i = {
      begin: /<<-?\s*(?=\w+)/,
      starts: { contains: [t.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: "string"
      })] }
    }, s = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [t.BACKSLASH_ESCAPE, n, a]
    };
    a.contains.push(s);
    const l = {
      begin: /\$?\(\(/,
      end: /\)\)/,
      contains: [{ begin: /\d+#[0-9a-f]+/, className: "number" }, t.NUMBER_MODE, n]
    }, d = t.SHEBANG({
      binary: "(fish|bash|zsh|sh|csh|ksh|tcsh|dash|scsh)",
      relevance: 10
    }), c = {
      className: "function",
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: !0,
      contains: [t.inherit(t.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
      relevance: 0
    };
    return {
      name: "Bash",
      aliases: ["sh", "zsh"],
      keywords: {
        $pattern: /\b[a-z][a-z0-9._-]+\b/,
        keyword: ["if", "then", "else", "elif", "fi", "time", "for", "while", "until", "in", "do", "done", "case", "esac", "coproc", "function", "select"],
        literal: ["true", "false"],
        built_in: ["break", "cd", "continue", "eval", "exec", "exit", "export", "getopts", "hash", "pwd", "readonly", "return", "shift", "test", "times", "trap", "umask", "unset", "alias", "bind", "builtin", "caller", "command", "declare", "echo", "enable", "help", "let", "local", "logout", "mapfile", "printf", "read", "readarray", "source", "sudo", "type", "typeset", "ulimit", "unalias", "set", "shopt", "autoload", "bg", "bindkey", "bye", "cap", "chdir", "clone", "comparguments", "compcall", "compctl", "compdescribe", "compfiles", "compgroups", "compquote", "comptags", "comptry", "compvalues", "dirs", "disable", "disown", "echotc", "echoti", "emulate", "fc", "fg", "float", "functions", "getcap", "getln", "history", "integer", "jobs", "kill", "limit", "log", "noglob", "popd", "print", "pushd", "pushln", "rehash", "sched", "setcap", "setopt", "stat", "suspend", "ttyctl", "unfunction", "unhash", "unlimit", "unsetopt", "vared", "wait", "whence", "where", "which", "zcompile", "zformat", "zftp", "zle", "zmodload", "zparseopts", "zprof", "zpty", "zregexparse", "zsocket", "zstyle", "ztcp", "chcon", "chgrp", "chown", "chmod", "cp", "dd", "df", "dir", "dircolors", "ln", "ls", "mkdir", "mkfifo", "mknod", "mktemp", "mv", "realpath", "rm", "rmdir", "shred", "sync", "touch", "truncate", "vdir", "b2sum", "base32", "base64", "cat", "cksum", "comm", "csplit", "cut", "expand", "fmt", "fold", "head", "join", "md5sum", "nl", "numfmt", "od", "paste", "ptx", "pr", "sha1sum", "sha224sum", "sha256sum", "sha384sum", "sha512sum", "shuf", "sort", "split", "sum", "tac", "tail", "tr", "tsort", "unexpand", "uniq", "wc", "arch", "basename", "chroot", "date", "dirname", "du", "echo", "env", "expr", "factor", "groups", "hostid", "id", "link", "logname", "nice", "nohup", "nproc", "pathchk", "pinky", "printenv", "printf", "pwd", "readlink", "runcon", "seq", "sleep", "stat", "stdbuf", "stty", "tee", "test", "timeout", "tty", "uname", "unlink", "uptime", "users", "who", "whoami", "yes"]
      },
      contains: [d, t.SHEBANG(), c, l, r, i, { match: /(\/[a-z._-]+)+/ }, s, { match: /\\"/ }, {
        className: "string",
        begin: /'/,
        end: /'/
      }, { match: /\\'/ }, n]
    };
  },
  grmr_c: (t) => {
    const e = t.regex, n = t.COMMENT("//", "$", {
      contains: [{ begin: /\\\n/ }]
    }), o = "decltype\\(auto\\)", a = "[a-zA-Z_]\\w*::", r = "(" + o + "|" + e.optional(a) + "[a-zA-Z_]\\w*" + e.optional("<[^<>]+>") + ")", i = {
      className: "type",
      variants: [{ begin: "\\b[a-z\\d_]*_t\\b" }, {
        match: /\batomic_[a-z]{3,6}\b/
      }]
    }, s = { className: "string", variants: [{
      begin: '(u8?|U|L)?"',
      end: '"',
      illegal: "\\n",
      contains: [t.BACKSLASH_ESCAPE]
    }, {
      begin: "(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
      end: "'",
      illegal: "."
    }, t.END_SAME_AS_BEGIN({
      begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
      end: /\)([^()\\ ]{0,16})"/
    })] }, l = {
      className: "number",
      variants: [{ match: /\b(0b[01']+)/ }, {
        match: /(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/
      }, {
        match: /(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/
      }, { match: /(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/ }],
      relevance: 0
    }, d = { className: "meta", begin: /#\s*[a-z]+\b/, end: /$/, keywords: {
      keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include"
    }, contains: [{ begin: /\\\n/, relevance: 0 }, t.inherit(s, { className: "string" }), {
      className: "string",
      begin: /<.*?>/
    }, n, t.C_BLOCK_COMMENT_MODE] }, c = {
      className: "title",
      begin: e.optional(a) + t.IDENT_RE,
      relevance: 0
    }, b = e.optional(a) + t.IDENT_RE + "\\s*\\(", u = {
      keyword: ["asm", "auto", "break", "case", "continue", "default", "do", "else", "enum", "extern", "for", "fortran", "goto", "if", "inline", "register", "restrict", "return", "sizeof", "typeof", "typeof_unqual", "struct", "switch", "typedef", "union", "volatile", "while", "_Alignas", "_Alignof", "_Atomic", "_Generic", "_Noreturn", "_Static_assert", "_Thread_local", "alignas", "alignof", "noreturn", "static_assert", "thread_local", "_Pragma"],
      type: ["float", "double", "signed", "unsigned", "int", "short", "long", "char", "void", "_Bool", "_BitInt", "_Complex", "_Imaginary", "_Decimal32", "_Decimal64", "_Decimal96", "_Decimal128", "_Decimal64x", "_Decimal128x", "_Float16", "_Float32", "_Float64", "_Float128", "_Float32x", "_Float64x", "_Float128x", "const", "static", "constexpr", "complex", "bool", "imaginary"],
      literal: "true false NULL",
      built_in: "std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
    }, p = [d, i, n, t.C_BLOCK_COMMENT_MODE, l, s], m = {
      variants: [{ begin: /=/, end: /;/ }, {
        begin: /\(/,
        end: /\)/
      }, { beginKeywords: "new throw return else", end: /;/ }],
      keywords: u,
      contains: p.concat([{
        begin: /\(/,
        end: /\)/,
        keywords: u,
        contains: p.concat(["self"]),
        relevance: 0
      }]),
      relevance: 0
    }, h = {
      begin: "(" + r + "[\\*&\\s]+)+" + b,
      returnBegin: !0,
      end: /[{;=]/,
      excludeEnd: !0,
      keywords: u,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [{ begin: o, keywords: u, relevance: 0 }, {
        begin: b,
        returnBegin: !0,
        contains: [t.inherit(c, { className: "title.function" })],
        relevance: 0
      }, { relevance: 0, match: /,/ }, {
        className: "params",
        begin: /\(/,
        end: /\)/,
        keywords: u,
        relevance: 0,
        contains: [n, t.C_BLOCK_COMMENT_MODE, s, l, i, {
          begin: /\(/,
          end: /\)/,
          keywords: u,
          relevance: 0,
          contains: ["self", n, t.C_BLOCK_COMMENT_MODE, s, l, i]
        }]
      }, i, n, t.C_BLOCK_COMMENT_MODE, d]
    };
    return {
      name: "C",
      aliases: ["h"],
      keywords: u,
      disableAutodetect: !0,
      illegal: "</",
      contains: [].concat(m, h, p, [d, {
        begin: t.IDENT_RE + "::",
        keywords: u
      }, {
        className: "class",
        beginKeywords: "enum class struct union",
        end: /[{;:<>=]/,
        contains: [{
          beginKeywords: "final class struct"
        }, t.TITLE_MODE]
      }]),
      exports: {
        preprocessor: d,
        strings: s,
        keywords: u
      }
    };
  },
  grmr_cpp: (t) => {
    const e = t.regex, n = t.COMMENT("//", "$", {
      contains: [{ begin: /\\\n/ }]
    }), o = "decltype\\(auto\\)", a = "[a-zA-Z_]\\w*::", r = "(?!struct)(" + o + "|" + e.optional(a) + "[a-zA-Z_]\\w*" + e.optional("<[^<>]+>") + ")", i = {
      className: "type",
      begin: "\\b[a-z\\d_]*_t\\b"
    }, s = { className: "string", variants: [{
      begin: '(u8?|U|L)?"',
      end: '"',
      illegal: "\\n",
      contains: [t.BACKSLASH_ESCAPE]
    }, {
      begin: "(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
      end: "'",
      illegal: "."
    }, t.END_SAME_AS_BEGIN({
      begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
      end: /\)([^()\\ ]{0,16})"/
    })] }, l = {
      className: "number",
      variants: [{
        begin: "[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
      }, {
        begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
      }],
      relevance: 0
    }, d = { className: "meta", begin: /#\s*[a-z]+\b/, end: /$/, keywords: {
      keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
    }, contains: [{ begin: /\\\n/, relevance: 0 }, t.inherit(s, { className: "string" }), {
      className: "string",
      begin: /<.*?>/
    }, n, t.C_BLOCK_COMMENT_MODE] }, c = {
      className: "title",
      begin: e.optional(a) + t.IDENT_RE,
      relevance: 0
    }, b = e.optional(a) + t.IDENT_RE + "\\s*\\(", u = {
      type: ["bool", "char", "char16_t", "char32_t", "char8_t", "double", "float", "int", "long", "short", "void", "wchar_t", "unsigned", "signed", "const", "static"],
      keyword: ["alignas", "alignof", "and", "and_eq", "asm", "atomic_cancel", "atomic_commit", "atomic_noexcept", "auto", "bitand", "bitor", "break", "case", "catch", "class", "co_await", "co_return", "co_yield", "compl", "concept", "const_cast|10", "consteval", "constexpr", "constinit", "continue", "decltype", "default", "delete", "do", "dynamic_cast|10", "else", "enum", "explicit", "export", "extern", "false", "final", "for", "friend", "goto", "if", "import", "inline", "module", "mutable", "namespace", "new", "noexcept", "not", "not_eq", "nullptr", "operator", "or", "or_eq", "override", "private", "protected", "public", "reflexpr", "register", "reinterpret_cast|10", "requires", "return", "sizeof", "static_assert", "static_cast|10", "struct", "switch", "synchronized", "template", "this", "thread_local", "throw", "transaction_safe", "transaction_safe_dynamic", "true", "try", "typedef", "typeid", "typename", "union", "using", "virtual", "volatile", "while", "xor", "xor_eq"],
      literal: ["NULL", "false", "nullopt", "nullptr", "true"],
      built_in: ["_Pragma"],
      _type_hints: ["any", "auto_ptr", "barrier", "binary_semaphore", "bitset", "complex", "condition_variable", "condition_variable_any", "counting_semaphore", "deque", "false_type", "flat_map", "flat_set", "future", "imaginary", "initializer_list", "istringstream", "jthread", "latch", "lock_guard", "multimap", "multiset", "mutex", "optional", "ostringstream", "packaged_task", "pair", "promise", "priority_queue", "queue", "recursive_mutex", "recursive_timed_mutex", "scoped_lock", "set", "shared_future", "shared_lock", "shared_mutex", "shared_timed_mutex", "shared_ptr", "stack", "string_view", "stringstream", "timed_mutex", "thread", "true_type", "tuple", "unique_lock", "unique_ptr", "unordered_map", "unordered_multimap", "unordered_multiset", "unordered_set", "variant", "vector", "weak_ptr", "wstring", "wstring_view"]
    }, p = {
      className: "function.dispatch",
      relevance: 0,
      keywords: {
        _hint: ["abort", "abs", "acos", "apply", "as_const", "asin", "atan", "atan2", "calloc", "ceil", "cerr", "cin", "clog", "cos", "cosh", "cout", "declval", "endl", "exchange", "exit", "exp", "fabs", "floor", "fmod", "forward", "fprintf", "fputs", "free", "frexp", "fscanf", "future", "invoke", "isalnum", "isalpha", "iscntrl", "isdigit", "isgraph", "islower", "isprint", "ispunct", "isspace", "isupper", "isxdigit", "labs", "launder", "ldexp", "log", "log10", "make_pair", "make_shared", "make_shared_for_overwrite", "make_tuple", "make_unique", "malloc", "memchr", "memcmp", "memcpy", "memset", "modf", "move", "pow", "printf", "putchar", "puts", "realloc", "scanf", "sin", "sinh", "snprintf", "sprintf", "sqrt", "sscanf", "std", "stderr", "stdin", "stdout", "strcat", "strchr", "strcmp", "strcpy", "strcspn", "strlen", "strncat", "strncmp", "strncpy", "strpbrk", "strrchr", "strspn", "strstr", "swap", "tan", "tanh", "terminate", "to_underlying", "tolower", "toupper", "vfprintf", "visit", "vprintf", "vsprintf"]
      },
      begin: e.concat(/\b/, /(?!decltype)/, /(?!if)/, /(?!for)/, /(?!switch)/, /(?!while)/, t.IDENT_RE, e.lookahead(/(<[^<>]+>|)\s*\(/))
    }, m = [p, d, i, n, t.C_BLOCK_COMMENT_MODE, l, s], h = {
      variants: [{ begin: /=/, end: /;/ }, {
        begin: /\(/,
        end: /\)/
      }, { beginKeywords: "new throw return else", end: /;/ }],
      keywords: u,
      contains: m.concat([{
        begin: /\(/,
        end: /\)/,
        keywords: u,
        contains: m.concat(["self"]),
        relevance: 0
      }]),
      relevance: 0
    }, y = {
      className: "function",
      begin: "(" + r + "[\\*&\\s]+)+" + b,
      returnBegin: !0,
      end: /[{;=]/,
      excludeEnd: !0,
      keywords: u,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [{ begin: o, keywords: u, relevance: 0 }, {
        begin: b,
        returnBegin: !0,
        contains: [c],
        relevance: 0
      }, { begin: /::/, relevance: 0 }, {
        begin: /:/,
        endsWithParent: !0,
        contains: [s, l]
      }, { relevance: 0, match: /,/ }, {
        className: "params",
        begin: /\(/,
        end: /\)/,
        keywords: u,
        relevance: 0,
        contains: [n, t.C_BLOCK_COMMENT_MODE, s, l, i, {
          begin: /\(/,
          end: /\)/,
          keywords: u,
          relevance: 0,
          contains: ["self", n, t.C_BLOCK_COMMENT_MODE, s, l, i]
        }]
      }, i, n, t.C_BLOCK_COMMENT_MODE, d]
    };
    return {
      name: "C++",
      aliases: ["cc", "c++", "h++", "hpp", "hh", "hxx", "cxx"],
      keywords: u,
      illegal: "</",
      classNameAliases: { "function.dispatch": "built_in" },
      contains: [].concat(h, y, p, m, [d, {
        begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
        end: ">",
        keywords: u,
        contains: ["self", i]
      }, { begin: t.IDENT_RE + "::", keywords: u }, {
        match: [/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/, /\s+/, /\w+/],
        className: { 1: "keyword", 3: "title.class" }
      }])
    };
  },
  grmr_csharp: (t) => {
    const e = {
      keyword: ["abstract", "as", "base", "break", "case", "catch", "class", "const", "continue", "do", "else", "event", "explicit", "extern", "finally", "fixed", "for", "foreach", "goto", "if", "implicit", "in", "interface", "internal", "is", "lock", "namespace", "new", "operator", "out", "override", "params", "private", "protected", "public", "readonly", "record", "ref", "return", "scoped", "sealed", "sizeof", "stackalloc", "static", "struct", "switch", "this", "throw", "try", "typeof", "unchecked", "unsafe", "using", "virtual", "void", "volatile", "while"].concat(["add", "alias", "and", "ascending", "args", "async", "await", "by", "descending", "dynamic", "equals", "file", "from", "get", "global", "group", "init", "into", "join", "let", "nameof", "not", "notnull", "on", "or", "orderby", "partial", "record", "remove", "required", "scoped", "select", "set", "unmanaged", "value|0", "var", "when", "where", "with", "yield"]),
      built_in: ["bool", "byte", "char", "decimal", "delegate", "double", "dynamic", "enum", "float", "int", "long", "nint", "nuint", "object", "sbyte", "short", "string", "ulong", "uint", "ushort"],
      literal: ["default", "false", "null", "true"]
    }, n = t.inherit(t.TITLE_MODE, {
      begin: "[a-zA-Z](\\.?\\w)*"
    }), o = { className: "number", variants: [{
      begin: "\\b(0b[01']+)"
    }, {
      begin: "(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"
    }, {
      begin: "(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
    }], relevance: 0 }, a = {
      className: "string",
      begin: '@"',
      end: '"',
      contains: [{ begin: '""' }]
    }, r = t.inherit(a, { illegal: /\n/ }), i = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: e
    }, s = t.inherit(i, { illegal: /\n/ }), l = {
      className: "string",
      begin: /\$"/,
      end: '"',
      illegal: /\n/,
      contains: [{ begin: /\{\{/ }, {
        begin: /\}\}/
      }, t.BACKSLASH_ESCAPE, s]
    }, d = { className: "string", begin: /\$@"/, end: '"', contains: [{
      begin: /\{\{/
    }, { begin: /\}\}/ }, { begin: '""' }, i] }, c = t.inherit(d, {
      illegal: /\n/,
      contains: [{ begin: /\{\{/ }, { begin: /\}\}/ }, { begin: '""' }, s]
    });
    i.contains = [d, l, a, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, o, t.C_BLOCK_COMMENT_MODE], s.contains = [c, l, r, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, o, t.inherit(t.C_BLOCK_COMMENT_MODE, {
      illegal: /\n/
    })];
    const b = { variants: [{
      className: "string",
      begin: /"""("*)(?!")(.|\n)*?"""\1/,
      relevance: 1
    }, d, l, a, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE] }, u = {
      begin: "<",
      end: ">",
      contains: [{ beginKeywords: "in out" }, n]
    }, p = t.IDENT_RE + "(<" + t.IDENT_RE + "(\\s*,\\s*" + t.IDENT_RE + ")*>)?(\\[\\])?", m = {
      begin: "@" + t.IDENT_RE,
      relevance: 0
    };
    return {
      name: "C#",
      aliases: ["cs", "c#"],
      keywords: e,
      illegal: /::/,
      contains: [t.COMMENT("///", "$", {
        returnBegin: !0,
        contains: [{ className: "doctag", variants: [{ begin: "///", relevance: 0 }, {
          begin: "<!--|-->"
        }, { begin: "</?", end: ">" }] }]
      }), t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, {
        className: "meta",
        begin: "#",
        end: "$",
        keywords: {
          keyword: "if else elif endif define undef warning error line region endregion pragma checksum"
        }
      }, b, o, {
        beginKeywords: "class interface",
        relevance: 0,
        end: /[{;=]/,
        illegal: /[^\s:,]/,
        contains: [{
          beginKeywords: "where class"
        }, n, u, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, {
        beginKeywords: "namespace",
        relevance: 0,
        end: /[{;=]/,
        illegal: /[^\s:]/,
        contains: [n, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, {
        beginKeywords: "record",
        relevance: 0,
        end: /[{;=]/,
        illegal: /[^\s:]/,
        contains: [n, u, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, {
        className: "meta",
        begin: "^\\s*\\[(?=[\\w])",
        excludeBegin: !0,
        end: "\\]",
        excludeEnd: !0,
        contains: [{
          className: "string",
          begin: /"/,
          end: /"/
        }]
      }, {
        beginKeywords: "new return throw await else",
        relevance: 0
      }, {
        className: "function",
        begin: "(" + p + "\\s+)+" + t.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
        returnBegin: !0,
        end: /\s*[{;=]/,
        excludeEnd: !0,
        keywords: e,
        contains: [{
          beginKeywords: "public private protected static internal protected abstract async extern override unsafe virtual new sealed partial",
          relevance: 0
        }, {
          begin: t.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
          returnBegin: !0,
          contains: [t.TITLE_MODE, u],
          relevance: 0
        }, { match: /\(\)/ }, {
          className: "params",
          begin: /\(/,
          end: /\)/,
          excludeBegin: !0,
          excludeEnd: !0,
          keywords: e,
          relevance: 0,
          contains: [b, o, t.C_BLOCK_COMMENT_MODE]
        }, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, m]
    };
  },
  grmr_css: (t) => {
    const e = t.regex, n = Ze(t), o = [t.APOS_STRING_MODE, t.QUOTE_STRING_MODE];
    return {
      name: "CSS",
      case_insensitive: !0,
      illegal: /[=|'\$]/,
      keywords: {
        keyframePosition: "from to"
      },
      classNameAliases: { keyframePosition: "selector-tag" },
      contains: [n.BLOCK_COMMENT, {
        begin: /-(webkit|moz|ms|o)-(?=[a-z])/
      }, n.CSS_NUMBER_MODE, {
        className: "selector-id",
        begin: /#[A-Za-z0-9_-]+/,
        relevance: 0
      }, {
        className: "selector-class",
        begin: "\\.[a-zA-Z-][a-zA-Z0-9_-]*",
        relevance: 0
      }, n.ATTRIBUTE_SELECTOR_MODE, {
        className: "selector-pseudo",
        variants: [{
          begin: ":(" + Se.join("|") + ")"
        }, { begin: ":(:)?(" + Me.join("|") + ")" }]
      }, n.CSS_VARIABLE, { className: "attribute", begin: "\\b(" + Qe.join("|") + ")\\b" }, {
        begin: /:/,
        end: /[;}{]/,
        contains: [n.BLOCK_COMMENT, n.HEXCOLOR, n.IMPORTANT, n.CSS_NUMBER_MODE, ...o, {
          begin: /(url|data-uri)\(/,
          end: /\)/,
          relevance: 0,
          keywords: {
            built_in: "url data-uri"
          },
          contains: [...o, {
            className: "string",
            begin: /[^)]/,
            endsWithParent: !0,
            excludeEnd: !0
          }]
        }, n.FUNCTION_DISPATCH]
      }, {
        begin: e.lookahead(/@/),
        end: "[{;]",
        relevance: 0,
        illegal: /:/,
        contains: [{
          className: "keyword",
          begin: /@-?\w[\w]*(-\w+)*/
        }, { begin: /\s/, endsWithParent: !0, excludeEnd: !0, relevance: 0, keywords: {
          $pattern: /[a-z-]+/,
          keyword: "and or not only",
          attribute: We.join(" ")
        }, contains: [{
          begin: /[a-z-]+(?=:)/,
          className: "attribute"
        }, ...o, n.CSS_NUMBER_MODE] }]
      }, {
        className: "selector-tag",
        begin: "\\b(" + Ge.join("|") + ")\\b"
      }]
    };
  },
  grmr_diff: (t) => {
    const e = t.regex;
    return { name: "Diff", aliases: ["patch"], contains: [{
      className: "meta",
      relevance: 10,
      match: e.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/, /^\*\*\* +\d+,\d+ +\*\*\*\*$/, /^--- +\d+,\d+ +----$/)
    }, { className: "comment", variants: [{
      begin: e.either(/Index: /, /^index/, /={3,}/, /^-{3}/, /^\*{3} /, /^\+{3}/, /^diff --git/),
      end: /$/
    }, { match: /^\*{15}$/ }] }, { className: "addition", begin: /^\+/, end: /$/ }, {
      className: "deletion",
      begin: /^-/,
      end: /$/
    }, {
      className: "addition",
      begin: /^!/,
      end: /$/
    }] };
  },
  grmr_go: (t) => {
    const e = {
      keyword: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var"],
      type: ["bool", "byte", "complex64", "complex128", "error", "float32", "float64", "int8", "int16", "int32", "int64", "string", "uint8", "uint16", "uint32", "uint64", "int", "uint", "uintptr", "rune"],
      literal: ["true", "false", "iota", "nil"],
      built_in: ["append", "cap", "close", "complex", "copy", "imag", "len", "make", "new", "panic", "print", "println", "real", "recover", "delete"]
    };
    return {
      name: "Go",
      aliases: ["golang"],
      keywords: e,
      illegal: "</",
      contains: [t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, {
        className: "string",
        variants: [t.QUOTE_STRING_MODE, t.APOS_STRING_MODE, { begin: "`", end: "`" }]
      }, {
        className: "number",
        variants: [{
          match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
          relevance: 0
        }, {
          match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
          relevance: 0
        }, { match: /-?\b0[oO](_?[0-7])*i?/, relevance: 0 }, {
          match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
          relevance: 0
        }, {
          match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
          relevance: 0
        }]
      }, {
        begin: /:=/
      }, {
        className: "function",
        beginKeywords: "func",
        end: "\\s*(\\{|$)",
        excludeEnd: !0,
        contains: [t.TITLE_MODE, {
          className: "params",
          begin: /\(/,
          end: /\)/,
          endsParent: !0,
          keywords: e,
          illegal: /["']/
        }]
      }]
    };
  },
  grmr_graphql: (t) => {
    const e = t.regex;
    return {
      name: "GraphQL",
      aliases: ["gql"],
      case_insensitive: !0,
      disableAutodetect: !1,
      keywords: {
        keyword: ["query", "mutation", "subscription", "type", "input", "schema", "directive", "interface", "union", "scalar", "fragment", "enum", "on"],
        literal: ["true", "false", "null"]
      },
      contains: [t.HASH_COMMENT_MODE, t.QUOTE_STRING_MODE, t.NUMBER_MODE, {
        scope: "punctuation",
        match: /[.]{3}/,
        relevance: 0
      }, {
        scope: "punctuation",
        begin: /[\!\(\)\:\=\[\]\{\|\}]{1}/,
        relevance: 0
      }, {
        scope: "variable",
        begin: /\$/,
        end: /\W/,
        excludeEnd: !0,
        relevance: 0
      }, { scope: "meta", match: /@\w+/, excludeEnd: !0 }, {
        scope: "symbol",
        begin: e.concat(/[_A-Za-z][_0-9A-Za-z]*/, e.lookahead(/\s*:/)),
        relevance: 0
      }],
      illegal: [/[;<']/, /BEGIN/]
    };
  },
  grmr_ini: (t) => {
    const e = t.regex, n = {
      className: "number",
      relevance: 0,
      variants: [{ begin: /([+-]+)?[\d]+_[\d_]+/ }, {
        begin: t.NUMBER_RE
      }]
    }, o = t.COMMENT();
    o.variants = [{ begin: /;/, end: /$/ }, {
      begin: /#/,
      end: /$/
    }];
    const a = { className: "variable", variants: [{ begin: /\$[\w\d"][\w\d_]*/ }, {
      begin: /\$\{(.*?)\}/
    }] }, r = {
      className: "literal",
      begin: /\bon|off|true|false|yes|no\b/
    }, i = {
      className: "string",
      contains: [t.BACKSLASH_ESCAPE],
      variants: [{ begin: "'''", end: "'''", relevance: 10 }, {
        begin: '"""',
        end: '"""',
        relevance: 10
      }, { begin: '"', end: '"' }, { begin: "'", end: "'" }]
    }, s = {
      begin: /\[/,
      end: /\]/,
      contains: [o, r, a, i, n, "self"],
      relevance: 0
    }, l = e.either(/[A-Za-z0-9_-]+/, /"(\\"|[^"])*"/, /'[^']*'/);
    return {
      name: "TOML, also INI",
      aliases: ["toml"],
      case_insensitive: !0,
      illegal: /\S/,
      contains: [o, { className: "section", begin: /\[+/, end: /\]+/ }, {
        begin: e.concat(l, "(\\s*\\.\\s*", l, ")*", e.lookahead(/\s*=\s*[^#\s]/)),
        className: "attr",
        starts: { end: /$/, contains: [o, s, r, a, i, n] }
      }]
    };
  },
  grmr_java: (t) => {
    const e = t.regex, n = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*", o = n + gn("(?:<" + n + "~~~(?:\\s*,\\s*" + n + "~~~)*>)?", /~~~/g, 2), a = {
      keyword: ["synchronized", "abstract", "private", "var", "static", "if", "const ", "for", "while", "strictfp", "finally", "protected", "import", "native", "final", "void", "enum", "else", "break", "transient", "catch", "instanceof", "volatile", "case", "assert", "package", "default", "public", "try", "switch", "continue", "throws", "protected", "public", "private", "module", "requires", "exports", "do", "sealed", "yield", "permits", "goto", "when"],
      literal: ["false", "true", "null"],
      type: ["char", "boolean", "long", "float", "int", "byte", "short", "double"],
      built_in: ["super", "this"]
    }, r = { className: "meta", begin: "@" + n, contains: [{
      begin: /\(/,
      end: /\)/,
      contains: ["self"]
    }] }, i = {
      className: "params",
      begin: /\(/,
      end: /\)/,
      keywords: a,
      relevance: 0,
      contains: [t.C_BLOCK_COMMENT_MODE],
      endsParent: !0
    };
    return {
      name: "Java",
      aliases: ["jsp"],
      keywords: a,
      illegal: /<\/|#/,
      contains: [t.COMMENT("/\\*\\*", "\\*/", { relevance: 0, contains: [{
        begin: /\w+@/,
        relevance: 0
      }, { className: "doctag", begin: "@[A-Za-z]+" }] }), {
        begin: /import java\.[a-z]+\./,
        keywords: "import",
        relevance: 2
      }, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, {
        begin: /"""/,
        end: /"""/,
        className: "string",
        contains: [t.BACKSLASH_ESCAPE]
      }, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, {
        match: [/\b(?:class|interface|enum|extends|implements|new)/, /\s+/, n],
        className: {
          1: "keyword",
          3: "title.class"
        }
      }, { match: /non-sealed/, scope: "keyword" }, {
        begin: [e.concat(/(?!else)/, n), /\s+/, n, /\s+/, /=(?!=)/],
        className: {
          1: "type",
          3: "variable",
          5: "operator"
        }
      }, { begin: [/record/, /\s+/, n], className: {
        1: "keyword",
        3: "title.class"
      }, contains: [i, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE] }, {
        beginKeywords: "new throw return else",
        relevance: 0
      }, {
        begin: ["(?:" + o + "\\s+)", t.UNDERSCORE_IDENT_RE, /\s*(?=\()/],
        className: {
          2: "title.function"
        },
        keywords: a,
        contains: [{
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: a,
          relevance: 0,
          contains: [r, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, Xe, t.C_BLOCK_COMMENT_MODE]
        }, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, Xe, r]
    };
  },
  grmr_javascript: jt,
  grmr_json: (t) => {
    const e = ["true", "false", "null"], n = {
      scope: "literal",
      beginKeywords: e.join(" ")
    };
    return {
      name: "JSON",
      aliases: ["jsonc"],
      keywords: {
        literal: e
      },
      contains: [{
        className: "attr",
        begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
        relevance: 1.01
      }, {
        match: /[{}[\],:]/,
        className: "punctuation",
        relevance: 0
      }, t.QUOTE_STRING_MODE, n, t.C_NUMBER_MODE, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE],
      illegal: "\\S"
    };
  },
  grmr_kotlin: (t) => {
    const e = {
      keyword: "abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
      built_in: "Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
      literal: "true false null"
    }, n = {
      className: "symbol",
      begin: t.UNDERSCORE_IDENT_RE + "@"
    }, o = { className: "subst", begin: /\$\{/, end: /\}/, contains: [t.C_NUMBER_MODE] }, a = {
      className: "variable",
      begin: "\\$" + t.UNDERSCORE_IDENT_RE
    }, r = {
      className: "string",
      variants: [{ begin: '"""', end: '"""(?=[^"])', contains: [a, o] }, {
        begin: "'",
        end: "'",
        illegal: /\n/,
        contains: [t.BACKSLASH_ESCAPE]
      }, {
        begin: '"',
        end: '"',
        illegal: /\n/,
        contains: [t.BACKSLASH_ESCAPE, a, o]
      }]
    };
    o.contains.push(r);
    const i = {
      className: "meta",
      begin: "@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*" + t.UNDERSCORE_IDENT_RE + ")?"
    }, s = {
      className: "meta",
      begin: "@" + t.UNDERSCORE_IDENT_RE,
      contains: [{
        begin: /\(/,
        end: /\)/,
        contains: [t.inherit(r, { className: "string" }), "self"]
      }]
    }, l = Xe, d = t.COMMENT("/\\*", "\\*/", { contains: [t.C_BLOCK_COMMENT_MODE] }), c = {
      variants: [{ className: "type", begin: t.UNDERSCORE_IDENT_RE }, {
        begin: /\(/,
        end: /\)/,
        contains: []
      }]
    }, b = c;
    return b.variants[1].contains = [c], c.variants[1].contains = [b], {
      name: "Kotlin",
      aliases: ["kt", "kts"],
      keywords: e,
      contains: [t.COMMENT("/\\*\\*", "\\*/", { relevance: 0, contains: [{
        className: "doctag",
        begin: "@[A-Za-z]+"
      }] }), t.C_LINE_COMMENT_MODE, d, {
        className: "keyword",
        begin: /\b(break|continue|return|this)\b/,
        starts: { contains: [{
          className: "symbol",
          begin: /@\w+/
        }] }
      }, n, i, s, {
        className: "function",
        beginKeywords: "fun",
        end: "[(]|$",
        returnBegin: !0,
        excludeEnd: !0,
        keywords: e,
        relevance: 5,
        contains: [{
          begin: t.UNDERSCORE_IDENT_RE + "\\s*\\(",
          returnBegin: !0,
          relevance: 0,
          contains: [t.UNDERSCORE_TITLE_MODE]
        }, {
          className: "type",
          begin: /</,
          end: />/,
          keywords: "reified",
          relevance: 0
        }, {
          className: "params",
          begin: /\(/,
          end: /\)/,
          endsParent: !0,
          keywords: e,
          relevance: 0,
          contains: [{
            begin: /:/,
            end: /[=,\/]/,
            endsWithParent: !0,
            contains: [c, t.C_LINE_COMMENT_MODE, d],
            relevance: 0
          }, t.C_LINE_COMMENT_MODE, d, i, s, r, t.C_NUMBER_MODE]
        }, d]
      }, {
        begin: [/class|interface|trait/, /\s+/, t.UNDERSCORE_IDENT_RE],
        beginScope: {
          3: "title.class"
        },
        keywords: "class interface trait",
        end: /[:\{(]|$/,
        excludeEnd: !0,
        illegal: "extends implements",
        contains: [{
          beginKeywords: "public protected internal private constructor"
        }, t.UNDERSCORE_TITLE_MODE, {
          className: "type",
          begin: /</,
          end: />/,
          excludeBegin: !0,
          excludeEnd: !0,
          relevance: 0
        }, {
          className: "type",
          begin: /[,:]\s*/,
          end: /[<\(,){\s]|$/,
          excludeBegin: !0,
          returnEnd: !0
        }, i, s]
      }, r, {
        className: "meta",
        begin: "^#!/usr/bin/env",
        end: "$",
        illegal: `
`
      }, l]
    };
  },
  grmr_less: (t) => {
    const e = Ze(t), n = ar, o = "[\\w-]+", a = "(" + o + "|@\\{" + o + "\\})", r = [], i = [], s = (B) => ({
      className: "string",
      begin: "~?" + B + ".*?" + B
    }), l = (B, g, k) => ({
      className: B,
      begin: g,
      relevance: k
    }), d = {
      $pattern: /[a-z-]+/,
      keyword: "and or not only",
      attribute: We.join(" ")
    }, c = {
      begin: "\\(",
      end: "\\)",
      contains: i,
      keywords: d,
      relevance: 0
    };
    i.push(t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, s("'"), s('"'), e.CSS_NUMBER_MODE, {
      begin: "(url|data-uri)\\(",
      starts: {
        className: "string",
        end: "[\\)\\n]",
        excludeEnd: !0
      }
    }, e.HEXCOLOR, c, l("variable", "@@?" + o, 10), l("variable", "@\\{" + o + "\\}"), l("built_in", "~?`[^`]*?`"), {
      className: "attribute",
      begin: o + "\\s*:",
      end: ":",
      returnBegin: !0,
      excludeEnd: !0
    }, e.IMPORTANT, { beginKeywords: "and not" }, e.FUNCTION_DISPATCH);
    const b = i.concat({
      begin: /\{/,
      end: /\}/,
      contains: r
    }), u = {
      beginKeywords: "when",
      endsWithParent: !0,
      contains: [{ beginKeywords: "and not" }].concat(i)
    }, p = {
      begin: a + "\\s*:",
      returnBegin: !0,
      end: /[;}]/,
      relevance: 0,
      contains: [{
        begin: /-(webkit|moz|ms|o)-/
      }, e.CSS_VARIABLE, {
        className: "attribute",
        begin: "\\b(" + Qe.join("|") + ")\\b",
        end: /(?=:)/,
        starts: { endsWithParent: !0, illegal: "[<=$]", relevance: 0, contains: i }
      }]
    }, m = {
      className: "keyword",
      begin: "@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
      starts: { end: "[;{}]", keywords: d, returnEnd: !0, contains: i, relevance: 0 }
    }, h = {
      className: "variable",
      variants: [{ begin: "@" + o + "\\s*:", relevance: 15 }, {
        begin: "@" + o
      }],
      starts: { end: "[;}]", returnEnd: !0, contains: b }
    }, y = {
      variants: [{
        begin: "[\\.#:&\\[>]",
        end: "[;{}]"
      }, { begin: a, end: /\{/ }],
      returnBegin: !0,
      returnEnd: !0,
      illegal: `[<='$"]`,
      relevance: 0,
      contains: [t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, u, l("keyword", "all\\b"), l("variable", "@\\{" + o + "\\}"), {
        begin: "\\b(" + Ge.join("|") + ")\\b",
        className: "selector-tag"
      }, e.CSS_NUMBER_MODE, l("selector-tag", a, 0), l("selector-id", "#" + a), l("selector-class", "\\." + a, 0), l("selector-tag", "&", 0), e.ATTRIBUTE_SELECTOR_MODE, {
        className: "selector-pseudo",
        begin: ":(" + Se.join("|") + ")"
      }, {
        className: "selector-pseudo",
        begin: ":(:)?(" + Me.join("|") + ")"
      }, {
        begin: /\(/,
        end: /\)/,
        relevance: 0,
        contains: b
      }, { begin: "!important" }, e.FUNCTION_DISPATCH]
    }, j = {
      begin: o + `:(:)?(${n.join("|")})`,
      returnBegin: !0,
      contains: [y]
    };
    return r.push(t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, m, h, j, p, y, u, e.FUNCTION_DISPATCH), { name: "Less", case_insensitive: !0, illegal: `[=>'/<($"]`, contains: r };
  },
  grmr_lua: (t) => {
    const e = "\\[=*\\[", n = "\\]=*\\]", o = {
      begin: e,
      end: n,
      contains: ["self"]
    }, a = [t.COMMENT("--(?!" + e + ")", "$"), t.COMMENT("--" + e, n, {
      contains: [o],
      relevance: 10
    })];
    return { name: "Lua", aliases: ["pluto"], keywords: {
      $pattern: t.UNDERSCORE_IDENT_RE,
      literal: "true false nil",
      keyword: "and break do else elseif end for goto if in local not or repeat return then until while",
      built_in: "_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
    }, contains: a.concat([{
      className: "function",
      beginKeywords: "function",
      end: "\\)",
      contains: [t.inherit(t.TITLE_MODE, {
        begin: "([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"
      }), {
        className: "params",
        begin: "\\(",
        endsWithParent: !0,
        contains: a
      }].concat(a)
    }, t.C_NUMBER_MODE, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE, {
      className: "string",
      begin: e,
      end: n,
      contains: [o],
      relevance: 5
    }]) };
  },
  grmr_makefile: (t) => {
    const e = {
      className: "variable",
      variants: [{
        begin: "\\$\\(" + t.UNDERSCORE_IDENT_RE + "\\)",
        contains: [t.BACKSLASH_ESCAPE]
      }, { begin: /\$[@%<?\^\+\*]/ }]
    }, n = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [t.BACKSLASH_ESCAPE, e]
    }, o = {
      className: "variable",
      begin: /\$\([\w-]+\s/,
      end: /\)/,
      keywords: {
        built_in: "subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"
      },
      contains: [e, n]
    }, a = { begin: "^" + t.UNDERSCORE_IDENT_RE + "\\s*(?=[:+?]?=)" }, r = {
      className: "section",
      begin: /^[^\s]+:/,
      end: /$/,
      contains: [e]
    };
    return {
      name: "Makefile",
      aliases: ["mk", "mak", "make"],
      keywords: {
        $pattern: /[\w-]+/,
        keyword: "define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
      },
      contains: [t.HASH_COMMENT_MODE, e, n, o, a, {
        className: "meta",
        begin: /^\.PHONY:/,
        end: /$/,
        keywords: { $pattern: /[\.\w]+/, keyword: ".PHONY" }
      }, r]
    };
  },
  grmr_markdown: (t) => {
    const e = { begin: /<\/?[A-Za-z_]/, end: ">", subLanguage: "xml", relevance: 0 }, n = {
      variants: [{ begin: /\[.+?\]\[.*?\]/, relevance: 0 }, {
        begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
        relevance: 2
      }, {
        begin: t.regex.concat(/\[.+?\]\(/, /[A-Za-z][A-Za-z0-9+.-]*/, /:\/\/.*?\)/),
        relevance: 2
      }, { begin: /\[.+?\]\([./?&#].*?\)/, relevance: 1 }, {
        begin: /\[.*?\]\(.*?\)/,
        relevance: 0
      }],
      returnBegin: !0,
      contains: [{
        match: /\[(?=\])/
      }, {
        className: "string",
        relevance: 0,
        begin: "\\[",
        end: "\\]",
        excludeBegin: !0,
        returnEnd: !0
      }, {
        className: "link",
        relevance: 0,
        begin: "\\]\\(",
        end: "\\)",
        excludeBegin: !0,
        excludeEnd: !0
      }, {
        className: "symbol",
        relevance: 0,
        begin: "\\]\\[",
        end: "\\]",
        excludeBegin: !0,
        excludeEnd: !0
      }]
    }, o = {
      className: "strong",
      contains: [],
      variants: [{ begin: /_{2}(?!\s)/, end: /_{2}/ }, { begin: /\*{2}(?!\s)/, end: /\*{2}/ }]
    }, a = { className: "emphasis", contains: [], variants: [{ begin: /\*(?![*\s])/, end: /\*/ }, {
      begin: /_(?![_\s])/,
      end: /_/,
      relevance: 0
    }] }, r = t.inherit(o, {
      contains: []
    }), i = t.inherit(a, { contains: [] });
    o.contains.push(i), a.contains.push(r);
    let s = [e, n];
    return [o, a, r, i].forEach((l) => {
      l.contains = l.contains.concat(s);
    }), s = s.concat(o, a), { name: "Markdown", aliases: ["md", "mkdown", "mkd"], contains: [{
      className: "section",
      variants: [{ begin: "^#{1,6}", end: "$", contains: s }, {
        begin: "(?=^.+?\\n[=-]{2,}$)",
        contains: [{ begin: "^[=-]*$" }, {
          begin: "^",
          end: "\\n",
          contains: s
        }]
      }]
    }, e, {
      className: "bullet",
      begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
      end: "\\s+",
      excludeEnd: !0
    }, o, a, {
      className: "quote",
      begin: "^>\\s+",
      contains: s,
      end: "$"
    }, { className: "code", variants: [{ begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" }, {
      begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*"
    }, { begin: "```", end: "```+[ ]*$" }, {
      begin: "~~~",
      end: "~~~+[ ]*$"
    }, { begin: "`.+?`" }, {
      begin: "(?=^( {4}|\\t))",
      contains: [{ begin: "^( {4}|\\t)", end: "(\\n)$" }],
      relevance: 0
    }] }, {
      begin: "^[-\\*]{3,}",
      end: "$"
    }, n, { begin: /^\[[^\n]+\]:/, returnBegin: !0, contains: [{
      className: "symbol",
      begin: /\[/,
      end: /\]/,
      excludeBegin: !0,
      excludeEnd: !0
    }, {
      className: "link",
      begin: /:\s*/,
      end: /$/,
      excludeBegin: !0
    }] }, {
      scope: "literal",
      match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
    }] };
  },
  grmr_objectivec: (t) => {
    const e = /[a-zA-Z@][a-zA-Z0-9_]*/, n = {
      $pattern: e,
      keyword: ["@interface", "@class", "@protocol", "@implementation"]
    };
    return {
      name: "Objective-C",
      aliases: ["mm", "objc", "obj-c", "obj-c++", "objective-c++"],
      keywords: {
        "variable.language": ["this", "super"],
        $pattern: e,
        keyword: ["while", "export", "sizeof", "typedef", "const", "struct", "for", "union", "volatile", "static", "mutable", "if", "do", "return", "goto", "enum", "else", "break", "extern", "asm", "case", "default", "register", "explicit", "typename", "switch", "continue", "inline", "readonly", "assign", "readwrite", "self", "@synchronized", "id", "typeof", "nonatomic", "IBOutlet", "IBAction", "strong", "weak", "copy", "in", "out", "inout", "bycopy", "byref", "oneway", "__strong", "__weak", "__block", "__autoreleasing", "@private", "@protected", "@public", "@try", "@property", "@end", "@throw", "@catch", "@finally", "@autoreleasepool", "@synthesize", "@dynamic", "@selector", "@optional", "@required", "@encode", "@package", "@import", "@defs", "@compatibility_alias", "__bridge", "__bridge_transfer", "__bridge_retained", "__bridge_retain", "__covariant", "__contravariant", "__kindof", "_Nonnull", "_Nullable", "_Null_unspecified", "__FUNCTION__", "__PRETTY_FUNCTION__", "__attribute__", "getter", "setter", "retain", "unsafe_unretained", "nonnull", "nullable", "null_unspecified", "null_resettable", "class", "instancetype", "NS_DESIGNATED_INITIALIZER", "NS_UNAVAILABLE", "NS_REQUIRES_SUPER", "NS_RETURNS_INNER_POINTER", "NS_INLINE", "NS_AVAILABLE", "NS_DEPRECATED", "NS_ENUM", "NS_OPTIONS", "NS_SWIFT_UNAVAILABLE", "NS_ASSUME_NONNULL_BEGIN", "NS_ASSUME_NONNULL_END", "NS_REFINED_FOR_SWIFT", "NS_SWIFT_NAME", "NS_SWIFT_NOTHROW", "NS_DURING", "NS_HANDLER", "NS_ENDHANDLER", "NS_VALUERETURN", "NS_VOIDRETURN"],
        literal: ["false", "true", "FALSE", "TRUE", "nil", "YES", "NO", "NULL"],
        built_in: ["dispatch_once_t", "dispatch_queue_t", "dispatch_sync", "dispatch_async", "dispatch_once"],
        type: ["int", "float", "char", "unsigned", "signed", "short", "long", "double", "wchar_t", "unichar", "void", "bool", "BOOL", "id|0", "_Bool"]
      },
      illegal: "</",
      contains: [{
        className: "built_in",
        begin: "\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
      }, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, t.C_NUMBER_MODE, t.QUOTE_STRING_MODE, t.APOS_STRING_MODE, {
        className: "string",
        variants: [{
          begin: '@"',
          end: '"',
          illegal: "\\n",
          contains: [t.BACKSLASH_ESCAPE]
        }]
      }, {
        className: "meta",
        begin: /#\s*[a-z]+\b/,
        end: /$/,
        keywords: {
          keyword: "if else elif endif define undef warning error line pragma ifdef ifndef include"
        },
        contains: [{ begin: /\\\n/, relevance: 0 }, t.inherit(t.QUOTE_STRING_MODE, {
          className: "string"
        }), {
          className: "string",
          begin: /<.*?>/,
          end: /$/,
          illegal: "\\n"
        }, t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE]
      }, {
        className: "class",
        begin: "(" + n.keyword.join("|") + ")\\b",
        end: /(\{|$)/,
        excludeEnd: !0,
        keywords: n,
        contains: [t.UNDERSCORE_TITLE_MODE]
      }, {
        begin: "\\." + t.UNDERSCORE_IDENT_RE,
        relevance: 0
      }]
    };
  },
  grmr_perl: (t) => {
    const e = t.regex, n = /[dualxmsipngr]{0,12}/, o = {
      $pattern: /[\w.]+/,
      keyword: "abs accept alarm and atan2 bind binmode bless break caller chdir chmod chomp chop chown chr chroot class close closedir connect continue cos crypt dbmclose dbmopen defined delete die do dump each else elsif endgrent endhostent endnetent endprotoent endpwent endservent eof eval exec exists exit exp fcntl field fileno flock for foreach fork format formline getc getgrent getgrgid getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr getnetbyname getnetent getpeername getpgrp getpriority getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid getservbyname getservbyport getservent getsockname getsockopt given glob gmtime goto grep gt hex if index int ioctl join keys kill last lc lcfirst length link listen local localtime log lstat lt ma map method mkdir msgctl msgget msgrcv msgsnd my ne next no not oct open opendir or ord our pack package pipe pop pos print printf prototype push q|0 qq quotemeta qw qx rand read readdir readline readlink readpipe recv redo ref rename require reset return reverse rewinddir rindex rmdir say scalar seek seekdir select semctl semget semop send setgrent sethostent setnetent setpgrp setpriority setprotoent setpwent setservent setsockopt shift shmctl shmget shmread shmwrite shutdown sin sleep socket socketpair sort splice split sprintf sqrt srand stat state study sub substr symlink syscall sysopen sysread sysseek system syswrite tell telldir tie tied time times tr truncate uc ucfirst umask undef unless unlink unpack unshift untie until use utime values vec wait waitpid wantarray warn when while write x|0 xor y|0"
    }, a = { className: "subst", begin: "[$@]\\{", end: "\\}", keywords: o }, r = {
      begin: /->\{/,
      end: /\}/
    }, i = { scope: "attr", match: /\s+:\s*\w+(\s*\(.*?\))?/ }, s = {
      scope: "variable",
      variants: [{ begin: /\$\d/ }, {
        begin: e.concat(/[$%@](?!")(\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/, "(?![A-Za-z])(?![@$%])")
      }, { begin: /[$%@](?!")[^\s\w{=]|\$=/, relevance: 0 }],
      contains: [i]
    }, l = {
      className: "number",
      variants: [{ match: /0?\.[0-9][0-9_]+\b/ }, {
        match: /\bv?(0|[1-9][0-9_]*(\.[0-9_]+)?|[1-9][0-9_]*)\b/
      }, {
        match: /\b0[0-7][0-7_]*\b/
      }, { match: /\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/ }, {
        match: /\b0b[0-1][0-1_]*\b/
      }],
      relevance: 0
    }, d = [t.BACKSLASH_ESCAPE, a, s], c = [/!/, /\//, /\|/, /\?/, /'/, /"/, /#/], b = (m, h, y = "\\1") => {
      const j = y === "\\1" ? y : e.concat(y, h);
      return e.concat(e.concat("(?:", m, ")"), h, /(?:\\.|[^\\\/])*?/, j, /(?:\\.|[^\\\/])*?/, y, n);
    }, u = (m, h, y) => e.concat(e.concat("(?:", m, ")"), h, /(?:\\.|[^\\\/])*?/, y, n), p = [s, t.HASH_COMMENT_MODE, t.COMMENT(/^=\w/, /=cut/, {
      endsWithParent: !0
    }), r, { className: "string", contains: d, variants: [{
      begin: "q[qwxr]?\\s*\\(",
      end: "\\)",
      relevance: 5
    }, {
      begin: "q[qwxr]?\\s*\\[",
      end: "\\]",
      relevance: 5
    }, { begin: "q[qwxr]?\\s*\\{", end: "\\}", relevance: 5 }, {
      begin: "q[qwxr]?\\s*\\|",
      end: "\\|",
      relevance: 5
    }, {
      begin: "q[qwxr]?\\s*<",
      end: ">",
      relevance: 5
    }, { begin: "qw\\s+q", end: "q", relevance: 5 }, {
      begin: "'",
      end: "'",
      contains: [t.BACKSLASH_ESCAPE]
    }, { begin: '"', end: '"' }, {
      begin: "`",
      end: "`",
      contains: [t.BACKSLASH_ESCAPE]
    }, { begin: /\{\w+\}/, relevance: 0 }, {
      begin: "-?\\w+\\s*=>",
      relevance: 0
    }] }, l, {
      begin: "(\\/\\/|" + t.RE_STARTERS_RE + "|\\b(split|return|print|reverse|grep)\\b)\\s*",
      keywords: "split return print reverse grep",
      relevance: 0,
      contains: [t.HASH_COMMENT_MODE, { className: "regexp", variants: [{
        begin: b("s|tr|y", e.either(...c, { capture: !0 }))
      }, { begin: b("s|tr|y", "\\(", "\\)") }, {
        begin: b("s|tr|y", "\\[", "\\]")
      }, { begin: b("s|tr|y", "\\{", "\\}") }], relevance: 2 }, {
        className: "regexp",
        variants: [{ begin: /(m|qr)\/\//, relevance: 0 }, {
          begin: u("(?:m|qr)?", /\//, /\//)
        }, { begin: u("m|qr", e.either(...c, {
          capture: !0
        }), /\1/) }, { begin: u("m|qr", /\(/, /\)/) }, { begin: u("m|qr", /\[/, /\]/) }, {
          begin: u("m|qr", /\{/, /\}/)
        }]
      }]
    }, {
      className: "function",
      beginKeywords: "sub method",
      end: "(\\s*\\(.*?\\))?[;{]",
      excludeEnd: !0,
      relevance: 5,
      contains: [t.TITLE_MODE, i]
    }, {
      className: "class",
      beginKeywords: "class",
      end: "[;{]",
      excludeEnd: !0,
      relevance: 5,
      contains: [t.TITLE_MODE, i, l]
    }, { begin: "-\\w\\b", relevance: 0 }, {
      begin: "^__DATA__$",
      end: "^__END__$",
      subLanguage: "mojolicious",
      contains: [{
        begin: "^@@.*",
        end: "$",
        className: "comment"
      }]
    }];
    return a.contains = p, r.contains = p, {
      name: "Perl",
      aliases: ["pl", "pm"],
      keywords: o,
      contains: p
    };
  },
  grmr_php: (t) => {
    const e = t.regex, n = /(?![A-Za-z0-9])(?![$])/, o = e.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/, n), a = e.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/, n), r = e.concat(/[A-Z]+/, n), i = {
      scope: "variable",
      match: "\\$+" + o
    }, s = { scope: "subst", variants: [{ begin: /\$\w+/ }, {
      begin: /\{\$/,
      end: /\}/
    }] }, l = t.inherit(t.APOS_STRING_MODE, {
      illegal: null
    }), d = `[ 	
]`, c = { scope: "string", variants: [t.inherit(t.QUOTE_STRING_MODE, {
      illegal: null,
      contains: t.QUOTE_STRING_MODE.contains.concat(s)
    }), l, {
      begin: /<<<[ \t]*(?:(\w+)|"(\w+)")\n/,
      end: /[ \t]*(\w+)\b/,
      contains: t.QUOTE_STRING_MODE.contains.concat(s),
      "on:begin": (A, N) => {
        N.data._beginMatch = A[1] || A[2];
      },
      "on:end": (A, N) => {
        N.data._beginMatch !== A[1] && N.ignoreMatch();
      }
    }, t.END_SAME_AS_BEGIN({
      begin: /<<<[ \t]*'(\w+)'\n/,
      end: /[ \t]*(\w+)\b/
    })] }, b = {
      scope: "number",
      variants: [{
        begin: "\\b0[bB][01]+(?:_[01]+)*\\b"
      }, { begin: "\\b0[oO][0-7]+(?:_[0-7]+)*\\b" }, {
        begin: "\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"
      }, {
        begin: "(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"
      }],
      relevance: 0
    }, u = ["false", "null", "true"], p = ["__CLASS__", "__DIR__", "__FILE__", "__FUNCTION__", "__COMPILER_HALT_OFFSET__", "__LINE__", "__METHOD__", "__NAMESPACE__", "__TRAIT__", "die", "echo", "exit", "include", "include_once", "print", "require", "require_once", "array", "abstract", "and", "as", "binary", "bool", "boolean", "break", "callable", "case", "catch", "class", "clone", "const", "continue", "declare", "default", "do", "double", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach", "endif", "endswitch", "endwhile", "enum", "eval", "extends", "final", "finally", "float", "for", "foreach", "from", "global", "goto", "if", "implements", "instanceof", "insteadof", "int", "integer", "interface", "isset", "iterable", "list", "match|0", "mixed", "new", "never", "object", "or", "private", "protected", "public", "readonly", "real", "return", "string", "switch", "throw", "trait", "try", "unset", "use", "var", "void", "while", "xor", "yield"], m = ["Error|0", "AppendIterator", "ArgumentCountError", "ArithmeticError", "ArrayIterator", "ArrayObject", "AssertionError", "BadFunctionCallException", "BadMethodCallException", "CachingIterator", "CallbackFilterIterator", "CompileError", "Countable", "DirectoryIterator", "DivisionByZeroError", "DomainException", "EmptyIterator", "ErrorException", "Exception", "FilesystemIterator", "FilterIterator", "GlobIterator", "InfiniteIterator", "InvalidArgumentException", "IteratorIterator", "LengthException", "LimitIterator", "LogicException", "MultipleIterator", "NoRewindIterator", "OutOfBoundsException", "OutOfRangeException", "OuterIterator", "OverflowException", "ParentIterator", "ParseError", "RangeException", "RecursiveArrayIterator", "RecursiveCachingIterator", "RecursiveCallbackFilterIterator", "RecursiveDirectoryIterator", "RecursiveFilterIterator", "RecursiveIterator", "RecursiveIteratorIterator", "RecursiveRegexIterator", "RecursiveTreeIterator", "RegexIterator", "RuntimeException", "SeekableIterator", "SplDoublyLinkedList", "SplFileInfo", "SplFileObject", "SplFixedArray", "SplHeap", "SplMaxHeap", "SplMinHeap", "SplObjectStorage", "SplObserver", "SplPriorityQueue", "SplQueue", "SplStack", "SplSubject", "SplTempFileObject", "TypeError", "UnderflowException", "UnexpectedValueException", "UnhandledMatchError", "ArrayAccess", "BackedEnum", "Closure", "Fiber", "Generator", "Iterator", "IteratorAggregate", "Serializable", "Stringable", "Throwable", "Traversable", "UnitEnum", "WeakReference", "WeakMap", "Directory", "__PHP_Incomplete_Class", "parent", "php_user_filter", "self", "static", "stdClass"], h = {
      keyword: p,
      literal: ((A) => {
        const N = [];
        return A.forEach((F) => {
          N.push(F), F.toLowerCase() === F ? N.push(F.toUpperCase()) : N.push(F.toLowerCase());
        }), N;
      })(u),
      built_in: m
    }, y = (A) => A.map((N) => N.replace(/\|\d+$/, "")), j = { variants: [{
      match: [/new/, e.concat(d, "+"), e.concat("(?!", y(m).join("\\b|"), "\\b)"), a],
      scope: {
        1: "keyword",
        4: "title.class"
      }
    }] }, B = e.concat(o, "\\b(?!\\()"), g = { variants: [{
      match: [e.concat(/::/, e.lookahead(/(?!class\b)/)), B],
      scope: {
        2: "variable.constant"
      }
    }, { match: [/::/, /class/], scope: { 2: "variable.language" } }, {
      match: [a, e.concat(/::/, e.lookahead(/(?!class\b)/)), B],
      scope: {
        1: "title.class",
        3: "variable.constant"
      }
    }, {
      match: [a, e.concat("::", e.lookahead(/(?!class\b)/))],
      scope: { 1: "title.class" }
    }, { match: [a, /::/, /class/], scope: {
      1: "title.class",
      3: "variable.language"
    } }] }, k = {
      scope: "attr",
      match: e.concat(o, e.lookahead(":"), e.lookahead(/(?!::)/))
    }, _ = {
      relevance: 0,
      begin: /\(/,
      end: /\)/,
      keywords: h,
      contains: [k, i, g, t.C_BLOCK_COMMENT_MODE, c, b, j]
    }, M = {
      relevance: 0,
      match: [/\b/, e.concat("(?!fn\\b|function\\b|", y(p).join("\\b|"), "|", y(m).join("\\b|"), "\\b)"), o, e.concat(d, "*"), e.lookahead(/(?=\()/)],
      scope: { 3: "title.function.invoke" },
      contains: [_]
    };
    _.contains.push(M);
    const C = [k, g, t.C_BLOCK_COMMENT_MODE, c, b, j], O = {
      begin: e.concat(/#\[\s*\\?/, e.either(a, r)),
      beginScope: "meta",
      end: /]/,
      endScope: "meta",
      keywords: { literal: u, keyword: ["new", "array"] },
      contains: [{
        begin: /\[/,
        end: /]/,
        keywords: { literal: u, keyword: ["new", "array"] },
        contains: ["self", ...C]
      }, ...C, { scope: "meta", variants: [{ match: a }, { match: r }] }]
    };
    return {
      case_insensitive: !1,
      keywords: h,
      contains: [O, t.HASH_COMMENT_MODE, t.COMMENT("//", "$"), t.COMMENT("/\\*", "\\*/", {
        contains: [{ scope: "doctag", match: "@[A-Za-z]+" }]
      }), {
        match: /__halt_compiler\(\);/,
        keywords: "__halt_compiler",
        starts: {
          scope: "comment",
          end: t.MATCH_NOTHING_RE,
          contains: [{ match: /\?>/, scope: "meta", endsParent: !0 }]
        }
      }, { scope: "meta", variants: [{
        begin: /<\?php/,
        relevance: 10
      }, { begin: /<\?=/ }, { begin: /<\?/, relevance: 0.1 }, {
        begin: /\?>/
      }] }, { scope: "variable.language", match: /\$this\b/ }, i, M, g, {
        match: [/const/, /\s/, o],
        scope: { 1: "keyword", 3: "variable.constant" }
      }, j, {
        scope: "function",
        relevance: 0,
        beginKeywords: "fn function",
        end: /[;{]/,
        excludeEnd: !0,
        illegal: "[$%\\[]",
        contains: [{
          beginKeywords: "use"
        }, t.UNDERSCORE_TITLE_MODE, { begin: "=>", endsParent: !0 }, {
          scope: "params",
          begin: "\\(",
          end: "\\)",
          excludeBegin: !0,
          excludeEnd: !0,
          keywords: h,
          contains: ["self", O, i, g, t.C_BLOCK_COMMENT_MODE, c, b]
        }]
      }, { scope: "class", variants: [{
        beginKeywords: "enum",
        illegal: /[($"]/
      }, {
        beginKeywords: "class interface trait",
        illegal: /[:($"]/
      }], relevance: 0, end: /\{/, excludeEnd: !0, contains: [{
        beginKeywords: "extends implements"
      }, t.UNDERSCORE_TITLE_MODE] }, {
        beginKeywords: "namespace",
        relevance: 0,
        end: ";",
        illegal: /[.']/,
        contains: [t.inherit(t.UNDERSCORE_TITLE_MODE, { scope: "title.class" })]
      }, {
        beginKeywords: "use",
        relevance: 0,
        end: ";",
        contains: [{
          match: /\b(as|const|function)\b/,
          scope: "keyword"
        }, t.UNDERSCORE_TITLE_MODE]
      }, c, b]
    };
  },
  grmr_php_template: (t) => ({ name: "PHP template", subLanguage: "xml", contains: [{
    begin: /<\?(php|=)?/,
    end: /\?>/,
    subLanguage: "php",
    contains: [{
      begin: "/\\*",
      end: "\\*/",
      skip: !0
    }, { begin: 'b"', end: '"', skip: !0 }, {
      begin: "b'",
      end: "'",
      skip: !0
    }, t.inherit(t.APOS_STRING_MODE, {
      illegal: null,
      className: null,
      contains: null,
      skip: !0
    }), t.inherit(t.QUOTE_STRING_MODE, {
      illegal: null,
      className: null,
      contains: null,
      skip: !0
    })]
  }] }),
  grmr_plaintext: (t) => ({
    name: "Plain text",
    aliases: ["text", "txt"],
    disableAutodetect: !0
  }),
  grmr_python: (t) => {
    const e = t.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), o = ["and", "as", "assert", "async", "await", "break", "case", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal|10", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"], a = {
      $pattern: /[A-Za-z]\w+|__\w+__/,
      keyword: o,
      built_in: ["__import__", "abs", "all", "any", "ascii", "bin", "bool", "breakpoint", "bytearray", "bytes", "callable", "chr", "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod", "enumerate", "eval", "exec", "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr", "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass", "iter", "len", "list", "locals", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "print", "property", "range", "repr", "reversed", "round", "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super", "tuple", "type", "vars", "zip"],
      literal: ["__debug__", "Ellipsis", "False", "None", "NotImplemented", "True"],
      type: ["Any", "Callable", "Coroutine", "Dict", "List", "Literal", "Generic", "Optional", "Sequence", "Set", "Tuple", "Type", "Union"]
    }, r = { className: "meta", begin: /^(>>>|\.\.\.) / }, i = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: a,
      illegal: /#/
    }, s = { begin: /\{\{/, relevance: 0 }, l = {
      className: "string",
      contains: [t.BACKSLASH_ESCAPE],
      variants: [{
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
        end: /'''/,
        contains: [t.BACKSLASH_ESCAPE, r],
        relevance: 10
      }, {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
        end: /"""/,
        contains: [t.BACKSLASH_ESCAPE, r],
        relevance: 10
      }, {
        begin: /([fF][rR]|[rR][fF]|[fF])'''/,
        end: /'''/,
        contains: [t.BACKSLASH_ESCAPE, r, s, i]
      }, {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [t.BACKSLASH_ESCAPE, r, s, i]
      }, {
        begin: /([uU]|[rR])'/,
        end: /'/,
        relevance: 10
      }, { begin: /([uU]|[rR])"/, end: /"/, relevance: 10 }, {
        begin: /([bB]|[bB][rR]|[rR][bB])'/,
        end: /'/
      }, {
        begin: /([bB]|[bB][rR]|[rR][bB])"/,
        end: /"/
      }, {
        begin: /([fF][rR]|[rR][fF]|[fF])'/,
        end: /'/,
        contains: [t.BACKSLASH_ESCAPE, s, i]
      }, {
        begin: /([fF][rR]|[rR][fF]|[fF])"/,
        end: /"/,
        contains: [t.BACKSLASH_ESCAPE, s, i]
      }, t.APOS_STRING_MODE, t.QUOTE_STRING_MODE]
    }, d = "[0-9](_?[0-9])*", c = `(\\b(${d}))?\\.(${d})|\\b(${d})\\.`, b = "\\b|" + o.join("|"), u = {
      className: "number",
      relevance: 0,
      variants: [{
        begin: `(\\b(${d})|(${c}))[eE][+-]?(${d})[jJ]?(?=${b})`
      }, { begin: `(${c})[jJ]?` }, {
        begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${b})`
      }, {
        begin: `\\b0[bB](_?[01])+[lL]?(?=${b})`
      }, {
        begin: `\\b0[oO](_?[0-7])+[lL]?(?=${b})`
      }, { begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${b})` }, {
        begin: `\\b(${d})[jJ](?=${b})`
      }]
    }, p = {
      className: "comment",
      begin: e.lookahead(/# type:/),
      end: /$/,
      keywords: a,
      contains: [{ begin: /# type:/ }, { begin: /#/, end: /\b\B/, endsWithParent: !0 }]
    }, m = {
      className: "params",
      variants: [{ className: "", begin: /\(\s*\)/, skip: !0 }, {
        begin: /\(/,
        end: /\)/,
        excludeBegin: !0,
        excludeEnd: !0,
        keywords: a,
        contains: ["self", r, u, l, t.HASH_COMMENT_MODE]
      }]
    };
    return i.contains = [l, u, r], {
      name: "Python",
      aliases: ["py", "gyp", "ipython"],
      unicodeRegex: !0,
      keywords: a,
      illegal: /(<\/|\?)|=>/,
      contains: [r, u, {
        scope: "variable.language",
        match: /\bself\b/
      }, { beginKeywords: "if", relevance: 0 }, {
        match: /\bor\b/,
        scope: "keyword"
      }, l, p, t.HASH_COMMENT_MODE, { match: [/\bdef/, /\s+/, n], scope: {
        1: "keyword",
        3: "title.function"
      }, contains: [m] }, {
        variants: [{
          match: [/\bclass/, /\s+/, n, /\s*/, /\(\s*/, n, /\s*\)/]
        }, { match: [/\bclass/, /\s+/, n] }],
        scope: { 1: "keyword", 3: "title.class", 6: "title.class.inherited" }
      }, {
        className: "meta",
        begin: /^[\t ]*@/,
        end: /(?=#)|$/,
        contains: [u, m, l]
      }]
    };
  },
  grmr_python_repl: (t) => ({ aliases: ["pycon"], contains: [{
    className: "meta.prompt",
    starts: { end: / |$/, starts: { end: "$", subLanguage: "python" } },
    variants: [{
      begin: /^>>>(?=[ ]|$)/
    }, { begin: /^\.\.\.(?=[ ]|$)/ }]
  }] }),
  grmr_r: (t) => {
    const e = t.regex, n = /(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/, o = e.either(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/, /0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/, /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/), a = /[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/, r = e.either(/[()]/, /[{}]/, /\[\[/, /[[\]]/, /\\/, /,/);
    return { name: "R", keywords: {
      $pattern: n,
      keyword: "function if in break next repeat else for while",
      literal: "NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
      built_in: "LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
    }, contains: [t.COMMENT(/#'/, /$/, {
      contains: [{
        scope: "doctag",
        match: /@examples/,
        starts: {
          end: e.lookahead(e.either(/\n^#'\s*(?=@[a-zA-Z]+)/, /\n^(?!#')/)),
          endsParent: !0
        }
      }, { scope: "doctag", begin: "@param", end: /$/, contains: [{
        scope: "variable",
        variants: [{ match: n }, { match: /`(?:\\.|[^`\\])+`/ }],
        endsParent: !0
      }] }, { scope: "doctag", match: /@[a-zA-Z]+/ }, { scope: "keyword", match: /\\[a-zA-Z]+/ }]
    }), t.HASH_COMMENT_MODE, {
      scope: "string",
      contains: [t.BACKSLASH_ESCAPE],
      variants: [t.END_SAME_AS_BEGIN({
        begin: /[rR]"(-*)\(/,
        end: /\)(-*)"/
      }), t.END_SAME_AS_BEGIN({
        begin: /[rR]"(-*)\{/,
        end: /\}(-*)"/
      }), t.END_SAME_AS_BEGIN({
        begin: /[rR]"(-*)\[/,
        end: /\](-*)"/
      }), t.END_SAME_AS_BEGIN({
        begin: /[rR]'(-*)\(/,
        end: /\)(-*)'/
      }), t.END_SAME_AS_BEGIN({
        begin: /[rR]'(-*)\{/,
        end: /\}(-*)'/
      }), t.END_SAME_AS_BEGIN({ begin: /[rR]'(-*)\[/, end: /\](-*)'/ }), {
        begin: '"',
        end: '"',
        relevance: 0
      }, { begin: "'", end: "'", relevance: 0 }]
    }, { relevance: 0, variants: [{ scope: {
      1: "operator",
      2: "number"
    }, match: [a, o] }, {
      scope: { 1: "operator", 2: "number" },
      match: [/%[^%]*%/, o]
    }, { scope: { 1: "punctuation", 2: "number" }, match: [r, o] }, { scope: {
      2: "number"
    }, match: [/[^a-zA-Z0-9._]|^/, o] }] }, {
      scope: { 3: "operator" },
      match: [n, /\s+/, /<-/, /\s+/]
    }, { scope: "operator", relevance: 0, variants: [{ match: a }, {
      match: /%[^%]*%/
    }] }, { scope: "punctuation", relevance: 0, match: r }, {
      begin: "`",
      end: "`",
      contains: [{ begin: /\\./ }]
    }] };
  },
  grmr_ruby: (t) => {
    const e = t.regex, n = "([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)", o = e.either(/\b([A-Z]+[a-z0-9]+)+/, /\b([A-Z]+[a-z0-9]+)+[A-Z]+/), a = e.concat(o, /(::\w+)*/), r = {
      "variable.constant": ["__FILE__", "__LINE__", "__ENCODING__"],
      "variable.language": ["self", "super"],
      keyword: ["alias", "and", "begin", "BEGIN", "break", "case", "class", "defined", "do", "else", "elsif", "end", "END", "ensure", "for", "if", "in", "module", "next", "not", "or", "redo", "require", "rescue", "retry", "return", "then", "undef", "unless", "until", "when", "while", "yield", "include", "extend", "prepend", "public", "private", "protected", "raise", "throw"],
      built_in: ["proc", "lambda", "attr_accessor", "attr_reader", "attr_writer", "define_method", "private_constant", "module_function"],
      literal: ["true", "false", "nil"]
    }, i = { className: "doctag", begin: "@[A-Za-z]+" }, s = {
      begin: "#<",
      end: ">"
    }, l = [t.COMMENT("#", "$", {
      contains: [i]
    }), t.COMMENT("^=begin", "^=end", {
      contains: [i],
      relevance: 10
    }), t.COMMENT("^__END__", t.MATCH_NOTHING_RE)], d = {
      className: "subst",
      begin: /#\{/,
      end: /\}/,
      keywords: r
    }, c = {
      className: "string",
      contains: [t.BACKSLASH_ESCAPE, d],
      variants: [{ begin: /'/, end: /'/ }, { begin: /"/, end: /"/ }, { begin: /`/, end: /`/ }, {
        begin: /%[qQwWx]?\(/,
        end: /\)/
      }, { begin: /%[qQwWx]?\[/, end: /\]/ }, {
        begin: /%[qQwWx]?\{/,
        end: /\}/
      }, { begin: /%[qQwWx]?</, end: />/ }, {
        begin: /%[qQwWx]?\//,
        end: /\//
      }, { begin: /%[qQwWx]?%/, end: /%/ }, { begin: /%[qQwWx]?-/, end: /-/ }, {
        begin: /%[qQwWx]?\|/,
        end: /\|/
      }, { begin: /\B\?(\\\d{1,3})/ }, {
        begin: /\B\?(\\x[A-Fa-f0-9]{1,2})/
      }, { begin: /\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/ }, {
        begin: /\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/
      }, {
        begin: /\B\?\\(c|C-)[\x20-\x7e]/
      }, { begin: /\B\?\\?\S/ }, {
        begin: e.concat(/<<[-~]?'?/, e.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
        contains: [t.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          contains: [t.BACKSLASH_ESCAPE, d]
        })]
      }]
    }, b = "[0-9](_?[0-9])*", u = {
      className: "number",
      relevance: 0,
      variants: [{
        begin: `\\b([1-9](_?[0-9])*|0)(\\.(${b}))?([eE][+-]?(${b})|r)?i?\\b`
      }, {
        begin: "\\b0[dD][0-9](_?[0-9])*r?i?\\b"
      }, {
        begin: "\\b0[bB][0-1](_?[0-1])*r?i?\\b"
      }, { begin: "\\b0[oO][0-7](_?[0-7])*r?i?\\b" }, {
        begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"
      }, {
        begin: "\\b0(_?[0-7])+r?i?\\b"
      }]
    }, p = { variants: [{ match: /\(\)/ }, {
      className: "params",
      begin: /\(/,
      end: /(?=\))/,
      excludeBegin: !0,
      endsParent: !0,
      keywords: r
    }] }, m = [c, { variants: [{ match: [/class\s+/, a, /\s+<\s+/, a] }, {
      match: [/\b(class|module)\s+/, a]
    }], scope: {
      2: "title.class",
      4: "title.class.inherited"
    }, keywords: r }, { match: [/(include|extend)\s+/, a], scope: {
      2: "title.class"
    }, keywords: r }, { relevance: 0, match: [a, /\.new[. (]/], scope: {
      1: "title.class"
    } }, {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    }, { relevance: 0, match: o, scope: "title.class" }, {
      match: [/def/, /\s+/, n],
      scope: { 1: "keyword", 3: "title.function" },
      contains: [p]
    }, {
      begin: t.IDENT_RE + "::"
    }, {
      className: "symbol",
      begin: t.UNDERSCORE_IDENT_RE + "(!|\\?)?:",
      relevance: 0
    }, {
      className: "symbol",
      begin: ":(?!\\s)",
      contains: [c, { begin: n }],
      relevance: 0
    }, u, {
      className: "variable",
      begin: "(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"
    }, {
      className: "params",
      begin: /\|(?!=)/,
      end: /\|/,
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0,
      keywords: r
    }, {
      begin: "(" + t.RE_STARTERS_RE + "|unless)\\s*",
      keywords: "unless",
      contains: [{
        className: "regexp",
        contains: [t.BACKSLASH_ESCAPE, d],
        illegal: /\n/,
        variants: [{ begin: "/", end: "/[a-z]*" }, { begin: /%r\{/, end: /\}[a-z]*/ }, {
          begin: "%r\\(",
          end: "\\)[a-z]*"
        }, { begin: "%r!", end: "![a-z]*" }, {
          begin: "%r\\[",
          end: "\\][a-z]*"
        }]
      }].concat(s, l),
      relevance: 0
    }].concat(s, l);
    d.contains = m, p.contains = m;
    const h = [{
      begin: /^\s*=>/,
      starts: { end: "$", contains: m }
    }, {
      className: "meta.prompt",
      begin: "^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
      starts: { end: "$", keywords: r, contains: m }
    }];
    return l.unshift(s), {
      name: "Ruby",
      aliases: ["rb", "gemspec", "podspec", "thor", "irb"],
      keywords: r,
      illegal: /\/\*/,
      contains: [t.SHEBANG({ binary: "ruby" })].concat(h).concat(l).concat(m)
    };
  },
  grmr_rust: (t) => {
    const e = t.regex, n = /(r#)?/, o = e.concat(n, t.UNDERSCORE_IDENT_RE), a = e.concat(n, t.IDENT_RE), r = {
      className: "title.function.invoke",
      relevance: 0,
      begin: e.concat(/\b/, /(?!let|for|while|if|else|match\b)/, a, e.lookahead(/\s*\(/))
    }, i = "([ui](8|16|32|64|128|size)|f(32|64))?", s = ["drop ", "Copy", "Send", "Sized", "Sync", "Drop", "Fn", "FnMut", "FnOnce", "ToOwned", "Clone", "Debug", "PartialEq", "PartialOrd", "Eq", "Ord", "AsRef", "AsMut", "Into", "From", "Default", "Iterator", "Extend", "IntoIterator", "DoubleEndedIterator", "ExactSizeIterator", "SliceConcatExt", "ToString", "assert!", "assert_eq!", "bitflags!", "bytes!", "cfg!", "col!", "concat!", "concat_idents!", "debug_assert!", "debug_assert_eq!", "env!", "eprintln!", "panic!", "file!", "format!", "format_args!", "include_bytes!", "include_str!", "line!", "local_data_key!", "module_path!", "option_env!", "print!", "println!", "select!", "stringify!", "try!", "unimplemented!", "unreachable!", "vec!", "write!", "writeln!", "macro_rules!", "assert_ne!", "debug_assert_ne!"], l = ["i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize", "f32", "f64", "str", "char", "bool", "Box", "Option", "Result", "String", "Vec"];
    return {
      name: "Rust",
      aliases: ["rs"],
      keywords: {
        $pattern: t.IDENT_RE + "!?",
        type: l,
        keyword: ["abstract", "as", "async", "await", "become", "box", "break", "const", "continue", "crate", "do", "dyn", "else", "enum", "extern", "false", "final", "fn", "for", "if", "impl", "in", "let", "loop", "macro", "match", "mod", "move", "mut", "override", "priv", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "try", "type", "typeof", "union", "unsafe", "unsized", "use", "virtual", "where", "while", "yield"],
        literal: ["true", "false", "Some", "None", "Ok", "Err"],
        built_in: s
      },
      illegal: "</",
      contains: [t.C_LINE_COMMENT_MODE, t.COMMENT("/\\*", "\\*/", {
        contains: ["self"]
      }), t.inherit(t.QUOTE_STRING_MODE, { begin: /b?"/, illegal: null }), {
        className: "symbol",
        begin: /'[a-zA-Z_][a-zA-Z0-9_]*(?!')/
      }, {
        scope: "string",
        variants: [{ begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ }, { begin: /b?'/, end: /'/, contains: [{
          scope: "char.escape",
          match: /\\('|\w|x\w{2}|u\w{4}|U\w{8})/
        }] }]
      }, {
        className: "number",
        variants: [{ begin: "\\b0b([01_]+)" + i }, {
          begin: "\\b0o([0-7_]+)" + i
        }, { begin: "\\b0x([A-Fa-f0-9_]+)" + i }, {
          begin: "\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)" + i
        }],
        relevance: 0
      }, {
        begin: [/fn/, /\s+/, o],
        className: { 1: "keyword", 3: "title.function" }
      }, {
        className: "meta",
        begin: "#!?\\[",
        end: "\\]",
        contains: [{
          className: "string",
          begin: /"/,
          end: /"/,
          contains: [t.BACKSLASH_ESCAPE]
        }]
      }, {
        begin: [/let/, /\s+/, /(?:mut\s+)?/, o],
        className: {
          1: "keyword",
          3: "keyword",
          4: "variable"
        }
      }, { begin: [/for/, /\s+/, o, /\s+/, /in/], className: {
        1: "keyword",
        3: "variable",
        5: "keyword"
      } }, { begin: [/type/, /\s+/, o], className: {
        1: "keyword",
        3: "title.class"
      } }, {
        begin: [/(?:trait|enum|struct|union|impl|for)/, /\s+/, o],
        className: { 1: "keyword", 3: "title.class" }
      }, { begin: t.IDENT_RE + "::", keywords: {
        keyword: "Self",
        built_in: s,
        type: l
      } }, { className: "punctuation", begin: "->" }, r]
    };
  },
  grmr_scss: (t) => {
    const e = Ze(t), n = Me, o = Se, a = "@[a-z-]+", r = {
      className: "variable",
      begin: "(\\$[a-zA-Z-][a-zA-Z0-9_-]*)\\b",
      relevance: 0
    };
    return {
      name: "SCSS",
      case_insensitive: !0,
      illegal: "[=/|']",
      contains: [t.C_LINE_COMMENT_MODE, t.C_BLOCK_COMMENT_MODE, e.CSS_NUMBER_MODE, {
        className: "selector-id",
        begin: "#[A-Za-z0-9_-]+",
        relevance: 0
      }, {
        className: "selector-class",
        begin: "\\.[A-Za-z0-9_-]+",
        relevance: 0
      }, e.ATTRIBUTE_SELECTOR_MODE, {
        className: "selector-tag",
        begin: "\\b(" + Ge.join("|") + ")\\b",
        relevance: 0
      }, {
        className: "selector-pseudo",
        begin: ":(" + o.join("|") + ")"
      }, {
        className: "selector-pseudo",
        begin: ":(:)?(" + n.join("|") + ")"
      }, r, {
        begin: /\(/,
        end: /\)/,
        contains: [e.CSS_NUMBER_MODE]
      }, e.CSS_VARIABLE, {
        className: "attribute",
        begin: "\\b(" + Qe.join("|") + ")\\b"
      }, {
        begin: "\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b"
      }, {
        begin: /:/,
        end: /[;}{]/,
        relevance: 0,
        contains: [e.BLOCK_COMMENT, r, e.HEXCOLOR, e.CSS_NUMBER_MODE, t.QUOTE_STRING_MODE, t.APOS_STRING_MODE, e.IMPORTANT, e.FUNCTION_DISPATCH]
      }, { begin: "@(page|font-face)", keywords: { $pattern: a, keyword: "@page @font-face" } }, {
        begin: "@",
        end: "[{;]",
        returnBegin: !0,
        keywords: {
          $pattern: /[a-z-]+/,
          keyword: "and or not only",
          attribute: We.join(" ")
        },
        contains: [{
          begin: a,
          className: "keyword"
        }, {
          begin: /[a-z-]+(?=:)/,
          className: "attribute"
        }, r, t.QUOTE_STRING_MODE, t.APOS_STRING_MODE, e.HEXCOLOR, e.CSS_NUMBER_MODE]
      }, e.FUNCTION_DISPATCH]
    };
  },
  grmr_shell: (t) => ({
    name: "Shell Session",
    aliases: ["console", "shellsession"],
    contains: [{
      className: "meta.prompt",
      begin: /^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,
      starts: {
        end: /[^\\](?=\s*$)/,
        subLanguage: "bash"
      }
    }]
  }),
  grmr_sql: (t) => {
    const e = t.regex, n = t.COMMENT("--", "$"), o = ["abs", "acos", "array_agg", "asin", "atan", "avg", "cast", "ceil", "ceiling", "coalesce", "corr", "cos", "cosh", "count", "covar_pop", "covar_samp", "cume_dist", "dense_rank", "deref", "element", "exp", "extract", "first_value", "floor", "json_array", "json_arrayagg", "json_exists", "json_object", "json_objectagg", "json_query", "json_table", "json_table_primitive", "json_value", "lag", "last_value", "lead", "listagg", "ln", "log", "log10", "lower", "max", "min", "mod", "nth_value", "ntile", "nullif", "percent_rank", "percentile_cont", "percentile_disc", "position", "position_regex", "power", "rank", "regr_avgx", "regr_avgy", "regr_count", "regr_intercept", "regr_r2", "regr_slope", "regr_sxx", "regr_sxy", "regr_syy", "row_number", "sin", "sinh", "sqrt", "stddev_pop", "stddev_samp", "substring", "substring_regex", "sum", "tan", "tanh", "translate", "translate_regex", "treat", "trim", "trim_array", "unnest", "upper", "value_of", "var_pop", "var_samp", "width_bucket"], a = o, r = ["abs", "acos", "all", "allocate", "alter", "and", "any", "are", "array", "array_agg", "array_max_cardinality", "as", "asensitive", "asin", "asymmetric", "at", "atan", "atomic", "authorization", "avg", "begin", "begin_frame", "begin_partition", "between", "bigint", "binary", "blob", "boolean", "both", "by", "call", "called", "cardinality", "cascaded", "case", "cast", "ceil", "ceiling", "char", "char_length", "character", "character_length", "check", "classifier", "clob", "close", "coalesce", "collate", "collect", "column", "commit", "condition", "connect", "constraint", "contains", "convert", "copy", "corr", "corresponding", "cos", "cosh", "count", "covar_pop", "covar_samp", "create", "cross", "cube", "cume_dist", "current", "current_catalog", "current_date", "current_default_transform_group", "current_path", "current_role", "current_row", "current_schema", "current_time", "current_timestamp", "current_path", "current_role", "current_transform_group_for_type", "current_user", "cursor", "cycle", "date", "day", "deallocate", "dec", "decimal", "decfloat", "declare", "default", "define", "delete", "dense_rank", "deref", "describe", "deterministic", "disconnect", "distinct", "double", "drop", "dynamic", "each", "element", "else", "empty", "end", "end_frame", "end_partition", "end-exec", "equals", "escape", "every", "except", "exec", "execute", "exists", "exp", "external", "extract", "false", "fetch", "filter", "first_value", "float", "floor", "for", "foreign", "frame_row", "free", "from", "full", "function", "fusion", "get", "global", "grant", "group", "grouping", "groups", "having", "hold", "hour", "identity", "in", "indicator", "initial", "inner", "inout", "insensitive", "insert", "int", "integer", "intersect", "intersection", "interval", "into", "is", "join", "json_array", "json_arrayagg", "json_exists", "json_object", "json_objectagg", "json_query", "json_table", "json_table_primitive", "json_value", "lag", "language", "large", "last_value", "lateral", "lead", "leading", "left", "like", "like_regex", "listagg", "ln", "local", "localtime", "localtimestamp", "log", "log10", "lower", "match", "match_number", "match_recognize", "matches", "max", "member", "merge", "method", "min", "minute", "mod", "modifies", "module", "month", "multiset", "national", "natural", "nchar", "nclob", "new", "no", "none", "normalize", "not", "nth_value", "ntile", "null", "nullif", "numeric", "octet_length", "occurrences_regex", "of", "offset", "old", "omit", "on", "one", "only", "open", "or", "order", "out", "outer", "over", "overlaps", "overlay", "parameter", "partition", "pattern", "per", "percent", "percent_rank", "percentile_cont", "percentile_disc", "period", "portion", "position", "position_regex", "power", "precedes", "precision", "prepare", "primary", "procedure", "ptf", "range", "rank", "reads", "real", "recursive", "ref", "references", "referencing", "regr_avgx", "regr_avgy", "regr_count", "regr_intercept", "regr_r2", "regr_slope", "regr_sxx", "regr_sxy", "regr_syy", "release", "result", "return", "returns", "revoke", "right", "rollback", "rollup", "row", "row_number", "rows", "running", "savepoint", "scope", "scroll", "search", "second", "seek", "select", "sensitive", "session_user", "set", "show", "similar", "sin", "sinh", "skip", "smallint", "some", "specific", "specifictype", "sql", "sqlexception", "sqlstate", "sqlwarning", "sqrt", "start", "static", "stddev_pop", "stddev_samp", "submultiset", "subset", "substring", "substring_regex", "succeeds", "sum", "symmetric", "system", "system_time", "system_user", "table", "tablesample", "tan", "tanh", "then", "time", "timestamp", "timezone_hour", "timezone_minute", "to", "trailing", "translate", "translate_regex", "translation", "treat", "trigger", "trim", "trim_array", "true", "truncate", "uescape", "union", "unique", "unknown", "unnest", "update", "upper", "user", "using", "value", "values", "value_of", "var_pop", "var_samp", "varbinary", "varchar", "varying", "versioning", "when", "whenever", "where", "width_bucket", "window", "with", "within", "without", "year", "add", "asc", "collation", "desc", "final", "first", "last", "view"].filter((d) => !o.includes(d)), i = {
      match: e.concat(/\b/, e.either(...a), /\s*\(/),
      relevance: 0,
      keywords: { built_in: a }
    };
    function s(d) {
      return e.concat(/\b/, e.either(...d.map((c) => c.replace(/\s+/, "\\s+"))), /\b/);
    }
    const l = {
      scope: "keyword",
      match: s(["create table", "insert into", "primary key", "foreign key", "not null", "alter table", "add constraint", "grouping sets", "on overflow", "character set", "respect nulls", "ignore nulls", "nulls first", "nulls last", "depth first", "breadth first"]),
      relevance: 0
    };
    return { name: "SQL", case_insensitive: !0, illegal: /[{}]|<\//, keywords: {
      $pattern: /\b[\w\.]+/,
      keyword: ((d, { exceptions: c, when: b } = {}) => {
        const u = b;
        return c = c || [], d.map((p) => p.match(/\|\d+$/) || c.includes(p) ? p : u(p) ? p + "|0" : p);
      })(r, { when: (d) => d.length < 3 }),
      literal: ["true", "false", "unknown"],
      type: ["bigint", "binary", "blob", "boolean", "char", "character", "clob", "date", "dec", "decfloat", "decimal", "float", "int", "integer", "interval", "nchar", "nclob", "national", "numeric", "real", "row", "smallint", "time", "timestamp", "varchar", "varying", "varbinary"],
      built_in: ["current_catalog", "current_date", "current_default_transform_group", "current_path", "current_role", "current_schema", "current_transform_group_for_type", "current_user", "session_user", "system_time", "system_user", "current_time", "localtime", "current_timestamp", "localtimestamp"]
    }, contains: [{
      scope: "type",
      match: s(["double precision", "large object", "with timezone", "without timezone"])
    }, l, i, { scope: "variable", match: /@[a-z0-9][a-z0-9_]*/ }, { scope: "string", variants: [{
      begin: /'/,
      end: /'/,
      contains: [{ match: /''/ }]
    }] }, { begin: /"/, end: /"/, contains: [{
      match: /""/
    }] }, t.C_NUMBER_MODE, t.C_BLOCK_COMMENT_MODE, n, {
      scope: "operator",
      match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
      relevance: 0
    }] };
  },
  grmr_swift: (t) => {
    const e = { match: /\s+/, relevance: 0 }, n = t.COMMENT("/\\*", "\\*/", {
      contains: ["self"]
    }), o = [t.C_LINE_COMMENT_MODE, n], a = {
      match: [/\./, P(...ir, ...Pt)],
      className: { 2: "keyword" }
    }, r = {
      match: E(/\./, P(...Ve)),
      relevance: 0
    }, i = Ve.filter((v) => typeof v == "string").concat(["_|0"]), s = { variants: [{
      className: "keyword",
      match: P(...Ve.filter((v) => typeof v != "string").concat(sr).map(bt), ...Pt)
    }] }, l = {
      $pattern: P(/\b\w+/, /#\w+/),
      keyword: i.concat(cr),
      literal: Ut
    }, d = [a, r, s], c = [{
      match: E(/\./, P(...qt)),
      relevance: 0
    }, {
      className: "built_in",
      match: E(/\b/, P(...qt), /(?=\()/)
    }], b = { match: /->/, relevance: 0 }, u = [b, {
      className: "operator",
      relevance: 0,
      variants: [{ match: Je }, { match: `\\.(\\.|${En})+` }]
    }], p = "([0-9]_*)+", m = "([0-9a-fA-F]_*)+", h = {
      className: "number",
      relevance: 0,
      variants: [{ match: `\\b(${p})(\\.(${p}))?([eE][+-]?(${p}))?\\b` }, {
        match: `\\b0x(${m})(\\.(${m}))?([pP][+-]?(${p}))?\\b`
      }, {
        match: /\b0o([0-7]_*)+\b/
      }, { match: /\b0b([01]_*)+\b/ }]
    }, y = (v = "") => ({
      className: "subst",
      variants: [{
        match: E(/\\/, v, /[0\\tnr"']/)
      }, { match: E(/\\/, v, /u\{[0-9a-fA-F]{1,8}\}/) }]
    }), j = (v = "") => ({
      className: "subst",
      match: E(/\\/, v, /[\t ]*(?:[\r\n]|\r\n)/)
    }), B = (v = "") => ({
      className: "subst",
      label: "interpol",
      begin: E(/\\/, v, /\(/),
      end: /\)/
    }), g = (v = "") => ({
      begin: E(v, /"""/),
      end: E(/"""/, v),
      contains: [y(v), j(v), B(v)]
    }), k = (v = "") => ({ begin: E(v, /"/), end: E(/"/, v), contains: [y(v), B(v)] }), _ = {
      className: "string",
      variants: [g(), g("#"), g("##"), g("###"), k(), k("#"), k("##"), k("###")]
    }, M = [t.BACKSLASH_ESCAPE, {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [t.BACKSLASH_ESCAPE]
    }], C = {
      begin: /\/[^\s](?=[^/\n]*\/)/,
      end: /\//,
      contains: M
    }, O = (v) => {
      const S = E(v, /\//), Q = E(/\//, v);
      return {
        begin: S,
        end: Q,
        contains: [...M, { scope: "comment", begin: `#(?!.*${Q})`, end: /$/ }]
      };
    }, A = {
      scope: "regexp",
      variants: [O("###"), O("##"), O("#"), C]
    }, N = {
      match: E(/`/, V, /`/)
    }, F = [N, { className: "variable", match: /\$\d+/ }, {
      className: "variable",
      match: `\\$${ze}+`
    }], L = [{ match: /(@|#(un)?)available/, scope: "keyword", starts: {
      contains: [{ begin: /\(/, end: /\)/, keywords: ur, contains: [...u, h, _] }]
    } }, {
      scope: "keyword",
      match: E(/@/, P(...dr), se(P(/\(/, /\s+/)))
    }, {
      scope: "meta",
      match: E(/@/, V)
    }], K = { match: se(/\b[A-Z]/), relevance: 0, contains: [{
      className: "type",
      match: E(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, ze, "+")
    }, { className: "type", match: Ae, relevance: 0 }, { match: /[?!]+/, relevance: 0 }, {
      match: /\.\.\./,
      relevance: 0
    }, { match: E(/\s+&\s+/, se(Ae)), relevance: 0 }] }, re = {
      begin: /</,
      end: />/,
      keywords: l,
      contains: [...o, ...d, ...L, b, K]
    };
    K.contains.push(re);
    const ee = { begin: /\(/, end: /\)/, relevance: 0, keywords: l, contains: ["self", {
      match: E(V, /\s*:/),
      keywords: "_|0",
      relevance: 0
    }, ...o, A, ...d, ...c, ...u, h, _, ...F, ...L, K] }, Z = {
      begin: /</,
      end: />/,
      keywords: "repeat each",
      contains: [...o, K]
    }, te = {
      begin: /\(/,
      end: /\)/,
      keywords: l,
      contains: [{
        begin: P(se(E(V, /\s*:/)), se(E(V, /\s+/, V, /\s*:/))),
        end: /:/,
        relevance: 0,
        contains: [{ className: "keyword", match: /\b_\b/ }, {
          className: "params",
          match: V
        }]
      }, ...o, ...d, ...u, h, _, ...L, K, ee],
      endsParent: !0,
      illegal: /["']/
    }, H = {
      match: [/(func|macro)/, /\s+/, P(N.match, V, Je)],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [Z, te, e],
      illegal: [/\[/, /%/]
    }, pe = {
      match: [/\b(?:subscript|init[?!]?)/, /\s*(?=[<(])/],
      className: { 1: "keyword" },
      contains: [Z, te, e],
      illegal: /\[|%/
    }, ae = { match: [/operator/, /\s+/, Je], className: {
      1: "keyword",
      3: "title"
    } }, x = { begin: [/precedencegroup/, /\s+/, Ae], className: {
      1: "keyword",
      3: "title"
    }, contains: [K], keywords: [...lr, ...Ut], end: /}/ }, _e = {
      begin: [/(struct|protocol|class|extension|enum|actor)/, /\s+/, V, /\s*/],
      beginScope: { 1: "keyword", 3: "title.class" },
      keywords: l,
      contains: [Z, ...d, {
        begin: /:/,
        end: /\{/,
        keywords: l,
        contains: [{ scope: "title.class.inherited", match: Ae }, ...d],
        relevance: 0
      }]
    };
    for (const v of _.variants) {
      const S = v.contains.find((J) => J.label === "interpol");
      S.keywords = l;
      const Q = [...d, ...c, ...u, h, _, ...F];
      S.contains = [...Q, {
        begin: /\(/,
        end: /\)/,
        contains: ["self", ...Q]
      }];
    }
    return { name: "Swift", keywords: l, contains: [...o, H, pe, {
      match: [/class\b/, /\s+/, /func\b/, /\s+/, /\b[A-Za-z_][A-Za-z0-9_]*\b/],
      scope: {
        1: "keyword",
        3: "keyword",
        5: "title.function"
      }
    }, {
      match: [/class\b/, /\s+/, /var\b/],
      scope: { 1: "keyword", 3: "keyword" }
    }, _e, ae, x, {
      beginKeywords: "import",
      end: /$/,
      contains: [...o],
      relevance: 0
    }, A, ...d, ...c, ...u, h, _, ...F, ...L, K, ee] };
  },
  grmr_typescript: (t) => {
    const e = t.regex, n = jt(t), o = $e, a = ["any", "void", "number", "boolean", "string", "object", "never", "symbol", "bigint", "unknown"], r = {
      begin: [/namespace/, /\s+/, t.IDENT_RE],
      beginScope: { 1: "keyword", 3: "title.class" }
    }, i = {
      beginKeywords: "interface",
      end: /\{/,
      excludeEnd: !0,
      keywords: {
        keyword: "interface extends",
        built_in: a
      },
      contains: [n.exports.CLASS_REFERENCE]
    }, s = {
      $pattern: $e,
      keyword: hn.concat(["type", "interface", "public", "private", "protected", "implements", "declare", "abstract", "readonly", "enum", "override", "satisfies"]),
      literal: fn,
      built_in: xn.concat(a),
      "variable.language": _n
    }, l = {
      className: "meta",
      begin: "@" + o
    }, d = (u, p, m) => {
      const h = u.contains.findIndex((y) => y.label === p);
      if (h === -1) throw Error("can not find mode to replace");
      u.contains.splice(h, 1, m);
    };
    Object.assign(n.keywords, s), n.exports.PARAMS_CONTAINS.push(l);
    const c = n.contains.find((u) => u.scope === "attr"), b = Object.assign({}, c, {
      match: e.concat(o, e.lookahead(/\s*\?:/))
    });
    return n.exports.PARAMS_CONTAINS.push([n.exports.CLASS_REFERENCE, c, b]), n.contains = n.contains.concat([l, r, i, b]), d(n, "shebang", t.SHEBANG()), d(n, "use_strict", {
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use strict['"]/
    }), n.contains.find((u) => u.label === "func.def").relevance = 0, Object.assign(n, {
      name: "TypeScript",
      aliases: ["ts", "tsx", "mts", "cts"]
    }), n;
  },
  grmr_vbnet: (t) => {
    const e = t.regex, n = /\d{1,2}\/\d{1,2}\/\d{4}/, o = /\d{4}-\d{1,2}-\d{1,2}/, a = /(\d|1[012])(:\d+){0,2} *(AM|PM)/, r = /\d{1,2}(:\d{1,2}){1,2}/, i = {
      className: "literal",
      variants: [{ begin: e.concat(/# */, e.either(o, n), / *#/) }, {
        begin: e.concat(/# */, r, / *#/)
      }, { begin: e.concat(/# */, a, / *#/) }, {
        begin: e.concat(/# */, e.either(o, n), / +/, e.either(a, r), / *#/)
      }]
    }, s = t.COMMENT(/'''/, /$/, {
      contains: [{ className: "doctag", begin: /<\/?/, end: />/ }]
    }), l = t.COMMENT(null, /$/, { variants: [{ begin: /'/ }, { begin: /([\t ]|^)REM(?=\s)/ }] });
    return {
      name: "Visual Basic .NET",
      aliases: ["vb"],
      case_insensitive: !0,
      classNameAliases: { label: "symbol" },
      keywords: {
        keyword: "addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
        built_in: "addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",
        type: "boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",
        literal: "true false nothing"
      },
      illegal: "//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",
      contains: [{
        className: "string",
        begin: /"(""|[^/n])"C\b/
      }, {
        className: "string",
        begin: /"/,
        end: /"/,
        illegal: /\n/,
        contains: [{ begin: /""/ }]
      }, i, {
        className: "number",
        relevance: 0,
        variants: [{
          begin: /\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/
        }, { begin: /\b\d[\d_]*((U?[SIL])|[%&])?/ }, { begin: /&H[\dA-F_]+((U?[SIL])|[%&])?/ }, {
          begin: /&O[0-7_]+((U?[SIL])|[%&])?/
        }, { begin: /&B[01_]+((U?[SIL])|[%&])?/ }]
      }, {
        className: "label",
        begin: /^\w+:/
      }, s, l, {
        className: "meta",
        begin: /[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
        end: /$/,
        keywords: {
          keyword: "const disable else elseif enable end externalsource if region then"
        },
        contains: [l]
      }]
    };
  },
  grmr_wasm: (t) => {
    t.regex;
    const e = t.COMMENT(/\(;/, /;\)/);
    return e.contains.push("self"), { name: "WebAssembly", keywords: {
      $pattern: /[\w.]+/,
      keyword: ["anyfunc", "block", "br", "br_if", "br_table", "call", "call_indirect", "data", "drop", "elem", "else", "end", "export", "func", "global.get", "global.set", "local.get", "local.set", "local.tee", "get_global", "get_local", "global", "if", "import", "local", "loop", "memory", "memory.grow", "memory.size", "module", "mut", "nop", "offset", "param", "result", "return", "select", "set_global", "set_local", "start", "table", "tee_local", "then", "type", "unreachable"]
    }, contains: [t.COMMENT(/;;/, /$/), e, {
      match: [/(?:offset|align)/, /\s*/, /=/],
      className: { 1: "keyword", 3: "operator" }
    }, { className: "variable", begin: /\$[\w_]+/ }, {
      match: /(\((?!;)|\))+/,
      className: "punctuation",
      relevance: 0
    }, {
      begin: [/(?:func|call|call_indirect)/, /\s+/, /\$[^\s)]+/],
      className: {
        1: "keyword",
        3: "title.function"
      }
    }, t.QUOTE_STRING_MODE, {
      match: /(i32|i64|f32|f64)(?!\.)/,
      className: "type"
    }, {
      className: "keyword",
      match: /\b(f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))\b/
    }, {
      className: "number",
      relevance: 0,
      match: /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/
    }] };
  },
  grmr_xml: (t) => {
    const e = t.regex, n = e.concat(/[\p{L}_]/u, e.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u), o = {
      className: "symbol",
      begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
    }, a = {
      begin: /\s/,
      contains: [{ className: "keyword", begin: /#?[a-z_][a-z1-9_-]+/, illegal: /\n/ }]
    }, r = t.inherit(a, { begin: /\(/, end: /\)/ }), i = t.inherit(t.APOS_STRING_MODE, {
      className: "string"
    }), s = t.inherit(t.QUOTE_STRING_MODE, { className: "string" }), l = {
      endsWithParent: !0,
      illegal: /</,
      relevance: 0,
      contains: [{
        className: "attr",
        begin: /[\p{L}0-9._:-]+/u,
        relevance: 0
      }, { begin: /=\s*/, relevance: 0, contains: [{
        className: "string",
        endsParent: !0,
        variants: [{ begin: /"/, end: /"/, contains: [o] }, {
          begin: /'/,
          end: /'/,
          contains: [o]
        }, { begin: /[^\s"'=<>`]+/ }]
      }] }]
    };
    return {
      name: "HTML, XML",
      aliases: ["html", "xhtml", "rss", "atom", "xjb", "xsd", "xsl", "plist", "wsf", "svg"],
      case_insensitive: !0,
      unicodeRegex: !0,
      contains: [{
        className: "meta",
        begin: /<![a-z]/,
        end: />/,
        relevance: 10,
        contains: [a, s, i, r, { begin: /\[/, end: /\]/, contains: [{
          className: "meta",
          begin: /<![a-z]/,
          end: />/,
          contains: [a, r, s, i]
        }] }]
      }, t.COMMENT(/<!--/, /-->/, { relevance: 10 }), {
        begin: /<!\[CDATA\[/,
        end: /\]\]>/,
        relevance: 10
      }, o, { className: "meta", end: /\?>/, variants: [{
        begin: /<\?xml/,
        relevance: 10,
        contains: [s]
      }, { begin: /<\?[a-z][a-z0-9]+/ }] }, {
        className: "tag",
        begin: /<style(?=\s|>)/,
        end: />/,
        keywords: { name: "style" },
        contains: [l],
        starts: {
          end: /<\/style>/,
          returnEnd: !0,
          subLanguage: ["css", "xml"]
        }
      }, {
        className: "tag",
        begin: /<script(?=\s|>)/,
        end: />/,
        keywords: { name: "script" },
        contains: [l],
        starts: {
          end: /<\/script>/,
          returnEnd: !0,
          subLanguage: ["javascript", "handlebars", "xml"]
        }
      }, {
        className: "tag",
        begin: /<>|<\/>/
      }, {
        className: "tag",
        begin: e.concat(/</, e.lookahead(e.concat(n, e.either(/\/>/, />/, /\s/)))),
        end: /\/?>/,
        contains: [{ className: "name", begin: n, relevance: 0, starts: l }]
      }, {
        className: "tag",
        begin: e.concat(/<\//, e.lookahead(e.concat(n, />/))),
        contains: [{
          className: "name",
          begin: n,
          relevance: 0
        }, { begin: />/, relevance: 0, endsParent: !0 }]
      }]
    };
  },
  grmr_yaml: (t) => {
    const e = "true false yes no null", n = "[\\w#;/?:@&=+$,.~*'()[\\]]+", o = {
      className: "string",
      relevance: 0,
      variants: [{ begin: /"/, end: /"/ }, { begin: /\S+/ }],
      contains: [t.BACKSLASH_ESCAPE, { className: "template-variable", variants: [{
        begin: /\{\{/,
        end: /\}\}/
      }, { begin: /%\{/, end: /\}/ }] }]
    }, a = t.inherit(o, { variants: [{
      begin: /'/,
      end: /'/,
      contains: [{ begin: /''/, relevance: 0 }]
    }, { begin: /"/, end: /"/ }, {
      begin: /[^\s,{}[\]]+/
    }] }), r = {
      end: ",",
      endsWithParent: !0,
      excludeEnd: !0,
      keywords: e,
      relevance: 0
    }, i = { begin: /\{/, end: /\}/, contains: [r], illegal: "\\n", relevance: 0 }, s = {
      begin: "\\[",
      end: "\\]",
      contains: [r],
      illegal: "\\n",
      relevance: 0
    }, l = [{
      className: "attr",
      variants: [{ begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ }, {
        begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
      }, {
        begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
      }]
    }, {
      className: "meta",
      begin: "^---\\s*$",
      relevance: 10
    }, {
      className: "string",
      begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
    }, {
      begin: "<%[%=-]?",
      end: "[%-]?%>",
      subLanguage: "ruby",
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0
    }, { className: "type", begin: "!\\w+!" + n }, {
      className: "type",
      begin: "!<" + n + ">"
    }, { className: "type", begin: "!" + n }, {
      className: "type",
      begin: "!!" + n
    }, { className: "meta", begin: "&" + t.UNDERSCORE_IDENT_RE + "$" }, {
      className: "meta",
      begin: "\\*" + t.UNDERSCORE_IDENT_RE + "$"
    }, {
      className: "bullet",
      begin: "-(?=[ ]|$)",
      relevance: 0
    }, t.HASH_COMMENT_MODE, { beginKeywords: e, keywords: { literal: e } }, {
      className: "number",
      begin: "\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
    }, { className: "number", begin: t.C_NUMBER_RE + "\\b", relevance: 0 }, i, s, {
      className: "string",
      relevance: 0,
      begin: /'/,
      end: /'/,
      contains: [{
        match: /''/,
        scope: "char.escape",
        relevance: 0
      }]
    }, o], d = [...l];
    return d.pop(), d.push(a), r.contains = d, {
      name: "YAML",
      case_insensitive: !0,
      aliases: ["yml"],
      contains: l
    };
  }
});
const Be = pn;
for (const t of Object.keys(Ht)) {
  const e = t.replace("grmr_", "").replace("_", "-");
  Be.registerLanguage(e, Ht[t]);
}
class mr extends An {
  async load() {
    this.template = Tn.preset(), this.marked = new tn(), this.marked.use(
      Bo(),
      $o(),
      {
        ...vo({
          highlight: (e, n) => Be.getLanguage(n) ? Be.highlight(e, { language: n }).value : Be.highlightAuto(e).value
        }),
        renderer: {
          code: ({ text: e, lang: n }) => `<pre><code class="hljs${n ? ` language-${n}` : ""}">${e}
</code></pre>`
        }
      }
    ), this.setBaseUrl = xo;
  }
  /** @param {import('./zero-md-base.js').ZeroMdRenderObject} _obj */
  async parse({ text: e, baseUrl: n }) {
    return this.marked.use(this.setBaseUrl(n || "")), this.marked.parse(e);
  }
}
customElements.define("zero-md", mr);
export {
  mr as default
};
