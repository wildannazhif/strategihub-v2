<script lang="ts">
  import type { Snippet } from 'svelte';
  import { themeStore } from '$lib/theme.svelte';

  interface Props {
    children: Snippet;
    color?: string;
    class?: string;
  }
  let { children, color = '#38bdf8', class: className = '' }: Props = $props();

  // Di light mode, teks warna aksen murni kontrasnya rendah di atas tint terang —
  // campur dengan ink agar tetap terbaca, background tint sedikit lebih pekat.
  const dark = $derived(themeStore.current === 'dark');
  const style = $derived(
    dark
      ? `background: ${color}1f; color: ${color}`
      : `background: ${color}22; color: color-mix(in srgb, ${color} 68%, #0f172a)`,
  );
</script>

<span
  class={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
  {style}
>
  {@render children()}
</span>
