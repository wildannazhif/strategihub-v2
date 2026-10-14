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
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { data, MODA_KEYS } from '$lib/data';
	import { MODA } from '$lib/moda';
	import { fmtPct } from '$lib/format';
	import type { ModaKey } from '$lib/data/types';

	const MODA_ICONS = { UDARA: Plane, KA: TrainFront, BUS: Bus, ASDP: Ship, LAUT: Anchor };

	/** Skala visual: 0–300 pnp/trip */
	const SCALE_MAX = 300;
	/** Warna bar (varian terang untuk tema gelap): hijau <100, kuning 100–200, merah >200 */
	const barColor = (v: number) => (v > 200 ? '#fb7185' : v >= 100 ? '#f59e0b' : '#34d399');
	const surgeColor = (v: number) => (v >= 100 ? '#fb7185' : v >= 50 ? '#f59e0b' : '#34d399');

	interface LFStat {
		baseline_lf: number;
		mudik_lf: number;
		balik_lf: number;
		peak_lf: number;
		surge_mudik_pct?: number;
		surge_balik_pct?: number;
		surge_lf_pct?: number;
	}

	/* Bentuk baru: { ALL, provinces, by_province } — fallback bentuk lama (per moda langsung) */
	const lfRaw = data.load_factor_stats as unknown as
		| ({ ALL: Record<ModaKey, LFStat>; provinces: string[]; by_province: Record<string, Record<ModaKey, LFStat>> } & Record<string, unknown>)
		| Record<ModaKey, LFStat>;
	const lfNational = ('ALL' in lfRaw ? (lfRaw as { ALL: Record<ModaKey, LFStat> }).ALL : lfRaw) as Record<ModaKey, LFStat>;
	const lfProvinces =
		'provinces' in lfRaw && Array.isArray((lfRaw as { provinces: unknown }).provinces)
			? ((lfRaw as { provinces: string[] }).provinces as string[])
			: [];
	const lfByProvince = ('by_province' in lfRaw
		? ((lfRaw as { by_province: Record<string, Record<ModaKey, LFStat>> }).by_province ?? {})
		: {}) as Record<string, Record<ModaKey, LFStat>>;

	let prov = $state('ALL');
	const provLabel = $derived(prov === 'ALL' ? 'Seluruh Provinsi (Nasional)' : prov);
	const lfData = $derived(prov === 'ALL' ? lfNational : (lfByProvince[prov] ?? lfNational));

	const fmtLf = (v: number | null | undefined) =>
		v == null || v === 0 ? '–' : v.toLocaleString('id-ID', { maximumFractionDigits: 1 });
	/** Lonjakan tidak terdefinisi bila baseline 0 (tidak ada layanan moda di provinsi ini) */
	const fmtSurge = (s: LFStat, pct: number | null | undefined) =>
		s.baseline_lf === 0 || pct == null ? '–' : fmtPct(pct);

	const rows = $derived(
		[...MODA_KEYS].map((m) => ({ m, s: lfData[m] })).sort((a, b) => b.s.peak_lf - a.s.peak_lf),
	);
	const maxPeak = $derived(Math.max(0, ...MODA_KEYS.map((m) => lfData[m]?.peak_lf ?? 0)));
	const critical = $derived(rows.find((r) => r.s.peak_lf > 0));
	const criticalSurge = $derived(
		critical ? (critical.s.surge_lf_pct ?? Math.max(critical.s.surge_mudik_pct ?? 0, critical.s.surge_balik_pct ?? 0)) : 0,
	);
</script>

