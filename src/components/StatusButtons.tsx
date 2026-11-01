import { Ban, Check, Circle, X } from 'lucide-react';
import type { DisplayStatus } from '../types';

const OPTIONS: {
  value: DisplayStatus;
  label: string;
  icon: typeof Check;
  active: string;
}[] = [
  { value: 'present', label: 'Present', icon: Check, active: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'absent', label: 'Absent', icon: X, active: 'bg-rose-600 text-white border-rose-600' },
  { value: 'cancelled', label: 'Cancelled', icon: Ban, active: 'bg-slate-600 text-white border-slate-600' },
  { value: 'not_logged', label: 'Not logged', icon: Circle, active: 'bg-slate-200 text-slate-700 border-slate-300' },
];

export function StatusButtons({
  value,
  onChange,
  disabled = false,
}: {
  value: DisplayStatus;
  onChange: (status: DisplayStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Attendance status" className="grid grid-cols-4 gap-1.5">
      {OPTIONS.map(({ value: v, label, icon: Icon, active }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(v)}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-[11px] font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
              selected ? active : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Icon size={18} strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
