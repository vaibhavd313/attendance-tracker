import { BookOpen } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useToday } from '../hooks/useToday';
import { CourseCard } from '../components/CourseCard';
import { EmptyState, PageHeader } from '../components/ui';
import { courseStats } from '../utils/attendance';
import { formatShortDate } from '../utils/dates';

export function Dashboard() {
  const { data } = useAppData();
  const today = useToday();
  const settings = data.settings!;
  const courses = data.courses.filter((c) => !c.archived);

  return (
    <>
      <PageHeader
        title={settings.semesterName}
        subtitle={`${formatShortDate(settings.startDate)} – ${formatShortDate(settings.endDate)} · ${Math.round(settings.threshold * 100)}% required`}
      />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Courses</h2>
      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No active courses"
          text="Add or restore a course in Settings to start tracking."
          action={<a href="#/settings" className="btn-primary">Open settings</a>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} stats={courseStats(data, c.id, today)} threshold={settings.threshold} />
          ))}
        </div>
      )}
    </>
  );
}
