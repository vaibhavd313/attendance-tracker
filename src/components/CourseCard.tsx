import { ChevronRight } from 'lucide-react';
import type { AttendanceStats, Course } from '../types';
import { formatPercentage } from '../utils/attendance';
import { BunkBadge, LEVEL_TONE } from './ui';

export function CourseCard({
  course,
  stats,
  threshold,
}: {
  course: Course;
  stats: AttendanceStats;
  threshold: number;
}) {
  const tone = LEVEL_TONE[stats.level];
  const pct = stats.percentage ?? 0;
  return (
    <a
      href={`#/course/${course.id}`}
      className="card relative block overflow-hidden p-4 pl-5 transition hover:shadow-md active:scale-[0.99]"
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: course.color }}
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold">{course.name}</h3>
          <p className="truncate text-xs text-slate-500">{course.code}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tabular-nums ${tone.text}`}>
              {formatPercentage(stats.percentage)}
            </span>
            <span className="text-xs text-slate-500">
              {stats.present}/{stats.total} classes
            </span>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${tone.bar}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
            <div
              className="absolute -top-0.5 h-2.5 w-0.5 bg-slate-500"
              style={{ left: `${threshold * 100}%` }}
              title={`Threshold ${Math.round(threshold * 100)}%`}
            />
          </div>
        </div>
        <BunkBadge stats={stats} />
        <ChevronRight size={18} className="shrink-0 text-slate-300" />
      </div>
    </a>
  );
}
