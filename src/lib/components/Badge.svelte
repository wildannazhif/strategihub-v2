<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    color?: string;
    class?: string;
  }
  let { children, color = '#38bdf8', class: className = '' }: Props = $props();
</script>

<span
  class={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
  style={`background: ${color}1f; color: ${color}`}
>
  {@render children()}
</span>
