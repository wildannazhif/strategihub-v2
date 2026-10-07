import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

/* ---------- Card ---------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Section header ---------- */
export function SectionHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-kemenhub-600 dark:text-kemenhub-300">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {desc && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- KPI card ---------- */
export function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  icon,
  accent = '#1a5287',
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  deltaLabel?: string;
  icon?: ReactNode;
  accent?: string;
  className?: string;
}) {
  const positive = delta != null && delta > 0;
  const negative = delta != null && delta < 0;
  return (
    <Card className={clsx('relative overflow-hidden p-4 animate-fade-up', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {icon && (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg"
            style={{ background: `${accent}1a`, color: accent }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="num mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta != null && (
          <span
            className={clsx(
              'num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
              positive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              negative && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              !positive && !negative && 'bg-slate-500/10 text-slate-500',
            )}
          >
            {positive ? <TrendingUp size={12} /> : negative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {delta > 0 ? '+' : ''}
            {delta.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
          </span>
        )}
        {deltaLabel && <span className="text-[11.5px] text-slate-400">{deltaLabel}</span>}
        {sub && !deltaLabel && <span className="text-[11.5px] text-slate-400">{sub}</span>}
      </div>
      {sub && deltaLabel && <p className="mt-1 text-[11.5px] text-slate-400">{sub}</p>}
    </Card>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  color = '#1a5287',
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
        className,
      )}
      style={{ background: `${color}1a`, color }}
    >
      {children}
    </span>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-800/60',
        size === 'sm' && 'scale-95',
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all',
            value === o.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {o.color && (
            <span
              className="mr-1.5 inline-block size-2 rounded-full align-middle"
              style={{ background: o.color }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
      <p className="font-bold text-slate-500 dark:text-slate-400">{title}</p>
      {desc && <p className="mt-1 text-sm text-slate-400">{desc}</p>}
    </div>
  );
}
