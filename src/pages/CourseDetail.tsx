import { ArrowLeft, History } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useToday } from '../hooks/useToday';
import { StatusButtons } from '../components/StatusButtons';
import { BunkBadge, EmptyState, LEVEL_TONE } from '../components/ui';
import { countRecords, courseStats, describeSigned, formatPercentage } from '../utils/attendance';
import { formatDate, formatTime } from '../utils/dates';
import { occurrencesForCourse } from '../utils/schedule';

export function CourseDetail({ courseId }: { courseId: string }) {
  const { data, setAttendance } = useAppData();
  const today = useToday();
  const course = data.courses.find((c) => c.id === courseId);
  const settings = data.settings!;

  if (!course) {
    return (
      <EmptyState
        icon={<History />}
        title="Course not found"
        action={<a href="#/" className="btn-primary">Back to dashboard</a>}
      />
    );
  }

  const stats = courseStats(data, courseId, today);
  const counts = countRecords(Object.values(data.attendance), today, new Set([courseId]));
  const tone = LEVEL_TONE[stats.level];
  const history = occurrencesForCourse(data, courseId, settings.startDate, today).reverse();

  return (
    <>
      <a href="#/" className="btn-ghost -ml-3 mb-2 !min-h-9 !px-3">
        <ArrowLeft size={18} /> Dashboard
      </a>

      <header className="mb-5 flex items-center gap-3">
        <span className="h-12 w-2 rounded-full" style={{ backgroundColor: course.color }} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{course.name}</h1>
          <p className="text-sm text-slate-500">
            {course.code}
            {course.archived ? ' · Archived' : ''}
          </p>
        </div>
      </header>

      <section className="card mb-4 flex items-center gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance</p>
          <p className={`text-5xl font-extrabold tabular-nums ${tone.text}`}>{formatPercentage(stats.percentage)}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{describeSigned(stats)}</p>
          <p className="text-xs text-slate-400">Required: {Math.round(settings.threshold * 100)}%</p>
        </div>
        <BunkBadge stats={stats} size="lg" />
      </section>

      <section className="mb-6 grid grid-cols-3 gap-3 text-center">
        {[
          ['Present', counts.present],
          ['Absent', counts.absent],
          ['Cancelled', counts.cancelled],
        ].map(([label, n]) => (
          <div key={label} className="card py-3">
            <p className="text-2xl font-extrabold tabular-nums">{n}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">History</h2>
      {history.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No classes yet"
          text="Past classes appear here once the semester has started and this course is on your timetable."
        />
      ) : (
        <ul className="space-y-3">
          {history.map((o) => (
            <li key={o.key} className="card p-3">
              <p className="mb-3 text-sm font-semibold">
                {formatDate(o.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                <span className="font-normal text-slate-500">
                  {' '}· {formatTime(o.startTime)} – {formatTime(o.endTime)}
                  {o.room ? ` · ${o.room}` : ''}
                </span>
              </p>
              <StatusButtons value={o.status} onChange={(s) => setAttendance(o.entryId, o.date, s)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
