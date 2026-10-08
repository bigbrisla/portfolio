import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/utils';

export type Project = CollectionEntry<'projects'>;

/** `en/rag-ai-act` → `rag-ai-act` */
export const slugOf = (p: Project) => p.id.split('/').slice(1).join('/');

/** Published projects for one language, in display order (upcoming last). */
export async function getProjects(locale: Locale): Promise<Project[]> {
  const all = await getCollection(
    'projects',
    (p) => p.id.startsWith(`${locale}/`) && !p.data.draft,
  );
  const rank = (p: Project) => (p.data.tier === 'upcoming' ? 1000 : p.data.order);
  return all.sort((a, b) => rank(a) - rank(b));
}

/** Static paths for detail pages (upcoming projects have no page yet). */
export async function projectPaths(locale: Locale) {
  const list = (await getProjects(locale)).filter((p) => p.data.tier !== 'upcoming');
  return list.map((project) => ({ params: { slug: slugOf(project) }, props: { project } }));
}

/** Home-page copy for one language (src/content/site/<locale>.yaml). */
export async function getSiteCopy(locale: Locale) {
  const { getEntry } = await import('astro:content');
  const entry = await getEntry('site', locale);
  if (!entry) throw new Error(`Missing src/content/site/${locale}.yaml`);
  return entry.data;
}
