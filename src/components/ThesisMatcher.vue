<script setup lang="ts">
/**
 * Toy illustration of the thesis idea (not thesis results).
 * Two hospital tables; the diagnosis column of B gets "near-miss" noise:
 * a code replaced by a neighbour in the hierarchy. Exact value overlap
 * collapses; overlap by hierarchical similarity holds until replacements
 * stop being neighbours.
 */
import { computed, ref } from 'vue';

const props = defineProps<{
  labels: {
    noise: string;
    exact: string;
    semantic: string;
    match: string;
    noMatch: string;
    hospitalA: string;
    hospitalB: string;
    examples: string;
    threshold: string;
  };
}>();

type Concept = { name: string; parent: string };
// tiny hierarchy: category → leaf
const leaves: Concept[] = [
  { name: 'CKD stage 3', parent: 'CKD' },
  { name: 'CKD stage 4', parent: 'CKD' },
  { name: 'Type 2 diabetes', parent: 'Diabetes' },
  { name: 'Systolic heart failure', parent: 'Heart failure' },
  { name: 'Essential hypertension', parent: 'Hypertension' },
  { name: 'Asthma, mild', parent: 'Asthma' },
  { name: 'COPD, moderate', parent: 'COPD' },
  { name: 'Atrial fibrillation', parent: 'Arrhythmia' },
];
// near-miss neighbour for each leaf (same parent)…
const siblings = [
  'CKD stage 4',
  'CKD stage 5',
  'Type 1 diabetes',
  'Diastolic heart failure',
  'Secondary hypertension',
  'Asthma, moderate',
  'COPD, severe',
  'Atrial flutter',
];
// …and, at the highest noise, a few replacements that aren't neighbours at all
const unrelated = new Set([6, 7]);
const unrelatedNames = ['', '', '', '', '', '', 'Fractured wrist', 'Migraine'];

const THRESHOLD = 0.5;
const noise = ref(0.5);

const perturbed = computed(() => {
  const k = Math.round(noise.value * leaves.length);
  return leaves.map((c, i) => {
    if (i >= k) return { from: c.name, to: c.name, kind: 'same' as const };
    if (unrelated.has(i)) return { from: c.name, to: unrelatedNames[i], kind: 'far' as const };
    // sibling: avoid colliding with a value already present (CKD 3 → CKD 4 exists)
    return { from: c.name, to: siblings[i], kind: 'near' as const };
  });
});

/** Jaccard where two values "overlap" if equal (exact) or within the hierarchy (semantic). */
const scores = computed(() => {
  const A = leaves.map((c) => c.name);
  const B = perturbed.value.map((p) => p.to);
  const setA = new Set(A);
  const setB = new Set(B);
  const inter = [...setB].filter((v) => setA.has(v)).length;
  const exact = inter / new Set([...A, ...B]).size;
  const n = perturbed.value.length;
  const far = perturbed.value.filter((p) => p.kind === 'far').length;
  const semantic = (n - far) / (n + far);
  return { exact, semantic };
});

const examples = computed(() => perturbed.value.filter((p) => p.kind !== 'same').slice(0, 3));

const rows = computed(() => [
  { a: 'patient_sex', b: 'gender', exact: 1, semantic: 1 },
  { a: 'birth_year', b: 'yob', exact: 0.92, semantic: 0.92 },
  {
    a: 'diagnosis',
    b: 'condition',
    exact: scores.value.exact,
    semantic: scores.value.semantic,
    live: true,
  },
]);

const fmt = (v: number) => v.toFixed(2);
// layout (viewBox units)
const W = 560;
const rowY = (i: number) => 52 + i * 64;
const arc = (i: number) => {
  const y = rowY(i) + 18;
  return `M168 ${y} C ${W / 2} ${y - 26}, ${W / 2} ${y - 26}, ${W - 168} ${y}`;
};
</script>

