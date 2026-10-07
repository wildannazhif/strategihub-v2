<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    class?: string;
  }
  let { children, class: className = '' }: Props = $props();
</script>

<div
  class={`rounded-2xl border border-white/[0.07] bg-panel shadow-[0_8px_32px_-12px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.04)] ${className}`}
>
  {@render children()}
</div>
