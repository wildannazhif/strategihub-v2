<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    class?: string;
  }
  let { children, class: className = '' }: Props = $props();
</script>

<div
  class={`rounded-xl border border-line bg-panel shadow-[0_10px_30px_-14px_rgb(15_23_42/0.22)] ${className}`}
>
  {@render children()}
</div>
