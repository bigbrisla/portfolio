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

const text = z.coerce.string(); // YAML turns bare years into numbers
const site = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/site' }),
  schema: z.object({
    hero: z.object({ role: text, line: text, ctaWork: text, ctaContact: text, location: text }),
    trajectory: z.object({
      intro: text,
      steps: z.array(z.object({ when: text, title: text, place: text, text })),
    }),
    work: z.object({
      intro: text,
      featured: text,
      upcoming: text,
      readCase: text,
      repo: text,
      demoSoon: text,
      liveDemo: text,
    }),
    thesis: z.object({
      kicker: text,
      title: text,
      paragraphs: z.array(text),
      demoTitle: text,
      demoNote: text,
      link: text,
    }),
    method: z.object({
      intro: text,
      steps: z.array(z.object({ title: text, text })),
      ai: z.object({ title: text, paragraphs: z.array(text), principles: z.array(text) }),
    }),
    toolkit: z.object({
      intro: text,
      groups: z.array(z.object({ name: text, items: z.array(text) })),
    }),
    contact: z.object({
      title: text,
      text,
      emailLabel: text,
      copy: text,
      copied: text,
      cv: text,
    }),
  }),
});

export const collections = { projects, site };
