const ZERO_MD_TEMPLATE = `
  <template>
    <link rel="stylesheet" href="vendor/rosepine-markdown.css">
    <link rel="stylesheet" href="vendor/rosepine-highlight.css">
  </template>`;

const zeroMd = (markdown) =>
	`<zero-md>${ZERO_MD_TEMPLATE}<script type="text/markdown">${markdown}<\/script></zero-md>`;

// Extracts TOC items from markdown.
// If an explicit "## Table of Contents" (or "## Contents" / "## TOC") section
// with a bullet list exists, those items are used. Otherwise falls back to
// auto-scanning ##/### headings.
const extractToc = (text) => {
	const lines = text.split("\n");
	// Fallback: auto-extract ##/### headings, skipping the Article Topics section
	return lines
		.filter((l) => /^#{2,3}\s/.test(l))
		.filter((l) => !/^#{1,3}\s+(article topics)\s*$/i.test(l.trim()))
		.map((l) => l.replace(/^#+\s+/, "").trim());
};

// Extracts the bullet list under "## Article Topics" for the "What's inside" panel.
const extractTopics = (text) => {
	const lines = text.split("\n");
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^#{1,3}\s+(article topics)\s*$/i.test(lines[i].trim())) {
			start = i + 1;
			break;
		}
	}
	if (start === -1) return [];
	const items = [];
	for (let i = start; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		if (/^#/.test(line)) break;
		const m = line.match(/^[-*+]\s+(.+)/);
		if (m) items.push(m[1].replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim());
	}
	return items;
};

// Strips the "## Article Topics" section (heading + list) from markdown
// so it is not rendered in the article body.
const stripTopics = (text) => {
	const lines = text.split("\n");
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^#{1,3}\s+(article topics)\s*$/i.test(lines[i].trim())) {
			start = i;
			break;
		}
	}
	if (start === -1) return text;
	let end = start + 1;
	while (end < lines.length) {
		const line = lines[end].trim();
		if (line && /^#/.test(line)) break;
		end++;
	}
	return [...lines.slice(0, start), ...lines.slice(end)].join("\n");
};

// Matches marked's GFM heading ID algorithm
const headingSlug = (text) =>
	text
		.toLowerCase()
		.trim()
		.replace(/['"\\!#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "")
		.replace(/\s+/g, "-");

// Scroll to a heading inside zero-md's shadow DOM
const scrollToHeading = (headingText) => {
	const slug = headingSlug(headingText);
	const zeroMdEl = document.querySelector(".post zero-md");
	if (!zeroMdEl?.shadowRoot) return;
	const el = zeroMdEl.shadowRoot.getElementById(slug);
	if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Extract first meaningful paragraph for use as meta description
const extractDescription = (markdown) => {
	for (const line of markdown.split("\n")) {
		const t = line.trim();
		if (
			t &&
			!t.startsWith("#") &&
			!t.startsWith("```") &&
			!t.startsWith("- ") &&
			!t.startsWith("* ")
		) {
			return t.replace(/[*_`[\]()]/g, "").substring(0, 160);
		}
	}
	return "";
};

// Update document title and meta description
const updateMeta = (title, description) => {
	document.title = title ? `${title} — Hayden Kowalchuk` : "Hayden Kowalchuk";
	let el = document.querySelector('meta[name="description"]');
	if (!el) {
		el = document.createElement("meta");
		el.setAttribute("name", "description");
		document.head.appendChild(el);
	}
	el.setAttribute("content", description || "");
};

// Loads pages config and article index. On article routes, also fetches the
// markdown to auto-extract heading TOC (browser caches it for zero-md reuse).
const ContentService = (props, context) => {
	const { getState, setState, subscribe } = context;

	const loadPages = async () => {
		try {
			const res = await fetch("pages.json");
			const data = await res.json();
			setState("content.pages", data.pages || []);
		} catch (e) {
			console.error("Failed to load pages.json", e);
		}
	};

	// Parses articles/index.md lines of the form:
	//   - [Title](slug) YYYY-MM-DD category
	const loadArticleIndex = async () => {
		try {
			const res = await fetch("articles/index.md");
			const text = await res.text();
			const articles = [];
			const re =
				/\[([^\]]+)\]\(([^)]+)\)\s+(\d{4}-\d{2}-\d{2})\s+(\S+)(?:\s*\|\s*(.+))?/g;
			let m;
			while ((m = re.exec(text)) !== null) {
				articles.push({
					title: m[1],
					slug: m[2],
					date: m[3],
					categories: m[4].split(","),
					description: m[5] || "",
				});
			}
			articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
			setState("content.articles", articles);
		} catch (e) {
			console.error("Failed to load article index", e);
		}
	};

	const handleRoute = async () => {
		const path = getState("url.path", "/");
		const parts = path.split("/").filter(Boolean);

		// Reset TOC visibility and scroll to top on every navigation
		setState("ui.tocVisible", false);
		window.scrollTo(0, 0);

		let mdFile = null;

		if (parts[0] === "articles" && parts[1]) {
			setState("content.currentSlug", parts[1]);
			mdFile = `articles/${parts[1]}.md`;
		} else if (path === "/" || !path) {
			mdFile = "about.md";
		} else {
			const pages = getState("content.pages", []);
			const match = pages.find((p) => `/${p.id}` === path);
			if (match) {
				setState("content.currentPage", match.id);
				mdFile = `${match.id}.md`;
			}
		}

		if (mdFile) {
			try {
				const res = await fetch(mdFile);
				if (res.ok) {
					const text = await res.text();
					const stripped = stripTopics(text);
					setState("content.currentMarkdown", stripped);
					setState("content.currentToc", extractToc(stripped));
					setState("content.currentTopics", extractTopics(text));

					/* Update page meta */
					if (parts[0] === "articles" && parts[1]) {
						const articles = getState("content.articles", []);
						const meta = articles.find((a) => a.slug === parts[1]);
						const desc = meta?.description || extractDescription(text);
						updateMeta(meta?.title || parts[1], desc);
					} else if (path === "/" || !path) {
						updateMeta("About", "");
					} else {
						const pages = getState("content.pages", []);
						const pg = pages.find((p) => `/${p.id}` === path);
						updateMeta(pg?.title || "", "");
					}
				}
			} catch (_) {}
		}
	};

	return {
		hooks: {
			onRegister: async () => {
				await Promise.all([loadPages(), loadArticleIndex()]);
				subscribe("url.path", handleRoute);
				handleRoute();

				window.addEventListener(
					"scroll",
					() => {
						const path = getState("url.path", "/");
						const isArticle = /^\/articles\/[^/]+/.test(path);
						const hasToc = getState("content.currentToc", []).length > 0;
						setState(
							"ui.tocVisible",
							isArticle && hasToc && window.scrollY > 80,
						);
					},
					{ passive: true },
				);

				/* Intercept internal links rendered inside zero-md shadow DOMs */
				document.addEventListener("click", (e) => {
					if (e.defaultPrevented) return;
					const a = e.composedPath().find((el) => el.tagName === "A");
					if (!a || !a.href) return;
					const url = new URL(a.href, location.href);
					if (url.origin !== location.origin) return;
					// Convert absolute path to hash route
					const path = url.pathname.replace(/\/$/, "") || "/";
					e.preventDefault();
					context.Router.navigate(path || "/");
				});
			},
		},
	};
};

// Header
const Header = (props, context) => {
	const { getState, setState } = context;

	const navigate = (path) => {
		context.Router.navigate(path);
	};

	const isActive = (id) => {
		const path = getState("url.path", "/");
		if (id === "/") return path === "/";
		return path.startsWith(`/${id}`);
	};

	const toggleTheme = () => {
		const current = getState("ui.theme", savedTheme);
		const next = current === "light" ? "dark" : "light";
		setState("ui.theme", next);
		document.documentElement.setAttribute("data-theme", next);
		localStorage.setItem("theme", next);
	};

	// Returns a plain { li: ... } vdom object — no component lookup needed
	const navLink = (href, active, label, key) => ({
		li: {
			key,
			children: [
				{
					a: {
						href: `#${href}`,
						className: () => (isActive(active) ? "active" : ""),
						text: label,
						onclick: (e) => {
							e.preventDefault();
							navigate(href);
						},
					},
				},
			],
		},
	});

	return {
		render: () => ({
			aside: {
				className: () => {
					const tocVisible = getState("ui.tocVisible", false);
					const isArticle = /^\/articles\/[^/]+/.test(
						getState("url.path", "/"),
					);
					return "sidebar" + (isArticle && tocVisible ? " toc-active" : "");
				},
				children: [
					{
						nav: {
							children: [
								{
									ul: {
										className: "nav-links",
										children: () => {
											const pages = getState("content.pages", []);
											const staticLinks = pages
												.filter((p) => p.nav)
												.map((p) => navLink(`/${p.id}`, p.id, p.title, p.id));
											return [
												navLink("/", "/", "about", "nav-about"),
												navLink(
													"/articles",
													"articles",
													"articles",
													"nav-articles",
												),
												...staticLinks,
												{
													li: {
														className: "theme-switch-item",
														children: [
															{
																button: {
																	id: "theme-toggle",
																	"aria-label": "Toggle theme",
																	onclick: toggleTheme,
																	innerHTML: () =>
																		getState("ui.theme", savedTheme) === "light"
																			? `<svg class="moon-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9.37 5.51C9.19 6.15 9.1 6.82 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7C5 9.07 6.81 6.55 9.37 5.51zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>`
																			: `<svg class="sun-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>`,
																},
															},
														],
													},
												},
											];
										},
									},
								},
							],
						},
					},
					{
						/* Sticky TOC — fades in on article pages after scrolling */
						nav: {
							key: "post-toc",
							className: () => {
								const visible = getState("ui.tocVisible", false);
								return "post-toc" + (visible ? " is-visible" : "");
							},
							children: () => {
								const toc = getState("content.currentToc", []);
								return [
									{
										div: { className: "toc-title", text: "Table of contents" },
									},
									{
										ul: {
											children: toc.map((item, i) => ({
												li: {
													key: i,
													children: [
														{
															a: {
																text: item,
																onclick: (e) => {
																	e.preventDefault();
																	scrollToHeading(item);
																},
															},
														},
													],
												},
											})),
										},
									},
								];
							},
						},
					},
				],
			},
		}),
	};
};

// AboutPage
const AboutPage = (props, context) => ({
	render: () => ({
		div: {
			className: "about",
			children: [
				{
					div: {
						innerHTML: () =>
							zeroMd(context.getState("content.currentMarkdown", "")),
					},
				},
				{
					"site-footer": {
						author: "Hayden Kowalchuk",
						// email: "hayden (at) hkowsoftware dot com",
						github: "https://github.com/mrneo240",
						gitlab: "https://gitlab.com/HaydenKow",
					},
				},
			],
		},
	}),
});

// ArticleList
// Shows a list of articles from the given category (prop: category),
// or all articles if no category is set.
const ArticleList = (props, context) => {
	const { getState } = context;

	const navigate = (slug) => context.Router.navigate(`/articles/${slug}`);

	const formatDate = (iso) => {
		if (!iso) return "";
		const [y, mo, d] = iso.split("-");
		return `${y}.${mo}.${d}`;
	};

	return {
		render: () => ({
			div: {
				children: () => {
					const all = getState("content.articles", []);
					const cat = props.category;
					const filtered = cat
						? all.filter((a) => a.categories && a.categories.includes(cat))
						: all;
					const list = cat ? filtered.slice(0, 5) : filtered;

					if (!list.length) {
						return [
							{ p: { className: "empty-state", text: "No articles yet." } },
						];
					}

					return [
						{
							ul: {
								className: "posts-list",
								children: list.map((article) => ({
									li: {
										key: article.slug,
										className: "post-item",
										children: [
											{
												a: {
													className: "post-link",
													href: `#/articles/${article.slug}`,
													onclick: (e) => {
														e.preventDefault();
														navigate(article.slug);
													},
													children: [
														{
															span: {
																className: "post-title",
																text: article.title,
															},
														},
														{ span: { className: "dots" } },
														{
															span: {
																className: "post-date",
																text: formatDate(article.date),
															},
														},
													],
												},
											},
										],
									},
								})),
							},
						},
					];
				},
			},
		}),
	};
};

// ArticlesPage
const ArticlesPage = (props, context) => ({
	render: () => ({
		div: {
			className: "page",
			children: [{ ArticleList: {} }],
		},
	}),
});

// ArticleView
// Renders a single article with title, date, TOC toggle, body, and footer.
const ArticleView = (props, context) => {
	const { getState, setState } = context;

	const getArticleMeta = () => {
		const slug = getState("content.currentSlug", "");
		const articles = getState("content.articles", []);
		return articles.find((a) => a.slug === slug) || null;
	};

	const toggleToc = (el) => {
		const container = el.closest(".article-topics");
		if (!container) return;
		const content = container.querySelector(".topics-content");
		if (!content) return;
		const isOpen = content.classList.contains("open");
		content.classList.toggle("open", !isOpen);
		container.classList.toggle("open", !isOpen);
	};

	return {
		render: () => {
			const slug = getState("content.currentSlug", "");
			const meta = getArticleMeta();
			const toc = getState("content.currentToc", []);
			const topics = getState("content.currentTopics", []);

			return {
				article: {
					className: "post",
					children: [
						meta ? { h1: { text: meta.title } } : null,
						meta
							? {
									div: {
										className: "post-metadata",
										children: [
											{
												time: {
													datetime: meta.date,
													text: formatDateLong(meta.date),
												},
											},
										],
									},
								}
							: null,
						{ hr: {} },
						topics.length
							? {
									div: {
										className: "article-topics",
										children: [
											{
												div: {
													className: "topics-preview",
													onclick: (e) => toggleToc(e.currentTarget),
													children: [
														{ span: { className: "toc-icon" } },
														{ span: { text: "What's inside this article" } },
														{
															span: {
																className: "chevron",
																innerHTML: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
															},
														},
													],
												},
											},
											{
												div: {
													className: "topics-content",
													children: [
														{
															div: {
																className: "topics-inner",
																children: [
																	{
																		ul: {
																			children: topics.map((item, i) => ({
																				li: { key: i, text: item },
																			})),
																		},
																	},
																],
															},
														},
													],
												},
											},
										],
									},
								}
							: null,
						topics.length ? { hr: {} } : null,
						slug
							? {
									div: {
										innerHTML: () =>
											zeroMd(getState("content.currentMarkdown", "")),
									},
								}
							: null,
						{
							"site-footer": {
								author: "Hayden Kowalchuk",
								tagline: "Hayden Kowalchuk's blog for gamedev and interests.",
								//email: "hayden (at) hkowsoftware dot com",
								github: "https://github.com/mrneo240",
								gitlab: "https://gitlab.com/HaydenKow",
							},
						},
					].filter(Boolean),
				},
			};
		},
	};
};

function formatDateLong(iso) {
	if (!iso) return "";
	const [y, mo, d] = iso.split("-").map(Number);
	const date = new Date(y, mo - 1, d);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// StaticPage
// Renders a static markdown page (software.md, dreamcast.md, uses.md).
// Also lists articles whose categories include this page's ID.
const StaticPage = (props, context) => {
	const { getState } = context;

	return {
		render: () => {
			// Derive page ID from URL directly — avoids async race with currentPage state
			const path = getState("url.path", "/");
			const pageId = path.replace(/^\//, "");

			const allArticles = getState("content.articles", []);
			const hasArticles = allArticles.some(
				(a) => a.categories && a.categories.includes(pageId),
			);

			return {
				div: {
					className: "page",
					children: [
						{
							div: {
								innerHTML: () =>
									zeroMd(getState("content.currentMarkdown", "")),
							},
						},
						hasArticles ? { hr: { className: "section-divider" } } : null,
						hasArticles ? { ArticleList: { category: pageId } } : null,
					].filter(Boolean),
				},
			};
		},
	};
};

// NotFound
const NotFound = (props, context) => ({
	render: () => ({
		div: {
			className: "page",
			children: [
				{ h2: { text: "404 — Not Found" } },
				{
					p: {
						children: [
							{
								a: {
									href: "#/",
									text: "← Back home",
									onclick: (e) => {
										e.preventDefault();
										context.Router.navigate("/");
									},
								},
							},
						],
					},
				},
			],
		},
	}),
});

// App (root)
const App = (props, context) => {
	const { getState } = context;

	return {
		render: () => ({
			div: {
				className: "container",
				children: [
					{ Header: {} },
					{
						main: {
							className: "content",
							children: () => {
								const path = getState("url.path", "/");
								const parts = path.split("/").filter(Boolean);

								if (parts[0] === "articles" && parts[1])
									return [{ ArticleView: {} }];
								if (path === "/articles") return [{ ArticlesPage: {} }];
								if (path === "/" || !path) return [{ AboutPage: {} }];

								const pages = getState("content.pages", []);
								if (pages.some((p) => `/${p.id}` === path))
									return [{ StaticPage: {} }];

								return [{ NotFound: {} }];
							},
						},
					},
				],
			},
		}),
	};
};

// Bootstrap — honour saved preference, then OS preference, then light
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const savedTheme = localStorage.getItem("theme") || systemTheme;
document.documentElement.setAttribute("data-theme", savedTheme);

const juris = new Juris({
	logLevel: "error",
	features: { headless: HeadlessManager },

	components: {
		App,
		Header,
		AboutPage,
		ArticlesPage,
		ArticleList,
		ArticleView,
		StaticPage,
		NotFound,
	},

	headlessComponents: {
		Router: {
			fn: Router,
			options: {
				autoInit: true,
				config: {
					mode: "hash",
					statePath: "url",
					defaultRoute: "/",
					routes: {
						"/": {},
						"/articles": {},
						"/articles/:slug": {},
						"/dreamcast": {},
						"/games": {},
						"/404": {},
					},
				},
			},
		},
		ContentService: {
			fn: ContentService,
			options: { autoInit: true },
		},
	},

	states: {
		url: { path: "/", segments: [], params: {}, query: {}, hash: "" },
		content: {
			pages: [],
			articles: [],
			currentSlug: "",
			currentPage: "",
			currentMarkdown: "",
			currentToc: [],
			currentTopics: [],
		},
		ui: {
			theme: savedTheme,
			tocVisible: false,
		},
	},

	layout: { App: {} },
});

// Follow OS theme changes only when the user hasn't set a manual preference
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
	if (localStorage.getItem("theme")) return;
	const next = e.matches ? "dark" : "light";
	document.documentElement.setAttribute("data-theme", next);
	juris.setState("ui.theme", next);
});

juris.render("#app");
