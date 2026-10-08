<script setup lang="ts">
/**
 * Command palette (⌘K / Ctrl+K / "/"). Presented as a query over the site's
 * "space": every result shows its similarity to what you typed.
 * Opens from the keyboard or any element with [data-palette-open].
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type Item = {
  id: string;
  group: 'sections' | 'projects' | 'actions';
  title: string;
  hint?: string;
  keywords?: string;
  href?: string;
  action?: 'theme' | 'copyEmail' | 'external';
};

const props = defineProps<{
  items: Item[];
  email: string;
  labels: {
    placeholder: string;
    empty: string;
    sections: string;
    projects: string;
    actions: string;
    hint: string;
    close: string;
    copied: string;
    open: string;
  };
}>();

const open = ref(false);
const query = ref('');
const active = ref(0);
const toast = ref('');
const input = ref<HTMLInputElement | null>(null);
const list = ref<HTMLElement | null>(null);
let returnFocus: HTMLElement | null = null;

/**
 * Subsequence match with bonuses for word starts and contiguous runs,
 * normalised to [0, 1] so it can be shown as a similarity score.
 */
function score(q: string, text: string): number {
  if (!q) return 1;
  const t = text.toLowerCase();
  const s = q.toLowerCase().trim();
  if (!s) return 1;
  if (t.includes(s))
    return Math.min(1, 0.82 + (s.length / t.length) * 0.18 + (t.startsWith(s) ? 0.05 : 0));
  let ti = 0;
  let first = -1;
  let hits = 0;
  let run = 0;
  let bonus = 0;
  for (const ch of s) {
    if (ch === ' ') continue;
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    if (first === -1) first = found;
    if (found === ti) run++;
    else run = 0;
    if (found === 0 || /[\s\-·/]/.test(t[found - 1])) bonus += 0.6;
    bonus += run * 0.3;
    hits++;
    ti = found + 1;
  }
  // letters scattered across the string are a weak signal
  const compact = hits / Math.max(hits, ti - first);
  const raw = ((hits + bonus) / (hits * 2.2)) * compact;
  return Math.max(0.05, Math.min(0.8, raw));
}

const results = computed(() => {
  const q = query.value;
  return props.items
    .map((it) => ({
      ...it,
      score: Math.max(score(q, it.title), score(q, `${it.keywords ?? ''}`) * 0.9),
    }))
    .filter((it) => it.score > 0.18)
    .sort((a, b) => (q ? b.score - a.score : 0));
});

const groups = computed(() => {
  const order: Item['group'][] = ['sections', 'projects', 'actions'];
  if (query.value) return [{ key: 'all', label: '', items: results.value }];
  return order
    .map((g) => ({
      key: g,
      label: props.labels[g],
      items: results.value.filter((r) => r.group === g),
    }))
    .filter((g) => g.items.length);
});
const flat = computed(() => groups.value.flatMap((g) => g.items));

watch(query, () => (active.value = 0));

function show() {
  if (open.value) return;
  returnFocus = document.activeElement as HTMLElement | null;
  open.value = true;
  query.value = '';
  active.value = 0;
  document.documentElement.style.overflow = 'hidden';
  nextTick(() => input.value?.focus());
}
function hide() {
  open.value = false;
  document.documentElement.style.overflow = '';
  returnFocus?.focus?.();
}

function setTheme() {
  const root = document.documentElement;
  const current =
    root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* private mode */
  }
  document
    .querySelectorAll('[data-theme-toggle]')
    .forEach((b) => b.setAttribute('aria-pressed', String(next === 'dark')));
  window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
}

async function run(item: Item | undefined) {
  if (!item) return;
  if (item.action === 'theme') {
    setTheme();
    return hide();
  }
  if (item.action === 'copyEmail') {
    try {
      await navigator.clipboard.writeText(props.email);
      toast.value = props.labels.copied;
      setTimeout(() => (toast.value = ''), 1600);
    } catch {
      window.location.href = `mailto:${props.email}`;
    }
    return hide();
  }
  if (item.href) {
    hide();
    if (item.action === 'external') window.open(item.href, '_blank', 'noopener');
    else window.location.href = item.href;
  }
}

function move(delta: number) {
  const n = flat.value.length;
  if (!n) return;
  active.value = (active.value + delta + n) % n;
  nextTick(() =>
    list.value
      ?.querySelector(`[data-index="${active.value}"]`)
      ?.scrollIntoView({ block: 'nearest' }),
  );
}

function onInputKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    move(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    move(-1);
  } else if (e.key === 'Home') {
    active.value = 0;
  } else if (e.key === 'End') {
    active.value = Math.max(0, flat.value.length - 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    run(flat.value[active.value]);
  }
}

/** keep Tab inside the dialog */
function trap(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const focusables = Array.from(
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('input, button'),
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onGlobalKey(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    open.value ? hide() : show();
  } else if (e.key === '/' && !typing && !open.value) {
    e.preventDefault();
    show();
  } else if (e.key === 'Escape' && open.value) {
    e.preventDefault();
    hide();
  }
}
const onOpenRequest = (e: Event) => {
  if ((e.target as HTMLElement)?.closest?.('[data-palette-open]')) {
    e.preventDefault();
    show();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey);
  document.addEventListener('click', onOpenRequest);
  document.querySelectorAll('[data-palette-open]').forEach((b) => b.removeAttribute('disabled'));
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey);
  document.removeEventListener('click', onOpenRequest);
});

