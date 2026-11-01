import type { AppData, Occurrence, TimetableEntry } from '../types';
import { addDays, weekdayOf } from './dates';
import { attendanceKey } from './attendance';

export function isActiveOn(entry: TimetableEntry, date: string): boolean {
  return (
    (entry.activeFrom === null || date >= entry.activeFrom) &&
    (entry.activeTo === null || date <= entry.activeTo)
  );
}

function toOccurrence(data: AppData, entry: TimetableEntry, date: string): Occurrence {
  const key = attendanceKey(entry.id, date);
  return {
    key,
    entryId: entry.id,
    courseId: entry.courseId,
    date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
    status: data.attendance[key]?.status ?? 'not_logged',
  };
}

/** Classes the current timetable schedules on `date` (inside the semester, active courses only) */
function scheduledOn(data: AppData, date: string): Occurrence[] {
  const s = data.settings;
  if (!s) return [];
  const inSemester = date >= s.startDate && date <= s.endDate;
  const dow = weekdayOf(date);
  const archived = new Set(data.courses.filter((c) => c.archived).map((c) => c.id));
  return data.timetable
    .filter((e) => {
      if (archived.has(e.courseId)) return false;
      if (e.extra) return e.activeFrom === date; // one-off classes show even outside the semester
      return inSemester && e.weekday === dow && isActiveOn(e, date);
    })
    .map((e) => toOccurrence(data, e, date));
}

function byTime(a: Occurrence, b: Occurrence): number {
  return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
}

/**
 * Everything on `date`: scheduled classes plus any logged records whose slot has since
 * been retired or archived, so history is never hidden.
 */
export function occurrencesOn(data: AppData, date: string): Occurrence[] {
  const list = scheduledOn(data, date);
  const seen = new Set(list.map((o) => o.key));
  for (const r of Object.values(data.attendance)) {
    if (r.date !== date) continue;
    const key = attendanceKey(r.entryId, r.date);
    const entry = data.timetable.find((e) => e.id === r.entryId);
    if (entry && !seen.has(key)) list.push(toOccurrence(data, entry, date));
  }
  return list.sort(byTime);
}

/** All of a course's classes from `from` to `to` (inclusive), oldest first */
export function occurrencesForCourse(
  data: AppData,
  courseId: string,
  from: string,
  to: string,
): Occurrence[] {
  const out: Occurrence[] = [];
  const seen = new Set<string>();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const o of scheduledOn(data, d)) {
      if (o.courseId !== courseId) continue;
      out.push(o);
      seen.add(o.key);
    }
  }
  // Include logged classes outside the range/slot window (retired slots, changed semester dates)
  for (const r of Object.values(data.attendance)) {
    if (r.courseId !== courseId || r.date > to || seen.has(attendanceKey(r.entryId, r.date))) continue;
    const entry = data.timetable.find((e) => e.id === r.entryId);
    if (entry) out.push(toOccurrence(data, entry, r.date));
  }
  return out.sort(byTime);
}
