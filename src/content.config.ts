import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Research themes — keys are used in URLs (/publications?theme=…) and in frontmatter. */
export const THEMES = ['rare-signals', 'latent-structure', 'ranking', 'llm', 'topology'] as const;

/**
 * published   — appeared in a journal / proceedings
 * accepted    — accepted, not yet in proceedings
 * to-appear   — accepted at a journal, in press
 * under-review — submitted, under review
 * preprint    — public preprint, not (yet) submitted
 */
export const STATUSES = ['published', 'accepted', 'to-appear', 'under-review', 'preprint'] as const;

const url = z.url();

const publications = defineCollection({
  // One Markdown file per paper. The Markdown body is the abstract.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    /** Display names in order, e.g. "J. Jin". The site owner's name is bolded automatically. */
    authors: z.array(z.string()).min(1),
    year: z.number().int(),
    /** Used for ordering within a year (newest first). */
    date: z.coerce.date(),
    /** Short venue for the mono badge, e.g. "NeurIPS 2026". */
    venue: z.string(),
    /** Full venue name shown in the citation line. */
    venueFull: z.string().optional(),
    status: z.enum(STATUSES),
    themes: z.array(z.enum(THEMES)).min(1),
    featured: z.boolean().default(false),
    /** Hide from the site without deleting the file. */
    draft: z.boolean().default(false),
    links: z
      .object({
        pdf: url.optional(),
        arxiv: url.optional(),
        code: url.optional(),
        doi: url.optional(),
        openreview: url.optional(),
        journal: url.optional(),
      })
      .default({}),
    bibtex: z.string().optional(),
    /** Old Hugo slugs that should redirect here. */
    aliases: z.array(z.string()).default([]),
  }),
});

const news = defineCollection({
  // All news items live in one YAML file — add a new item at the top.
  loader: file('src/content/news.yaml'),
  schema: z.object({
    /** Sort key (YYYY-MM or YYYY-MM-DD). */
    date: z.coerce.date(),
    /** What is displayed, e.g. "Dec 2026" or "Summer 2026". Defaults to "Mon YYYY". */
    label: z.string().optional(),
    /** Plain text; [text](url) links are supported. */
    text: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { publications, news };
