/** Shared types for StrategiHub 2026 dashboard data (dashboard.json) */

export type ModaKey = 'UDARA' | 'KA' | 'BUS' | 'ASDP' | 'LAUT';
export const MODA_KEYS: ModaKey[] = ['UDARA', 'KA', 'BUS', 'ASDP', 'LAUT'];

export interface DailyRow {
  date: string;
  UDARA: number; KA: number; BUS: number; ASDP: number; LAUT: number; TOTAL: number;
  pdat_UDARA: number; pdat_KA: number; pdat_BUS: number; pdat_ASDP: number; pdat_LAUT: number; pdat_TOTAL: number;
  pbrg_UDARA: number; pbrg_KA: number; pbrg_BUS: number; pbrg_ASDP: number; pbrg_LAUT: number; pbrg_TOTAL: number;
  arm_UDARA: number; arm_KA: number; arm_BUS: number; arm_ASDP: number; arm_LAUT: number; arm_TOTAL: number;
  adat_UDARA: number; adat_KA: number; adat_BUS: number; adat_ASDP: number; adat_LAUT: number; adat_TOTAL: number;
  abrg_UDARA: number; abrg_KA: number; abrg_BUS: number; abrg_ASDP: number; abrg_LAUT: number; abrg_TOTAL: number;
  [k: string]: number | string;
}

export interface MonthlyRow {
  bulan: string;
  label: string;
  UDARA: number; KA: number; BUS: number; ASDP: number; LAUT: number; TOTAL: number;
  share_UDARA: number; share_KA: number; share_BUS: number; share_ASDP: number; share_LAUT: number;
  [k: string]: number | string;
}

export interface SurgeModa {
  baseline: number;
  peak_mudik: number; surge_mudik_pct: number;
  peak_balik1: number; surge_balik1_pct: number;
  peak_balik2: number; surge_balik2_pct: number;
}

export interface LoadFactorModa {
  baseline_lf: number; mudik_lf: number; balik_lf: number; peak_lf: number;
  surge_lf_pct: number; surge_mudik_pct: number; surge_balik_pct: number;
}

/** Load factor: nasional (ALL) + per provinsi. Baseline = median pra-Lebaran 1 Jan–12 Mar 2026. */
export interface LoadFactorStats {
  ALL: Record<ModaKey, LoadFactorModa>;
  provinces: string[];
  by_province: Record<string, Record<ModaKey, LoadFactorModa>>;
}

export interface HubRow {
  nama_prasarana: string;
  provinsi: string;
  pnp: number; p_dat: number; p_brg: number;
  arm: number; a_dat: number; a_brg: number;
}

export interface SpatialNode {
  id: string;
  m: ModaKey;           // moda
  nama: string;
  p: string;            // provinsi
  tipe: string;         // tipe prasarana
  lat: number; lon: number;
  has_coords: boolean;
  pnp: number; arm: number;
  p_dat: number; p_brg: number;
}

export interface MetricSummary {
  label: string;
  unit: string;
  formula: string;
  ytd: number;
  avg: number;
  peak_date: string;
  peak_val: number;
  peak_desc: string;
  peak_surge_pct: number;
  mudik_date: string;
  mudik_val: number;
  mudik_desc: string;
  mudik_surge_pct: number;
  /** Median harian pra-Lebaran 1 Jan–12 Mar 2026 (71 hari). */
  baseline: number;
}

export interface ForecastModeBreakdown {
  passengers_2026: number;
  passengers_2025: number;
  diff: number;
  yoy_pct: number;
  share_pct_2026: number;
  share_pct_2025: number;
  armada_2026: number;
  armada_2025: number;
}

export interface ForecastScenarioSummary {
  total_passengers: number;
  total_passengers_2025: number;
  diff_passengers: number;
  yoy_total_pct: number;
  avg_daily_passengers: number;
  avg_daily_passengers_2025: number;
  yoy_avg_pct: number;
  total_armada: number;
  total_armada_2025: number;
  yoy_armada_pct: number;
  all_time_peak_date: string;
  all_time_peak_val: number;
  all_time_peak_yoy: number;
  xmas_peak_date: string;
  xmas_peak_val: number;
  xmas_peak_val_2025: number;
  xmas_peak_yoy: number;
  ny_peak_date: string;
  ny_peak_val: number;
  ny_peak_val_2025: number;
  ny_peak_yoy: number;
  mode_breakdown?: Record<ModaKey, ForecastModeBreakdown>;
}