<template>
  <div class="tm">
    <div class="tm__controls">
      <label class="tm__slider">
        <span class="label">{{ props.labels.noise }}</span>
        <input v-model.number="noise" type="range" min="0" max="1" step="0.125" />
        <output class="mono">{{ Math.round(noise * 100) }}%</output>
      </label>
    </div>

    <svg
      class="tm__svg"
      :viewBox="`0 0 ${W} 250`"
      role="img"
      :aria-label="`${props.labels.exact} ${fmt(scores.exact)} · ${props.labels.semantic} ${fmt(scores.semantic)}`"
    >
      <text x="16" y="24" class="tm__head">{{ props.labels.hospitalA }}</text>
      <text :x="W - 16" y="24" class="tm__head" text-anchor="end">
        {{ props.labels.hospitalB }}
      </text>
      <g v-for="(r, i) in rows" :key="r.a">
        <rect x="16" :y="rowY(i)" width="152" height="36" rx="8" class="tm__col" />
        <text x="30" :y="rowY(i) + 23" class="tm__name">{{ r.a }}</text>
        <rect :x="W - 168" :y="rowY(i)" width="152" height="36" rx="8" class="tm__col" />
        <text :x="W - 154" :y="rowY(i) + 23" class="tm__name">{{ r.b }}</text>

        <!-- exact arc (top) and semantic arc, drawn on the same path with an offset -->
        <path
          :d="arc(i)"
          class="tm__arc tm__arc--exact"
          :class="{ 'is-off': r.exact < THRESHOLD }"
          :style="{ strokeWidth: 1 + r.exact * 2.5 }"
          transform="translate(0,-5)"
        />
        <path
          :d="arc(i)"
          class="tm__arc tm__arc--sem"
          :class="{ 'is-off': r.semantic < THRESHOLD }"
          :style="{ strokeWidth: 1 + r.semantic * 2.5 }"
          transform="translate(0,7)"
        />
        <text :x="W / 2" :y="rowY(i) - 10" text-anchor="middle" class="tm__score">
          <tspan class="tm__score--exact">{{ fmt(r.exact) }}</tspan>
          <tspan dx="10" class="tm__score--sem">{{ fmt(r.semantic) }}</tspan>
        </text>
      </g>
    </svg>

    <div class="tm__legend">
      <p>
        <span class="sw sw--exact" aria-hidden="true"></span>{{ props.labels.exact }}:
        <strong class="mono">{{ fmt(scores.exact) }}</strong>
        <span class="state" :class="scores.exact >= THRESHOLD ? 'ok' : 'ko'">
          {{ scores.exact >= THRESHOLD ? props.labels.match : props.labels.noMatch }}
        </span>
      </p>
      <p>
        <span class="sw sw--sem" aria-hidden="true"></span>{{ props.labels.semantic }}:
        <strong class="mono">{{ fmt(scores.semantic) }}</strong>
        <span class="state" :class="scores.semantic >= THRESHOLD ? 'ok' : 'ko'">
          {{ scores.semantic >= THRESHOLD ? props.labels.match : props.labels.noMatch }}
        </span>
      </p>
      <p class="tm__thr mono">{{ props.labels.threshold }} = {{ THRESHOLD }}</p>
    </div>

    <div v-if="examples.length" class="tm__examples" aria-live="polite">
      <p class="label">{{ props.labels.examples }}</p>
      <ul>
        <li v-for="e in examples" :key="e.from" class="mono">
          {{ e.from }} <span aria-hidden="true">→</span> <span :class="e.kind">{{ e.to }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tm {
  display: grid;
  gap: var(--s-4);
}
.tm__slider {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--s-3);
}
.tm__slider input {
  width: 100%;
  accent-color: var(--signal);
}
.tm__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.tm__head {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--ink-muted);
}
.tm__col {
  fill: var(--bg);
  stroke: var(--line-strong);
}
.tm__name {
  font-family: var(--font-mono);
  font-size: 13px;
  fill: var(--ink);
}
.tm__arc {
  fill: none;
  transition:
    stroke-width var(--dur) var(--ease),
    opacity var(--dur) var(--ease);
}
.tm__arc--exact {
  stroke: var(--data);
}
.tm__arc--sem {
  stroke: var(--signal);
}
.tm__arc.is-off {
  stroke-dasharray: 3 5;
  opacity: 0.45;
}
.tm__score {
  font-family: var(--font-mono);
  font-size: 12px;
}
.tm__score--exact {
  fill: var(--data);
}
.tm__score--sem {
  fill: var(--signal);
}
.tm__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-5);
  font-size: 0.92rem;
}
.tm__legend p {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.sw {
  width: 18px;
  height: 3px;
  border-radius: 2px;
}
.sw--exact {
  background: var(--data);
}
.sw--sem {
  background: var(--signal);
}
.state {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
}
.state.ok {
  background: var(--signal-soft);
  color: var(--signal);
}
.state.ko {
  background: var(--bg-sunken);
  color: var(--ink-muted);
  text-decoration: line-through;
}
.tm__thr {
  color: var(--ink-muted);
  font-size: 0.78rem;
}
.tm__examples ul {
  margin: var(--s-2) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--s-1);
  font-size: 0.82rem;
}
.tm__examples .near {
  color: var(--signal);
}
.tm__examples .far {
  color: var(--ink-muted);
  text-decoration: underline wavy;
}
</style>
