# gabrielmoryoussef.github.io

Personal academic site of Gabriel Moryoussef. Built with [Astro](https://astro.build), fully static, and deployed to GitHub Pages by GitHub Actions on every push to `main`.

## Develop

Requires Node ≥ 22.23.4 (see `.nvmrc`).

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/
```

## Add a paper

Create one Markdown file in `src/content/publications/`. The file name becomes the paper's anchor (`/publications/#<file-name>`). The body of the file is the abstract.

```md
---
title: "Paper Title"
authors: ["A. Coauthor", "G. Moryoussef"]   # your name is bolded automatically
year: 2027
date: 2027-03-01            # orders papers within a year
venue: "AoS"                # short label for the badge
venueFull: "Annals of Statistics"
status: under-review        # published | accepted | to-appear | under-review | preprint
themes: [rare-signals]      # rare-signals | latent-structure | ranking | llm | topology
featured: false             # true → also listed on the home page
links:                      # all optional: pdf, arxiv, code, doi, openreview, journal
  arxiv: https://arxiv.org/abs/XXXX.XXXXX
  pdf: https://arxiv.org/pdf/XXXX.XXXXX
bibtex: |
  @article{key,
    title = {...},
  }
---

Abstract goes here. Leave it empty and the Abstract button is hidden.
```

The schema in `src/content.config.ts` is checked at build time, so a typo in a field fails the build with a clear error. Files whose names start with `_` are ignored; `_sequential-hc.md` is a placeholder for the e-HC paper.

## Add a news item

Add an entry at the top of `src/content/news.yaml`:

```yaml
- id: some-unique-id
  date: 2027-02-01        # sort key
  label: Feb 2027         # optional; defaults to "Mon YYYY"
  text: Gave a talk at [Some Seminar](https://example.com).
```

The home page shows the latest 5 items. Items dated in the future get an "Upcoming" badge.

## Other edits

| What | Where |
|---|---|
| Name, role, links, email, location, research themes, education | `src/data/site.ts` |
| Bio | `src/pages/index.astro` (About section) |
| CV | replace `public/uploads/resume.pdf` (keep the path; old links point to it) |
| Colors, type scale, spacing, motion | `src/styles/tokens.css` |
| Hero figure | `src/scripts/hero-engine.ts` |

In January 2027, drop "Incoming" from `site.next.label` and change `site.location` in `src/data/site.ts`.

## How it's built

- **Content:** typed Astro content collections (zod schemas). One file per paper; news is a single YAML file.
- **Styling:** hand-written CSS on a single token file. The fonts (Instrument Serif, Inter, JetBrains Mono) are self-hosted through Fontsource.
- **Client JS (~20 KB total):**
  - the hero canvas, rendered in a Web Worker via `OffscreenCanvas`, with a main-thread fallback
  - the theme toggle
  - the ⌘K palette
  - publication filters, BibTeX copy and abstract toggles
  - scroll reveals
- **Page transitions:** native cross-document View Transitions, with no client router.
- **Generated at build time:**
  - the OG image, `og.png` (satori + resvg)
  - the favicons and app icons, from the same simplex motif
  - the sitemap
- **Old URLs:** `/publication/<slug>/` pages from the Hugo site redirect to `/publications/#<id>` (aliases are listed in each paper's `aliases` field).
