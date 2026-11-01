import { useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarOff, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useToday } from '../hooks/useToday';
import { StatusButtons } from '../components/StatusButtons';
import { ConfirmDialog, Dialog, EmptyState, PageHeader } from '../components/ui';
import { addDays, formatDayHeading, formatTime, formatWeekRange, startOfWeek } from '../utils/dates';
import { occurrencesOn } from '../utils/schedule';

function ExtraClassDialog({ date, onClose }: { date: string; onClose: () => void }) {
  const { data, addExtraClass } = useAppData();
  const courses = data.courses.filter((c) => !c.archived);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return setError('Choose a course.');
    if (!start || !end || end <= start) return setError('End time must be after the start time.');
    addExtraClass(date, { courseId, startTime: start, endTime: end, room });
    onClose();
  };

  return (
    <Dialog title={`Add class · ${formatDayHeading(date)}`} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        For a substitute or extra class on this day only. Mark the original class as Cancelled separately.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="x-course">Course</label>
          <select id="x-course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="x-start">Start</label>
            <input id="x-start" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="x-end">End</label>
            <input id="x-end" type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="x-room">Room (optional)</label>
          <input id="x-room" className="input" value={room} onChange={(e) => setRoom(e.target.value)} />
        </div>
        {error && <p className="text-sm font-medium text-rose-600" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full">Add class</button>
      </form>
    </Dialog>
  );
}

export function Log() {
  const { data, setAttendance, removeExtraClass } = useAppData();
  const [addingOn, setAddingOn] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const extraIds = new Set(data.timetable.filter((e) => e.extra).map((e) => e.id));
  const hasCourses = data.courses.some((c) => !c.archived);
  const today = useToday();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const courseById = new Map(data.courses.map((c) => [c.id, c]));

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const perDay = days.map((date) => ({ date, classes: occurrencesOn(data, date) }));
  const isEmptyWeek = perDay.every((d) => d.classes.length === 0);
  const isThisWeek = weekStart === startOfWeek(today);

  return (
    <>
      <PageHeader title="Log attendance" subtitle="Changes are saved instantly." />

      <div className="card sticky top-[env(safe-area-inset-top)] z-30 mb-4 flex items-center justify-between p-2">
        <button className="btn-ghost !px-3" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft />
        </button>
        <div className="text-center">
          <p className="font-bold">{formatWeekRange(weekStart)}</p>
          {isThisWeek ? (
            <p className="text-xs font-semibold text-indigo-600">This week</p>
          ) : (
            <button className="text-xs font-semibold text-indigo-600 underline" onClick={() => setWeekStart(startOfWeek(today))}>
              Jump to this week
            </button>
          )}
        </div>
        <button className="btn-ghost !px-3" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight />
        </button>
      </div>

      {isEmptyWeek && (
        <div className="mb-4">
          <EmptyState
            icon={<CalendarOff />}
            title="No classes this week"
            text="Nothing is scheduled. You can still add a one-off class to any day below."
          />
        </div>
      )}
      {(
        <div className="space-y-4">
          {perDay.map(({ date, classes }) => {
              const future = date > today;
              return (
                <section key={date} aria-label={formatDayHeading(date)}>
                  <h2 className={`mb-2 flex items-center gap-2 text-sm font-bold ${date === today ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {formatDayHeading(date)}
                    {date === today && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] uppercase">Today</span>}
                    {future && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase text-slate-600">Upcoming</span>}
                    {hasCourses && (
                      <button
                        className="btn-ghost ml-auto !min-h-9 !px-2 text-xs text-indigo-600"
                        onClick={() => setAddingOn(date)}
                      >
                        <Plus size={16} /> Add class
                      </button>
                    )}
                  </h2>
                  {classes.length === 0 && <p className="text-sm text-slate-400">No classes</p>}
                  <div className="space-y-3">
                    {classes.map((o) => {
                      const course = courseById.get(o.courseId);
                      return (
                        <div key={o.key} className="card p-3">
                          <div className="mb-3 flex items-center gap-3">
                            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: course?.color }} />
                            <div className="min-w-0">
                              <p className="truncate font-bold">{course?.name}</p>
                              <p className="truncate text-xs text-slate-500">
                                {formatTime(o.startTime)} – {formatTime(o.endTime)}
                                {o.room ? ` · ${o.room}` : ''}
                                {course?.archived ? ' · archived' : ''}
                              </p>
                            </div>
                            {extraIds.has(o.entryId) && (
                              <>
                                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Extra</span>
                                <button className="btn-ghost !min-h-9 !px-2 text-rose-600" aria-label="Remove extra class" onClick={() => setRemoving(o.entryId)}>
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                          <StatusButtons
                            value={o.status}
                            disabled={future}
                            onChange={(s) => setAttendance(o.entryId, o.date, s)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {addingOn && <ExtraClassDialog date={addingOn} onClose={() => setAddingOn(null)} />}
      {removing && (
        <ConfirmDialog
          title="Remove extra class?"
          message="This one-off class and any attendance logged for it will be deleted."
          confirmLabel="Remove"
          danger
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            removeExtraClass(removing);
            setRemoving(null);
          }}
        />
      )}
    </>
  );
}
