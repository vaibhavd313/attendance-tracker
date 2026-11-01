import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { AttendanceLevel, AttendanceStats } from '../types';
import { describeSigned, formatSigned } from '../utils/attendance';

export const LEVEL_TONE: Record<
  AttendanceLevel,
  { text: string; bg: string; bar: string; soft: string }
> = {
  none: { text: 'text-slate-500', bg: 'bg-slate-100', bar: 'bg-slate-300', soft: 'text-slate-500' },
  good: { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500', soft: 'text-emerald-600' },
  warning: { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500', soft: 'text-amber-600' },
  danger: { text: 'text-rose-700', bg: 'bg-rose-50', bar: 'bg-rose-500', soft: 'text-rose-600' },
};

/** Prominent signed bunk allowance: +2, +0, −3 or -- */
export function BunkBadge({ stats, size = 'md' }: { stats: AttendanceStats; size?: 'md' | 'lg' }) {
  const tone = LEVEL_TONE[stats.level];
  const caption =
    stats.signed === null ? 'no data' : stats.signed >= 0 ? 'can miss' : 'must attend';
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-2xl ${tone.bg} ${tone.text} ${
        size === 'lg' ? 'min-w-28 px-5 py-4' : 'min-w-20 px-3 py-2'
      }`}
      aria-label={describeSigned(stats)}
    >
      <span
        className={`font-extrabold leading-none tabular-nums ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`}
      >
        {formatSigned(stats.signed)}
      </span>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {caption}
      </span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn-ghost -mr-2 !min-h-9 !px-2" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex gap-3">
        <button className="btn-secondary flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
