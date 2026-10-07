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
  baseline_lf: number; mudik_lf: number; balik_lf: number; peak_lf: number; surge_lf_pct: number;
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
  peak_tag: string;
  peak_surge_pct: number;
  mudik_date: string;
  mudik_val: number;
  mudik_tag: string;
  mudik_surge_pct: number;
  baseline_feb: number;
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
}

export interface ForecastPoint {
  date: string;
  TOTAL: number;
  UDARA?: number; KA?: number; BUS?: number; ASDP?: number; LAUT?: number;
  [k: string]: number | string | undefined;
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
  };
  metrics?: unknown;
  benchmark_2025?: unknown;
  shock_factors?: unknown;
  summaries: Record<'moderat' | 'optimis' | 'konservatif', ForecastScenarioSummary>;
  scenarios: Record<'moderat' | 'optimis' | 'konservatif', ForecastPoint[] | { daily?: ForecastPoint[] }>;
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
  statusText: string;
  statusBadge: string;
  fieldAction: string;
}

export interface DashboardData {
  daily_timeline: DailyRow[];
  monthly_summary: MonthlyRow[];
  lebaran_daily: DailyRow[];
  surge_summary: Record<ModaKey | 'TOTAL', SurgeModa>;
  load_factor_stats: Record<ModaKey, LoadFactorModa>;
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
  province_monthly_data: {
    provinces: string[];
    by_province: Record<string, unknown>;
    by_month: Record<string, unknown>;
  };
}
