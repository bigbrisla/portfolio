import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Projects: one Markdown file per project per language, same filename in
 * `projects/en/` and `projects/it/`. The body holds the case study sections
 * (## Problem / ## What I built / ## Results / ## Limits); the frontmatter
 * holds everything the cards, palette and SEO need.
 *
 * Rule: every number in `metrics` must come from a file listed in `sources`.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pitch: z.string(),
      /** featured = the one large card; standard = medium; compact = small; upcoming = "coming soon" */
      tier: z.enum(['featured', 'standard', 'compact', 'upcoming']),
      order: z.number(),
      year: z.number(),
      kind: z.string(),
      stack: z.array(z.string()),
      repo: z.string().url().optional(),
      demo: z.string().url().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** Headline numbers shown on cards. Keep to 2–4. */
      metrics: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .max(4)
        .default([]),
      /** Repo files the numbers come from (for review; not rendered). */
      sources: z.array(z.string()).default([]),
      /** Set when the text was inferred from code rather than a README; listed in CONTENT_TODO.md. */
      needsReview: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
