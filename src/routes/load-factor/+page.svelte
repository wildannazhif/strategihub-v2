<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import CardHeader from '$lib/components/CardHeader.svelte';
	import Plane from 'lucide-svelte/icons/plane';
	import TrainFront from 'lucide-svelte/icons/train-front';
	import Bus from 'lucide-svelte/icons/bus';
	import Ship from 'lucide-svelte/icons/ship';
	import Anchor from 'lucide-svelte/icons/anchor';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Gauge from 'lucide-svelte/icons/gauge';
	import { data, MODA_KEYS } from '$lib/data';
	import { MODA } from '$lib/moda';
	import { fmtPct } from '$lib/format';

	const MODA_ICONS = { UDARA: Plane, KA: TrainFront, BUS: Bus, ASDP: Ship, LAUT: Anchor };

	/** Skala visual: 0–300 pnp/trip */
	const SCALE_MAX = 300;
	/** Warna bar (varian terang untuk tema gelap): hijau <100, kuning 100–200, merah >200 */
	const barColor = (v: number) => (v > 200 ? '#fb7185' : v >= 100 ? '#f59e0b' : '#34d399');
	const surgeColor = (v: number) => (v >= 100 ? '#fb7185' : v >= 50 ? '#f59e0b' : '#34d399');

	const fmtLf = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });

	const stats = data.load_factor_stats;

	const rows = $derived(
		[...MODA_KEYS].map((m) => ({ m, s: stats[m] })).sort((a, b) => b.s.peak_lf - a.s.peak_lf)
	);
	const asdp = $derived(stats.ASDP);
	const maxPeak = $derived(Math.max(...MODA_KEYS.map((m) => stats[m].peak_lf)));
</script>

<div class="space-y-4">
	<Card class="overflow-hidden">
		<div class="p-4 pb-2 sm:px-5 sm:pt-4">
			<CardHeader
				title="Load Factor per Moda"
				subtitle="Rasio penumpang per trip armada (pnp/trip)"
			>
				{#snippet icon()}<Gauge size={16} />{/snippet}
				{#snippet action()}
					<span class="text-[11px] text-ink-3">ambang padat 100</span>
				{/snippet}
			</CardHeader>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr
						class="border-y border-white/[0.06] bg-white/[0.02] text-[10.5px] uppercase tracking-wider text-ink-3"
					>
						<th class="px-4 py-2 font-bold sm:px-5">Moda</th>
						<th class="px-2 py-2 text-right font-bold">Normal</th>
						<th class="px-2 py-2 text-right font-bold">Mudik</th>
						<th class="px-2 py-2 text-right font-bold">Balik</th>
						<th class="px-2 py-2 text-right font-bold">Puncak</th>
						<th class="px-2 py-2 text-right font-bold">vs Normal</th>
						<th
							class="hidden px-4 py-2 font-bold sm:px-5 md:table-cell"
							style="width: 26%"
						>
							Tingkat kepadatan
						</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as { m, s } (m)}
						{@const Icon = MODA_ICONS[m]}
						<tr
							class="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]"
						>
							<td class="px-4 py-2.5 sm:px-5">
								<div class="flex items-center gap-2">
									<span
										class="grid size-7 shrink-0 place-items-center rounded-lg"
										style={`background: ${MODA[m].colorSoft}; color: ${MODA[m].color}`}
									>
										<Icon size={16} />
									</span>
									<span class="text-[12.5px] font-bold text-ink">{MODA[m].label}</span>
								</div>
							</td>
							<td class="num px-2 py-2.5 text-right text-[12.5px] text-ink-3">
								{fmtLf(s.baseline_lf)}
							</td>
							<td class="num px-2 py-2.5 text-right text-[12.5px] font-semibold text-ink-2">
								{fmtLf(s.mudik_lf)}
							</td>
							<td class="num px-2 py-2.5 text-right text-[12.5px] font-semibold text-ink-2">
								{fmtLf(s.balik_lf)}
							</td>
							<td
								class="num px-2 py-2.5 text-right text-[13px] font-extrabold"
								style={`color: ${barColor(s.peak_lf)}`}
							>
								{fmtLf(s.peak_lf)}
							</td>
							<td class="px-2 py-2.5 text-right">
								<span
									class="num inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold"
									style={`background: ${surgeColor(s.surge_lf_pct)}1a; color: ${surgeColor(s.surge_lf_pct)}`}
								>
									{fmtPct(s.surge_lf_pct)}
								</span>
							</td>
							<td class="hidden px-4 py-2.5 sm:px-5 md:table-cell">
								<div class="flex items-center gap-2">
									<div class="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
										<div
											class="h-2 rounded-full"
											style={`width: ${Math.min(100, (s.peak_lf / SCALE_MAX) * 100)}%; background: ${barColor(s.peak_lf)}`}
										></div>
									</div>
									<span class="num w-10 text-right text-[11px] text-ink-3">
										{Math.round((s.peak_lf / maxPeak) * 100)}%
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="border-t border-white/[0.06] px-4 py-2.5 text-[11px] leading-relaxed text-ink-3 sm:px-5">
			Load factor = <strong class="text-ink-2">rasio P/A</strong> (penumpang per trip). Nilai 100 =
			100 penumpang/trip; &gt;200 = kepadatan ekstrem. Diurutkan dari puncak tertinggi.
		</p>
	</Card>

	<div
		class="flex items-center gap-3 rounded-xl border border-[#fb7185]/20 bg-[#fb7185]/[0.06] px-4 py-3"
	>
		<span
			class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fb7185]/15 text-[#fb7185]"
		>
			<AlertTriangle size={18} />
		</span>
		<p class="text-[12.5px] leading-relaxed text-ink-2">
			<strong class="text-ink">Titik paling kritis: ASDP Penyeberangan</strong>
			{' — '}puncak
			<strong class="num text-[#fb7185]">{fmtLf(asdp.peak_lf)} pnp/trip</strong>
			{' '}({fmtPct(asdp.surge_lf_pct)} vs normal {fmtLf(asdp.baseline_lf)}). Kapal feri tak bisa
			ditambah secepat bus — antrean menumpuk di Merak–Bakauheni &amp; Ketapang–Gilimanuk.
		</p>
	</div>
</div>
