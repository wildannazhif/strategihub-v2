<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    icon?: Snippet;
    action?: Snippet;
    class?: string;
  }
  let { title, subtitle, icon, action, class: className = '' }: Props = $props();
</script>

<div class={`mb-3 flex items-start justify-between gap-3 ${className}`}>
  <div class="flex items-center gap-2.5">
    {#if icon}
      <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-fill text-accent">
        {@render icon()}
      </span>
    {/if}
    <div>
      <h3 class="text-[14px] font-bold tracking-tight text-ink">{title}</h3>
      {#if subtitle}
        <p class="mt-0.5 text-[12px] text-ink-3">{subtitle}</p>
      {/if}
    </div>
  </div>
  {#if action}
    <div class="shrink-0">{@render action()}</div>
  {/if}
</div>