<div class="space-y-4">
	<Card class="overflow-hidden">
		<div class="p-4 pb-2 sm:px-5 sm:pt-4">
			<CardHeader
				title="Load Factor per Moda"
				subtitle={`Rasio penumpang per trip armada (pnp/trip) — ${provLabel}`}
			>
				{#snippet icon()}<Gauge size={16} />{/snippet}
				{#snippet action()}
					<label class="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-3">
						<MapPin size={15} class="text-[#38bdf8]" />
						<select
							value={prov}
							onchange={(e) => (prov = (e.target as HTMLSelectElement).value)}
							class="max-w-[240px] cursor-pointer rounded-xl border border-line bg-fill px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-[#38bdf8]"
						>
							<option value="ALL">Seluruh Provinsi (Nasional)</option>
							{#each lfProvinces as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
					</label>
				{/snippet}
			</CardHeader>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[860px] text-left">
				<thead>
					<tr
						class="border-y border-line bg-fill text-[10.5px] uppercase tracking-wider text-ink-3"
					>
						<th class="px-4 py-2 font-bold sm:px-5">Moda</th>
						<th class="px-2 py-2 text-right font-bold">Baseline Normal (1 Jan–12 Mar)</th>
						<th class="px-2 py-2 text-right font-bold">Puncak Mudik (18 Mar)</th>
						<th class="px-2 py-2 text-right font-bold">Puncak Balik (24 Mar)</th>
						<th class="px-2 py-2 text-right font-bold">Lonjakan Beban Mudik</th>
						<th class="px-2 py-2 text-right font-bold">Lonjakan Beban Balik</th>
						<th
							class="hidden px-4 py-2 font-bold sm:px-5 md:table-cell"
							style="width: 22%"
						>
							Tingkat kepadatan
						</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as { m, s } (m)}
						{@const Icon = MODA_ICONS[m]}
						<tr
							class="border-b border-line transition-colors last:border-0 hover:bg-fill"
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
							<td class="px-2 py-2.5 text-right">
								<span
									class="num inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold"
									style={`background: ${surgeColor(s.surge_mudik_pct ?? 0)}1a; color: ${surgeColor(s.surge_mudik_pct ?? 0)}`}
								>
									{fmtSurge(s, s.surge_mudik_pct)}
								</span>
							</td>
							<td class="px-2 py-2.5 text-right">
								<span
									class="num inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold"
									style={`background: ${surgeColor(s.surge_balik_pct ?? 0)}1a; color: ${surgeColor(s.surge_balik_pct ?? 0)}`}
								>
									{fmtSurge(s, s.surge_balik_pct)}
								</span>
							</td>
							<td class="hidden px-4 py-2.5 sm:px-5 md:table-cell">
								<div class="flex items-center gap-2">
									<div class="h-2 flex-1 overflow-hidden rounded-full bg-fill">
										<div
											class="h-2 rounded-full"
											style={`width: ${maxPeak > 0 ? Math.min(100, (s.peak_lf / SCALE_MAX) * 100) : 0}%; background: ${barColor(s.peak_lf)}`}
										></div>
									</div>
									<span class="num w-10 text-right text-[11px] text-ink-3">
										{maxPeak > 0 ? `${Math.round((s.peak_lf / maxPeak) * 100)}%` : '–'}
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-ink-3 sm:px-5">
			Load factor = <strong class="text-ink-2">rasio P/A</strong> (penumpang per trip). Nilai 100 =
			100 penumpang/trip; &gt;200 = kepadatan ekstrem. Normal dihitung dari median periode
			pra-Lebaran (1 Jan–12 Mar 2026). Mudik: 18 Mar • Balik: 24 Mar. Tanda “–” berarti tidak ada
			layanan moda tersebut di wilayah ini. Diurutkan dari puncak tertinggi.
		</p>
	</Card>

	{#if critical}
		<div
			class="flex items-center gap-3 rounded-xl border border-[#fb7185]/20 bg-[#fb7185]/[0.06] px-4 py-3"
		>
			<span
				class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fb7185]/15 text-[#fb7185]"
			>
				<AlertTriangle size={18} />
			</span>
			<p class="text-[12.5px] leading-relaxed text-ink-2">
				<strong class="text-ink">Titik paling kritis: {MODA[critical.m].label} — {provLabel}</strong>
				{' — '}puncak
				<strong class="num text-[#fb7185]">{fmtLf(critical.s.peak_lf)} pnp/trip</strong>
				{' '}({fmtPct(criticalSurge)} vs baseline pra-Lebaran {fmtLf(critical.s.baseline_lf)}).
				{#if critical.m === 'ASDP'}
					Kapal feri tak bisa ditambah secepat bus — antrean menumpuk di Merak–Bakauheni &amp; Ketapang–Gilimanuk.
				{:else}
					Kapasitas armada perlu ditambah menjelang periode puncak.
				{/if}
			</p>
		</div>
	{:else}
		<div
			class="flex items-center gap-3 rounded-xl border border-line bg-fill px-4 py-3"
		>
			<span
				class="grid size-9 shrink-0 place-items-center rounded-lg bg-fill text-ink-3"
			>
				<AlertTriangle size={18} />
			</span>
			<p class="text-[12.5px] leading-relaxed text-ink-2">
				Tidak ada layanan armada tercatat di <strong class="text-ink">{provLabel}</strong>.
			</p>
		</div>
	{/if}
</div>
