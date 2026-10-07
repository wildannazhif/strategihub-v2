<script lang="ts" generics="T extends string">
  interface Option {
    value: T;
    label: string;
    color?: string;
  }
  interface Props {
    options: Option[];
    value: T;
    onChange: (v: T) => void;
    size?: 'sm' | 'md';
  }
  let { options, value, onChange, size = 'md' }: Props = $props();
</script>

<div
  class={`inline-flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 ${size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]'}`}
>
  {#each options as opt}
    {@const active = opt.value === value}
    <button
      onclick={() => onChange(opt.value)}
      class={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 font-semibold transition-all ${size === 'sm' ? 'py-1' : 'py-1.5'} ${active ? 'bg-white/[0.09] text-ink shadow-sm' : 'text-ink-3 hover:text-ink'}`}
    >
      {#if opt.color}<span class="size-2 rounded-full" style={`background: ${opt.color}`}></span>{/if}
      {opt.label}
    </button>
  {/each}
</div>
