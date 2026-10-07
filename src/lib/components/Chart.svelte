<script lang="ts">
  import { onMount, onDestroy, tick, untrack } from 'svelte';
  import ApexCharts from 'apexcharts';
  import type { ApexOptions } from 'apexcharts';
  import { FONT, MONO, fmtTick } from './chart-utils';

  function isPlainObject(o: unknown): o is Record<string, unknown> {
    return typeof o === 'object' && o !== null && !Array.isArray(o);
  }

  function deepMerge<T>(base: T, over: unknown): T {
    if (over === undefined) return base;
    if (isPlainObject(base) && isPlainObject(over)) {
      const r: Record<string, unknown> = { ...base };
      for (const [k, v] of Object.entries(over)) r[k] = k in r ? deepMerge(r[k], v) : v;
      return r as T;
    }
    return over as T;
  }

  function baseOptions(): ApexOptions {
    return {
      chart: {
        fontFamily: FONT,
        foreColor: '#8b98ad',
        background: 'transparent',
        toolbar: {
          show: true,
          tools: { download: true, selection: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
        },
        zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
        animations: { enabled: true, easing: 'easeinout', speed: 500 },
      },
      theme: { mode: 'dark' },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      grid: {
        borderColor: '#ffffff0d',
        xaxis: { lines: { show: false } },
        padding: { left: 8, right: 12 },
      },
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false,
        style: { fontFamily: FONT, fontSize: '12px' },
      },
      legend: {
        fontFamily: FONT,
        fontSize: '12px',
        fontWeight: 600,
        labels: { colors: '#a7b3c7' },
        markers: { size: 8, shape: 'circle', strokeWidth: 0 },
        itemMargin: { horizontal: 10 },
      },
      xaxis: {
        labels: { style: { fontFamily: MONO, fontSize: '11px', colors: '#8b98ad' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: { fontFamily: MONO, fontSize: '11px', colors: '#8b98ad' },
          formatter: (v: number) => fmtTick(v),
        },
      },
    };
  }

  interface Props {
    type: string;
    series: ApexOptions['series'];
    options?: ApexOptions;
    height?: number | string;
    class?: string;
  }

  let { type, series, options = {}, height = 320, class: className = '' }: Props = $props();

  let el: HTMLDivElement | null = null;
  let chart: ApexCharts | null = null;

  function buildConfig() {
    const merged = deepMerge(baseOptions(), options);
    return {
      ...merged,
      chart: { ...(merged.chart ?? {}), type: type as any, height },
      series,
    };
  }

  onMount(async () => {
    await tick();
    if (!el) return;
    chart = new ApexCharts(el, buildConfig());
    chart.render();
  });

  // Sync chart when reactive inputs change (guarded until mounted)
  $effect(() => {
    const t = type;
    const s = series;
    const o = options;
    const h = height;
    if (!chart) return;
    untrack(() => {
      const merged = deepMerge(baseOptions(), o);
      chart!.updateOptions(
        { ...merged, chart: { ...(merged.chart ?? {}), type: t as any, height: h } },
        false,
        true,
      );
      chart!.updateSeries(s as any, true);
    });
  });

  onDestroy(() => {
    chart?.destroy();
    chart = null;
  });
</script>

<div class={className} bind:this={el}></div>
