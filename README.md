# riccardo-bedogni-portfolio

Personal portfolio of Riccardo Bedogni: AI Engineer, Data & ML.
Static site, bilingual (English at `/`, Italian at `/it/`), light/dark theme, command palette (⌘K / Ctrl+K / `/`).

**Concept: "Latent Space".** The thread running through it is _similarity_. The name in the hero is a point cloud sampled from the real `<h1>`. Projects live as points in a space, the command palette ranks results by similarity, and the research section shows two schemas whose columns match by meaning instead of by spelling.

## Stack

|           |                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | [Astro 5](https://astro.build), static output, zero JS by default                                                                                                                |
| Islands   | Vue 3: `CommandPalette.vue` (`client:idle`), `ThesisMatcher.vue` (`client:visible`)                                                                                              |
| Styling   | Hand-written CSS with design tokens (`src/styles/tokens.css`), no framework                                                                                                      |
| Motion    | IntersectionObserver + CSS, plus one 2D canvas for the hero. No animation library, which keeps first-load JS small. Everything heavy is disabled under `prefers-reduced-motion`. |
| Content   | Content collections: Markdown for projects, YAML for page copy                                                                                                                   |
| Fonts     | Instrument Serif, Inter Tight, JetBrains Mono, self-hosted via Fontsource (latin subsets)                                                                                        |
| Images    | `astro:assets` → responsive WebP                                                                                                                                                 |
| OG images | Generated at build time with satori + resvg (`src/lib/og.ts`)                                                                                                                    |

## Run it

```bash
npm install
npm run dev        # http://localhost:4321, hot reload
npm run build      # → dist/
npm run preview    # serve dist/ on http://localhost:4321
npm run lint       # ESLint + Prettier check
npm run check      # astro check (types, content schemas)
```

Node 22 (any ≥ 18.20 works).

## Editing content (no code needed)

| What                                                                                | Where                                                                             |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Home page copy: hero, trajectory, research (OMOP project), method, toolkit, contact | `src/content/site/en.yaml`, `src/content/site/it.yaml`                            |
| Projects (one file per project per language, same filename)                         | `src/content/projects/en/*.md`, `src/content/projects/it/*.md`                    |
| Small UI strings: nav, buttons, palette, meta descriptions                          | `src/i18n/en.json`, `src/i18n/it.json`                                            |
| Email, LinkedIn, GitHub, CV path                                                    | `src/lib/site.ts`                                                                 |
| Project figures                                                                     | `src/assets/projects/<slug>/`, referenced from frontmatter `cover` or in Markdown |

**Project frontmatter.** `tier` is `featured` (the one large card), `standard`, `compact` or `upcoming`. `order` sets the position. `metrics` holds up to 4 headline numbers, and every number must come from a file listed in `sources`. The schema is in `src/content.config.ts`, and the build fails if a file doesn't match.

**CV.** Drop the PDF at `public/cv/riccardo-bedogni-cv.pdf`. The download button in Contact and the palette entry appear automatically on the next build.

**RAG Pipeline Visualizer.** When the demo is public, add `demo: https://…` to `src/content/projects/{en,it}/rag-visualizer.md`. To give it a full page, also change `tier: upcoming` to `standard` and write the case study.

Open items (missing assets, facts to verify) are tracked in [`CONTENT_TODO.md`](CONTENT_TODO.md).

## Structure

```
src/
  content.config.ts        content schemas (projects, site copy)
  content/projects/{en,it}/ case studies (Markdown)
  content/site/{en,it}.yaml home page copy
  i18n/                    UI strings + locale helpers (localizedPath, alternatePath)
  styles/                  tokens.css (palette, type scale, spacing), base.css
  scripts/                 point-cloud.ts (hero canvas), reveal.ts
  lib/                     projects loader, OG renderer, seeded PRNG, site constants
  components/              Hero, Trajectory, Work/ProjectCard/Glyph, Thesis/ThesisMatcher.vue,
                           Method, Toolkit, Contact, Nav, Palette/CommandPalette.vue, ProjectDetail
  layouts/Base.astro       <head>: SEO, Open Graph, hreflang, JSON-LD Person, theme bootstrap
  pages/                   / · /it/ · /projects/[slug] · /it/progetti/[slug] · /og/*.png · 404
public/                    favicon, robots.txt, _headers (Cloudflare Pages)
```

`/styleguide` is the design-token tile from milestone 1. It isn't linked, is marked `noindex` and is excluded from the sitemap.

## Deploy: Cloudflare Pages (free)

**Live:** https://riccardo-bedogni.pages.dev (Pages project `riccardo-bedogni`, created with direct upload).

### Publish an update

```bash
npm run deploy     # build + wrangler pages deploy dist (asks for a Cloudflare login the first time)
```

The build emits flat files (`projects/foo.html`, `build.format: 'file'`), so Pages serves every URL without a trailing-slash redirect. Canonical URLs, hreflang, Open Graph and the sitemap all derive from `SITE` in `astro.config.mjs`.

### Optional: deploy automatically on every push

The `deploy` job in `.github/workflows/ci.yml` publishes `dist/` after a green build, but it only runs once two repository secrets exist. Until then it is skipped and CI still passes.

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token** → template **"Edit Cloudflare Workers"**, or a custom token with _Account → Cloudflare Pages → Edit_.
2. GitHub → `bigbrisla/portfolio` → **Settings → Secrets and variables → Actions → New repository secret**:
   - `CLOUDFLARE_API_TOKEN`: the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID`: shown in the Cloudflare dashboard sidebar (Workers & Pages → Account ID)

### Custom domain

1. Buy the domain (Cloudflare Registrar sells at cost).
2. Workers & Pages → `riccardo-bedogni` → **Custom domains → Set up a domain**. On Cloudflare DNS the record is created for you; elsewhere, add the `CNAME` it shows.
3. Update `SITE` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt`, then `npm run deploy`.

No secrets live in the repository. The site has no backend and no API keys.

## CI

`.github/workflows/ci.yml` runs `npm ci`, `lint`, `check` and `build` on every push to `main` and on every PR, then deploys if the Cloudflare secrets are set (see above).

## Quality bar (measured locally, `npm run preview`)

- Lighthouse, mobile home: Performance 98–99, Accessibility 100, Best Practices 100, SEO 100. Desktop: 100 across the board. Project page (mobile): 99 / 100 / 100 / 100.
- axe-core (WCAG 2.1 AA + best practices): 0 violations on home, project pages and 404, in both themes.
- No horizontal overflow at 375, 768 and 1440 px. Keyboard: skip link, visible focus, palette with combobox semantics and a focus trap.
- First-load JS on the home page: inline scripts plus the Vue runtime, which loads only when idle for the palette.
