import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SemesterSettings } from '../types';
import { addDays, isValidISODate, startOfWeek, todayISO } from '../utils/dates';

export function defaultSemester(): SemesterSettings {
  // Start on this week's Monday so the current week's classes are already counted
  const start = startOfWeek(todayISO());
  return { semesterName: '', startDate: start, endDate: addDays(start, 120), threshold: 0.8 };
}

export function SemesterForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: SemesterSettings;
  submitLabel: string;
  onSubmit: (s: SemesterSettings) => void;
}) {
  const [name, setName] = useState(initial.semesterName);
  const [start, setStart] = useState(initial.startDate);
  const [end, setEnd] = useState(initial.endDate);
  const [pct, setPct] = useState(String(Math.round(initial.threshold * 100)));
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const threshold = Number(pct) / 100;
    if (!name.trim()) return setError('Give the semester a name.');
    if (!isValidISODate(start) || !isValidISODate(end)) return setError('Choose valid dates.');
    if (end < start) return setError('The end date must be after the start date.');
    if (!Number.isFinite(threshold) || threshold < 0.01 || threshold > 0.99) {
      return setError('Threshold must be between 1% and 99%.');
    }
    setError('');
    onSubmit({ semesterName: name.trim(), startDate: start, endDate: end, threshold });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="sem-name">Semester name</label>
        <input id="sem-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fall 2025" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="sem-start">Start date</label>
          <input id="sem-start" type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="sem-end">End date</label>
          <input id="sem-end" type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="sem-threshold">Required attendance (%)</label>
        <input id="sem-threshold" type="number" inputMode="numeric" min={1} max={99} className="input" value={pct} onChange={(e) => setPct(e.target.value)} />
      </div>
      {error && <p className="text-sm font-medium text-rose-600" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full">{submitLabel}</button>
    </form>
  );
}
