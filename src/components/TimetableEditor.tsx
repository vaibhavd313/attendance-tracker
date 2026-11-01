import { useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import type { TimetableEntry, Weekday } from '../types';
import { useAppData } from '../hooks/useAppData';
import { WEEKDAYS, formatTime, todayISO } from '../utils/dates';
import { entryHasRecords } from '../utils/dataOps';
import { ConfirmDialog, Dialog, EmptyState } from './ui';

interface Draft {
  entry?: TimetableEntry;
  weekday: Weekday;
}

function EntryForm({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const { data, addEntry, updateEntry } = useAppData();
  const { entry } = draft;
  const courses = data.courses.filter((c) => !c.archived || c.id === entry?.courseId);
  const [courseId, setCourseId] = useState(entry?.courseId ?? courses[0]?.id ?? '');
  const [weekday, setWeekday] = useState<Weekday>(entry?.weekday ?? draft.weekday);
  const [start, setStart] = useState(entry?.startTime ?? '09:00');
  const [end, setEnd] = useState(entry?.endTime ?? '10:00');
  const [room, setRoom] = useState(entry?.room ?? '');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return setError('Choose a course.');
    if (!start || !end) return setError('Set a start and end time.');
    if (end <= start) return setError('End time must be after the start time.');
    const input = { courseId, weekday, startTime: start, endTime: end, room };
    if (entry) updateEntry(entry.id, input);
    else addEntry(input);
    onClose();
  };

  const movesHistory =
    entry && (entry.courseId !== courseId || entry.weekday !== weekday) && entryHasRecords(data, entry.id);

  return (
    <Dialog title={entry ? 'Edit class' : 'Add class'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="tt-course">Course</label>
          <select id="tt-course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tt-day">Day</label>
          <select id="tt-day" className="input" value={weekday} onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}>
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.long}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="tt-start">Start</label>
            <input id="tt-start" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="tt-end">End</label>
            <input id="tt-end" type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tt-room">Room (optional)</label>
          <input id="tt-room" className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. B-204" />
        </div>
        {movesHistory && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            This slot already has attendance. Past classes stay under the old slot; the new course/day
            applies from today.
          </p>
        )}
        {error && <p className="text-sm font-medium text-rose-600" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full">{entry ? 'Save changes' : 'Add class'}</button>
      </form>
    </Dialog>
  );
}

export function TimetableEditor() {
  const { data, removeEntry } = useAppData();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toRemove, setToRemove] = useState<TimetableEntry | null>(null);

  const today = todayISO();
  const courseById = new Map(data.courses.map((c) => [c.id, c]));
  const activeCourses = data.courses.filter((c) => !c.archived);
  // Only slots that are still running for non-archived courses
  const current = data.timetable
    .filter((e) => !e.extra && (e.activeTo === null || e.activeTo >= today) && courseById.get(e.courseId) && !courseById.get(e.courseId)!.archived)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (activeCourses.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="Add a course first"
        text="Once you have a course you can place it on the weekly timetable."
      />
    );
  }

  return (
    <div className="space-y-3">
      {WEEKDAYS.map((day) => {
        const entries = current.filter((e) => e.weekday === day.value);
        return (
          <section key={day.value} className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{day.long}</h3>
              <button
                className="btn-ghost !min-h-9 !px-2 text-indigo-600"
                aria-label={`Add class on ${day.long}`}
                onClick={() => setDraft({ weekday: day.value })}
              >
                <Plus size={18} /> Add
              </button>
            </div>
            {entries.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">No classes</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {entries.map((e) => {
                  const c = courseById.get(e.courseId)!;
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2.5">
                      <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {formatTime(e.startTime)} – {formatTime(e.endTime)}
                          {e.room ? ` · ${e.room}` : ''}
                        </p>
                      </div>
                      <button className="btn-ghost !px-2" aria-label={`Edit ${c.name} class`} onClick={() => setDraft({ entry: e, weekday: e.weekday })}>
                        <Pencil size={18} />
                      </button>
                      <button className="btn-ghost !px-2 text-rose-600" aria-label={`Delete ${c.name} class`} onClick={() => setToRemove(e)}>
                        <Trash2 size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {draft && <EntryForm draft={draft} onClose={() => setDraft(null)} />}
      {toRemove && (
        <ConfirmDialog
          title="Remove this class?"
          message={
            entryHasRecords(data, toRemove.id)
              ? 'It will stop appearing from today onward. Attendance you already logged for it is kept.'
              : 'It has no attendance logged, so it will be removed completely.'
          }
          confirmLabel="Remove"
          danger
          onCancel={() => setToRemove(null)}
          onConfirm={() => {
            removeEntry(toRemove.id);
            setToRemove(null);
          }}
        />
      )}
    </div>
  );
}
