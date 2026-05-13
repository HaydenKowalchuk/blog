# blog

Personal site and blog for Hayden Kowalchuk. Built as a single-page app served from the `docs/` directory on GitHub Pages at `/blog/`.

## Stack

- **[Juris](https://github.com/jurisjs/juris)** — lightweight JavaScript SPA framework handling routing, reactive state, and component rendering. No build step required.
- **[zero-md](https://github.com/zerodevx/zero-md)** — web component that renders markdown inside shadow DOM using marked + highlight.js.
- Content is plain markdown files fetched at runtime. No bundler, no transpiler.

## Project structure

```
docs/
  app.js              # all app logic: routing, components, state
  index.html          # entry point
  styles.css          # global styles
  pages.json          # nav page definitions
  *.md                # nav pages
  about.md            # home / about page
  articles/
    index.md          # article registry (one line per article)
    *.md              # article content files
  images/             # images referenced by articles
  components/
    site-footer.js    # footer web component
    scroll-to-top.js  # scroll-to-top web component
  lib/                # vendored JS (juris, zero-md)
  vendor/             # vendored CSS (rose pine theme)
```

## Adding an article

1. Create `docs/articles/your-slug.md` with your content.
2. Add a line to `docs/articles/index.md` in this format:

```
- [Article Title](your-slug) YYYY-MM-DD category1,category2 | Optional description for meta tags
```

- **slug** — matches the filename without `.md`, becomes the URL `/articles/your-slug`
- **date** — `YYYY-MM-DD`, used for sorting (newest first)
- **categories** — comma-separated, no spaces. An article tagged `dreamcast` will appear on the `/dreamcast` page. Multiple categories are supported.
- **description** — optional, after the `|`. Falls back to the first paragraph of the article if omitted.

Articles are automatically sorted newest to oldest everywhere they appear.

## Adding a nav page

Add an entry to `docs/pages.json`:

```json
{ "id": "games", "title": "Games", "file": "games.md", "nav": true }
```

Create the matching `docs/games.md`. Any articles tagged with the page `id` will automatically appear below the page content (capped at 5 most recent, with a divider).

## Article Topics panel / "What's in this article"

The collapsible "What's inside this article" panel appears when an article contains a `## Article Topics` section with a bullet list. That section is stripped from the rendered body so it never appears as content. Articles without it show no panel.

The sidebar TOC is always auto-generated from `##` and `###` headings and is independent of the panel.

```markdown
## Article Topics
- Why the Dreamcast renderer works differently from desktop GL
- The fastpath vertex format and how to use it
- map_buffer: writing directly into GLdc internal buffers
- Benchmark results comparing each approach
```

## Formatting

Format all JS and CSS with Biome:

```sh
npx @biomejs/biome format --write docs/
```
