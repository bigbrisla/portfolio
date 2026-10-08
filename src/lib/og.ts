/**
 * Open Graph images (1200×630), rendered at build time with satori → resvg.
 * Designed for the LinkedIn preview: dark "night" palette, the point cloud,
 * the name in the display serif, and one line of context.
 */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { seeded, gaussian } from './rand';

const font = (pkg: string, file: string) =>
  fs.readFileSync(path.join(process.cwd(), 'node_modules', pkg, 'files', file));

let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
function loadFonts() {
  fonts ??= [
    {
      name: 'Serif',
      data: font('@fontsource/instrument-serif', 'instrument-serif-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Serif',
      data: font('@fontsource/instrument-serif', 'instrument-serif-latin-400-italic.woff'),
      weight: 400,
      style: 'italic',
    },
    {
      name: 'Sans',
      data: font('@fontsource/inter-tight', 'inter-tight-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Sans',
      data: font('@fontsource/inter-tight', 'inter-tight-latin-600-normal.woff'),
      weight: 600,
      style: 'normal',
    },
    {
      name: 'Mono',
      data: font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
  ];
  return fonts;
}

const C = {
  bg: '#0d0f12',
  ink: '#e7e5df',
  muted: '#8f939b',
  signal: '#2fd4a6',
  line: '#23272e',
};

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

function cloud(seed: string): Node[] {
  const rand = seeded(seed);
  const clusters = [
    { x: 760, y: 170, s: 55, n: 60, hot: false },
    { x: 960, y: 300, s: 75, n: 90, hot: true },
    { x: 1090, y: 140, s: 40, n: 40, hot: false },
    { x: 840, y: 460, s: 45, n: 40, hot: false },
  ];
  const pts: Node[] = [];
  for (const c of clusters) {
    for (let i = 0; i < c.n; i++) {
      const r = 2 + rand() * 4;
      pts.push(
        h('div', {
          position: 'absolute',
          left: c.x + gaussian(rand) * c.s,
          top: c.y + gaussian(rand) * c.s * 0.8,
          width: r,
          height: r,
          borderRadius: r,
          background: c.hot ? C.signal : C.muted,
          opacity: c.hot ? 0.9 : 0.55,
        }),
      );
    }
  }
  for (let i = 0; i < 90; i++) {
    const r = 1.5 + rand() * 2;
    pts.push(
      h('div', {
        position: 'absolute',
        left: 560 + rand() * 640,
        top: rand() * 630,
        width: r,
        height: r,
        borderRadius: r,
        background: C.muted,
        opacity: 0.3,
      }),
    );
  }
  return pts;
}

export async function renderOg(opts: {
  kicker: string;
  title: string;
  subtitle: string;
  seed: string;
}) {
  const { kicker, title, subtitle, seed } = opts;
  const isName = title === 'Riccardo Bedogni';
  const titleNode = isName
    ? h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Serif',
          fontSize: 132,
          lineHeight: 0.92,
          letterSpacing: -2,
        },
        [
          h('span', { color: C.ink }, 'Riccardo'),
          h('span', { color: C.signal, fontStyle: 'italic' }, 'Bedogni'),
        ],
      )
    : h(
        'div',
        {
          fontFamily: 'Serif',
          fontSize: title.length > 40 ? 72 : 88,
          lineHeight: 1.02,
          color: C.ink,
          letterSpacing: -1,
        },
        title,
      );

  const tree = h(
    'div',
    {
      position: 'relative',
      width: 1200,
      height: 630,
      display: 'flex',
      background: C.bg,
      backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      fontFamily: 'Sans',
      color: C.ink,
    },
    [
      ...cloud(seed),
      // left fade so text stays readable
      h('div', {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 760,
        height: 630,
        backgroundImage: `linear-gradient(90deg, ${C.bg} 55%, rgba(13,15,18,0))`,
      }),
      h(
        'div',
        {
          position: 'absolute',
          left: 72,
          top: 64,
          right: 420,
          bottom: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
        [
          h(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'Mono',
              fontSize: 22,
              color: C.muted,
              letterSpacing: 2,
              textTransform: 'uppercase',
            },
            [h('div', { width: 12, height: 12, borderRadius: 12, background: C.signal }), kicker],
          ),
          titleNode,
          h('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
            h('div', { fontSize: 30, lineHeight: 1.3, color: C.ink, maxWidth: 680 }, subtitle),
            h(
              'div',
              { fontFamily: 'Mono', fontSize: 20, color: C.muted },
              isName ? 'AI Engineer · Data & ML' : 'Riccardo Bedogni · AI Engineer',
            ),
          ]),
        ],
      ),
    ],
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
