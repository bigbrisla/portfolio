import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg } from '@/lib/og';
import { getProjects, slugOf } from '@/lib/projects';
import { useTranslations, locales } from '@/i18n/utils';

/** /og/en.png, /og/it.png, /og/en/<slug>.png, /og/it/<slug>.png */
export const getStaticPaths = (async () => {
  const paths = [];
  for (const locale of locales) {
    const t = useTranslations(locale);
    paths.push({
      params: { route: locale },
      props: {
        kicker: locale === 'it' ? 'Portfolio · Reggio Emilia' : 'Portfolio · Reggio Emilia, IT',
        title: 'Riccardo Bedogni',
        subtitle: t.meta.ogLine,
        seed: 'og-home',
      },
    });
    for (const p of await getProjects(locale)) {
      if (p.data.tier === 'upcoming') continue;
      paths.push({
        params: { route: `${locale}/${slugOf(p)}` },
        props: {
          kicker: p.data.kind,
          title: p.data.title,
          subtitle: p.data.metrics[0]
            ? `${p.data.metrics[0].value} — ${p.data.metrics[0].label}`
            : t.meta.ogProject,
          seed: slugOf(p),
        },
      });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as Parameters<typeof renderOg>[0]);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