/** Satu titik harian forecast — skema BARU (v1 HEAD 30a68dd). Field lama
 *  (hw_baseline, scenario_factor, status, pnp_2025, yoy_*, *_2025 per moda,
 *  arm_*_2025) sudah tidak ada; YoY dihitung di UI dari TOTAL_2025/arm_2025. */
export interface ForecastPoint {
  date: string;
  dow: number; // 0 = Senin
  day_name: string;
  is_nataru: boolean;
  TOTAL: number;
  UDARA?: number; KA?: number; BUS?: number; ASDP?: number; LAUT?: number;
  arm_UDARA?: number; arm_KA?: number; arm_BUS?: number; arm_ASDP?: number; arm_LAUT?: number;
  arm_TOTAL?: number;
  arm_2025?: number;
  TOTAL_2025?: number;
  ci_lower?: number;
  ci_upper?: number;
  shock_factor?: number;
  [k: string]: number | string | boolean | undefined;
}

export interface ForecastChampionModel {
  name: string;
  code: string;
  mape: number;
  rmse: number;
  mae: number;
  wape: number;
  dir_acc: number;
}

export interface ForecastBenchmark {
  model_name: string;
  model_code: string;
  mape: number;
  wape: number;
  rmse: number;
  mae: number;
  dir_acc: number;
  is_stable: boolean;
  pred_mean: number;
  rank: number;
}

export interface ForecastBenchmark2025 {
  total_passengers: number;
  avg_daily_passengers: number;
  total_armada: number;
  xmas_peak_val: number;
  ny_peak_val: number;
  modes: Record<ModaKey, { passengers: number; armada: number; share_pct: number }>;
}

export interface ForecastProvince {
  champion_model: ForecastChampionModel;
  benchmarks: ForecastBenchmark[];
  metrics: { TOTAL: ForecastChampionModel };
  benchmark_2025: ForecastBenchmark2025;
  summaries: Record<'moderat' | 'optimis' | 'konservatif', ForecastScenarioSummary>;
  /** Per provinsi hanya skenario moderat (UI v1 mengunci moderat). */
  scenarios: { moderat: ForecastPoint[] };
  history_2026: {
    dates: string[];
    TOTAL: number[];
    UDARA: number[];
    KA: number[];
    BUS: number[];
    ASDP: number[];
    LAUT: number[];
  };
  /** "MM-DD" -> TOTAL 2025 (rekonstruksi alokasi proporsional dari nasional). */
  history_2025_md: Record<string, number>;
}

export interface ForecastNataru {
  meta: {
    model: string;
    training_dataset: string;
    train_start: string;
    train_end: string;
    train_days: number;
    forecast_start: string;
    forecast_end: string;
    horizon_days: number;
    parameters?: Record<string, unknown>;
    scenario_factors?: Record<'moderat' | 'optimis' | 'konservatif', number>;
    scenario_note?: string;
    ci_method?: string;
  };
  metrics?: { TOTAL: ForecastChampionModel };
  champion_model: ForecastChampionModel;
  benchmarks: ForecastBenchmark[];
  benchmark_2025?: ForecastBenchmark2025;
  shock_factors?: unknown;
  summaries: Record<'moderat' | 'optimis' | 'konservatif', ForecastScenarioSummary>;
  scenarios: Record<'moderat' | 'optimis' | 'konservatif', ForecastPoint[]>;
  provinces: string[];
  by_province: Record<string, ForecastProvince>;
  automodel_meta_summary: Record<string, { winner: string; mape: number; rmse: number; top3: string[] }>;
}

export interface SimpulRecommendation {
  id: string;
  name: string;
  prov: string;
  moda: string;
  modaLabel: string;
  saranaType: string;
  saranaUnit: string;
  pnpBiasa: number;
  armBiasa: number;
  pnpPuncak: number;
  armPuncak: number;
  lfBiasa: number;
  lfPuncak: number;
  loadRatio: number;
  pctTambah: number;
  addArm: number;
  totalArm: number;
  /** Nilai baru (v1 HEAD): "Sangat Kritis" | "Tinggi / Kritis" | "Padat Tinggi" | "Terkendali".
   *  Label lama "Padat" sudah tidak ada. pnpBiasa/armBiasa kini median
   *  pra-Lebaran 1 Jan–12 Mar 2026 (bukan mean Februari). */
  statusText: string;
  statusBadge: string;
  fieldAction: string;
}

