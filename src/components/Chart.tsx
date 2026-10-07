import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  LineChart, BarChart, PieChart, ScatterChart, RadarChart, HeatmapChart,
} from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent, MarkPointComponent, MarkAreaComponent,
  VisualMapComponent, ToolboxComponent, CalendarComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

echarts.use([
  LineChart, BarChart, PieChart, ScatterChart, RadarChart, HeatmapChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent, MarkPointComponent, MarkAreaComponent,
  VisualMapComponent, ToolboxComponent, CalendarComponent,
  CanvasRenderer,
]);

interface ChartProps {
  option: EChartsCoreOption;
  height?: number | string;
  className?: string;
}

export const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', monospace";

export function baseTooltip(dark: boolean) {
  return {
    trigger: 'axis' as const,
    backgroundColor: dark ? '#0f172a' : '#ffffff',
    borderColor: dark ? '#1e293b' : '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: dark ? '#e2e8f0' : '#0f172a', fontFamily: FONT, fontSize: 12 },
    axisPointer: { type: 'line' as const, lineStyle: { color: dark ? '#475569' : '#cbd5e1' } },
    extraCssText:
      'border-radius:12px;box-shadow:0 12px 32px -8px rgba(2,6,23,.18);padding:10px 12px;max-width:320px;',
  };
}

export function fmtNum(v: number): string {
  return Math.round(v).toLocaleString('id-ID');
}

export function axisStyle(dark: boolean) {
  return {
    axisLine: { lineStyle: { color: dark ? '#334155' : '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: { color: dark ? '#94a3b8' : '#64748b', fontFamily: MONO, fontSize: 10.5 },
    splitLine: { lineStyle: { color: dark ? '#1e293b' : '#f1f5f9' } },
  };
}

export function legendStyle(dark: boolean) {
  return {
    textStyle: { color: dark ? '#cbd5e1' : '#475569', fontFamily: FONT, fontSize: 11.5 },
    itemWidth: 14,
    itemHeight: 9,
    icon: 'roundRect' as const,
  };
}

export default function Chart({ option, height = 360, className }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true, lazyUpdate: true });
  }, [option]);

  return <div ref={ref} className={className} style={{ height, width: '100%' }} />;
}
