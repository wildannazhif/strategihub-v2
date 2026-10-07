<script lang="ts">
  import type { Snippet } from 'svelte';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import TrendingDown from 'lucide-svelte/icons/trending-down';
  import Card from './Card.svelte';

  interface Props {
    label: string;
    value: string;
    sub?: string;
    delta?: number | null;
    deltaLabel?: string;
    icon?: Snippet;
    accent?: string;
    spark?: Snippet;
    class?: string;
  }
  let {
    label, value, sub, delta = null, deltaLabel, icon, accent = '#38bdf8', spark, class: className = '',
  }: Props = $props();

  const positive = $derived(delta != null && delta > 0);
  const negative = $derived(delta != null && delta < 0);
  const deltaColor = $derived(positive ? '#34d399' : negative ? '#fb7185' : '#8b98ad');
</script>

<Card class={`group relative overflow-hidden p-4 transition-colors hover:border-white/[0.12] ${className}`}>
  <div
    class="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-[0.13] blur-2xl transition-opacity group-hover:opacity-[0.22]"
    style={`background: ${accent}`}
  ></div>
  <div class="relative flex items-center gap-3">
    {#if icon}
      <span
        class="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.06]"
        style={`background: ${accent}1f; color: ${accent}`}
      >
        {@render icon()}
      </span>
    {/if}
    <div class="min-w-0 flex-1">
      <p class="truncate text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
      <p class="num mt-1 text-[24px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
    </div>
  </div>
  {#if spark}
    <div class="relative mt-2 h-9">{@render spark()}</div>
  {/if}
  <div class="relative mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
    {#if delta != null}
      <span
        class="num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold"
        style={`background: ${deltaColor}1f; color: ${deltaColor}`}
      >
        {#if positive}<TrendingUp size={12} />{:else if negative}<TrendingDown size={12} />{/if}
        {delta > 0 ? '+' : ''}{delta.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
      </span>
    {/if}
    {#if deltaLabel}<span class="text-[11px] text-ink-3">vs {deltaLabel}</span>{/if}
    {#if sub && !deltaLabel}<span class="text-[11px] text-ink-3">{sub}</span>{/if}
  </div>
  {#if sub && deltaLabel}<p class="relative mt-1 text-[11px] text-ink-3">{sub}</p>{/if}
</Card>