/** Satu bulan tren provinsi: val = nilai metrik blok ini; vs_median = deviasi
 *  terhadap baseline median pra-Lebaran (BUKAN MoM). brg/dom_moda/dom_pct
 *  dibuang (brg == val; dom_* turunan dari modas). */
export interface ProvinceMonthlyPoint {
  m: number;
  name: string;
  short: string;
  val: number;
  mom: number | null;
  vs_median: number | null;
  is_peak: boolean;
  modas: Record<ModaKey, number>;
}

export interface ProvinceMonthlyEntry {
  provinsi: string;
  total: number;
  peak_month: string;
  peak_month_num: number;
  peak_vol: number;
  /** Median harian pra-Lebaran x 30,4375 (ekuivalen bulanan). */
  median_vol: number;
  moda_baselines: Record<ModaKey, number>;
  max_jump_month: string;
  /** Lonjakan bulan puncak vs median (definisi baru; dulu MoM). */
  max_jump_pct: number;
  max_jump_vs_median_pct: number;
  monthly: ProvinceMonthlyPoint[];
}

export interface ProvinceMonthlyMonth {
  month: number;
  name: string;
  top_vol: { provinsi: string; vol: number }[];
  top_growth: { provinsi: string; mom: number | null; vs_median: number | null; vol: number }[];
}

export interface ProvinceMonthlyBlock {
  provinces: string[];
  /** Kunci "ALL" + 38 provinsi (kunci duplikat "Seluruh Provinsi" dibuang). */
  by_province: Record<string, ProvinceMonthlyEntry>;
  by_month: Record<string, ProvinceMonthlyMonth>;
}

export type ProvinceMetricBlock = 'pnp_brg' | 'pnp_dat' | 'pnp_tot' | 'arm_brg' | 'arm_dat' | 'arm_tot';

export type ProvinceMonthlyData = Record<ProvinceMetricBlock, ProvinceMonthlyBlock>;

export type GeoJsonCoordinates = number | GeoJsonCoordinates[];

export interface ProvinceGeoJSON {
  type: string;
  name?: string;
  features: {
    type: string;
    properties: { id: string; KODE_PROV: string; PROVINSI: string };
    geometry: { type: string; coordinates: GeoJsonCoordinates };
  }[];
}

export interface DashboardData {
  daily_timeline: DailyRow[];
  monthly_summary: MonthlyRow[];
  lebaran_daily: DailyRow[];
  surge_summary: Record<ModaKey | 'TOTAL', SurgeModa>;
  load_factor_stats: LoadFactorStats;
  top_hubs_peak: Record<ModaKey, HubRow[]>;
  top_hubs_ytd: Record<ModaKey, HubRow[]>;
  dow_summary: DailyRow[];
  spatial_nodes: SpatialNode[];
  metrics_summary: Record<string, MetricSummary>;
  meta: {
    total_clean_rows: number;
    total_passengers_ytd: number;
    total_armada_ytd: number;
    total_pnp_dat_ytd: number;
    total_pnp_brg_ytd: number;
    total_arm_dat_ytd: number;
    total_arm_brg_ytd: number;
    date_min: string;
    date_max: string;
    days_count: number;
    all_time_peak_date: string;
    all_time_peak_val: number;
    all_time_peak_surge_pct: number;
    peak_mudik_date: string;
    peak_mudik_val: number;
    peak_mudik_surge_pct: number;
    baseline_feb_avg: number;
    valid_latlon_count: number;
    empty_latlon_count: number;
    total_nodes_count: number;
  };
  forecast_nataru: ForecastNataru;
  timeline_2025: DailyRow[];
  simpul_recommendations: SimpulRecommendation[];
  province_monthly_data: ProvinceMonthlyData;
  /** GeoJSON batas 38 provinsi (koordinat dibulatkan 4 desimal).
   *  Nama GeoJSON: "Aceh" (bundle: "D.I Aceh") dan "Daerah Istimewa
   *  Yogyakarta" (bundle: "D.I Yogyakarta") — perlu alias saat join. */
  province_geojson: ProvinceGeoJSON;
}