const optionId = (i: number) => `cp-opt-${i}`;
const indexOf = (item: Item) => flat.value.findIndex((f) => f.id === item.id);
</script>

<template>
  <div v-if="open" class="cp" @keydown="trap">
    <div class="cp__backdrop" @click="hide"></div>
    <div class="cp__panel" role="dialog" aria-modal="true" :aria-label="labels.open">
      <div class="cp__search">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="5" cy="7" r="1.6" />
          <circle cx="12" cy="5" r="1.2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="7" cy="14" r="1.3" />
        </svg>
        <input
          ref="input"
          v-model="query"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="cp-list"
          :aria-activedescendant="flat.length ? optionId(active) : undefined"
          :placeholder="labels.placeholder"
          :aria-label="labels.placeholder"
          spellcheck="false"
          autocomplete="off"
          @keydown="onInputKey"
        />
        <button type="button" class="cp__esc mono" @click="hide">
          <span aria-hidden="true">esc</span><span class="visually-hidden">{{ labels.close }}</span>
        </button>
      </div>

      <div id="cp-list" ref="list" class="cp__list" role="listbox" :aria-label="labels.open">
        <template v-for="g in groups" :key="g.key">
          <p v-if="g.label" class="cp__group label" role="presentation">{{ g.label }}</p>
          <div
            v-for="item in g.items"
            :id="optionId(indexOf(item))"
            :key="item.id"
            :data-index="indexOf(item)"
            role="option"
            :aria-selected="indexOf(item) === active"
            class="cp__opt"
            :class="{ 'is-active': indexOf(item) === active }"
            @mousemove="active = indexOf(item)"
            @click="run(item)"
          >
            <span class="cp__dot" aria-hidden="true"></span>
            <span class="cp__title">{{ item.title }}</span>
            <span v-if="item.hint" class="cp__hint">{{ item.hint }}</span>
            <span v-if="query" class="cp__score mono" aria-hidden="true">{{
              item.score.toFixed(2)
            }}</span>
          </div>
        </template>
        <p v-if="!flat.length" class="cp__empty mono">{{ labels.empty }}</p>
      </div>

      <p class="cp__foot mono" aria-hidden="true">
        <span><kbd>↑</kbd><kbd>↓</kbd> {{ labels.hint }}</span>
        <span><kbd>↵</kbd></span>
      </p>
    </div>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite">{{ toast }}</p>
  <div v-if="toast" class="cp__toast mono" aria-hidden="true">{{ toast }}</div>
</template>

<style scoped>
.cp {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  justify-items: center;
  align-items: start;
  padding: 12vh var(--s-4) var(--s-4);
}
.cp__backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg-sunken) 55%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade var(--dur-fast) var(--ease);
}
.cp__panel {
  position: relative;
  width: min(620px, 100%);
  max-height: 70vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--bg-raised);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-l);
  box-shadow: 0 30px 80px -30px rgb(0 0 0 / 0.45);
  overflow: hidden;
  animation: rise var(--dur) var(--ease);
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
}
.cp__search {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--line);
}
.cp__search svg {
  fill: var(--signal);
  flex: none;
}
.cp__search input {
  flex: 1;
  min-width: 0;
  padding: var(--s-2) 0;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 1.05rem;
  outline: none;
}
.cp__search input::placeholder {
  color: var(--ink-muted);
}
.cp__esc {
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-s);
  background: none;
  font-size: 0.72rem;
  color: var(--ink-muted);
  cursor: pointer;
}
.cp__list {
  overflow-y: auto;
  padding: var(--s-2);
  overscroll-behavior: contain;
}
.cp__group {
  padding: var(--s-3) var(--s-3) var(--s-1);
}
.cp__opt {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius-m);
  cursor: pointer;
}
.cp__opt.is-active {
  background: var(--signal-soft);
}
.cp__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--line-strong);
}
.cp__opt.is-active .cp__dot {
  background: var(--signal);
}
.cp__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cp__hint {
  font-size: 0.8rem;
  color: var(--ink-muted);
  white-space: nowrap;
}
.cp__score {
  font-size: 0.75rem;
  color: var(--ink-muted);
}
.cp__opt.is-active .cp__score {
  color: var(--signal);
}
.cp__empty {
  padding: var(--s-6) var(--s-4);
  text-align: center;
  color: var(--ink-muted);
}
.cp__foot {
  display: flex;
  justify-content: space-between;
  padding: var(--s-2) var(--s-4);
  border-top: 1px solid var(--line);
  font-size: 0.72rem;
  color: var(--ink-muted);
}
kbd {
  display: inline-block;
  min-width: 1.4em;
  margin-right: 0.25em;
  padding: 0 0.3em;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  text-align: center;
  font-family: inherit;
}
.cp__toast {
  position: fixed;
  left: 50%;
  bottom: var(--s-6);
  z-index: 101;
  transform: translateX(-50%);
  padding: var(--s-2) var(--s-4);
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  font-size: 0.8rem;
}
@media (max-width: 560px) {
  .cp {
    padding-top: var(--s-4);
  }
  .cp__hint {
    display: none;
  }
}
</style>
