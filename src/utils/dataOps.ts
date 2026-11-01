import type {
  AppData,
  Course,
  DisplayStatus,
  SemesterSettings,
  TimetableEntry,
} from '../types';
import { addDays } from './dates';
import { attendanceKey } from './attendance';

export const COURSE_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#e11d48',
  '#9333ea',
  '#db2777',
  '#475569',
];

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyData(): AppData {
  return { version: 1, settings: null, courses: [], timetable: [], attendance: {} };
}

export function setSettings(data: AppData, settings: SemesterSettings): AppData {
  return { ...data, settings };
}

// ---- Courses ----------------------------------------------------------

export interface CourseInput {
  name: string;
  code: string;
  color?: string;
}

export function addCourse(data: AppData, input: CourseInput): AppData {
  const course: Course = {
    id: makeId(),
    name: input.name.trim(),
    code: input.code.trim(),
    color: input.color ?? COURSE_COLORS[data.courses.length % COURSE_COLORS.length],
    archived: false,
  };
  return { ...data, courses: [...data.courses, course] };
}

export function updateCourse(data: AppData, id: string, input: CourseInput): AppData {
  return {
    ...data,
    courses: data.courses.map((c) =>
      c.id === id
        ? { ...c, name: input.name.trim(), code: input.code.trim(), color: input.color ?? c.color }
        : c,
    ),
  };
}

export function setCourseArchived(data: AppData, id: string, archived: boolean): AppData {
  return { ...data, courses: data.courses.map((c) => (c.id === id ? { ...c, archived } : c)) };
}

export function courseHasHistory(data: AppData, courseId: string): boolean {
  return Object.values(data.attendance).some((r) => r.courseId === courseId);
}

/** Only courses without attendance history can be deleted; others must be archived. */
export function deleteCourse(data: AppData, id: string): AppData {
  if (courseHasHistory(data, id)) return data;
  return {
    ...data,
    courses: data.courses.filter((c) => c.id !== id),
    timetable: data.timetable.filter((e) => e.courseId !== id),
  };
}

// ---- Timetable --------------------------------------------------------

export type EntryInput = Pick<TimetableEntry, 'courseId' | 'weekday' | 'startTime' | 'endTime'> & {
  room?: string;
};

function cleanRoom(room?: string): string | undefined {
  const r = room?.trim();
  return r ? r : undefined;
}

export function entryHasRecords(data: AppData, entryId: string): boolean {
  return Object.values(data.attendance).some((r) => r.entryId === entryId);
}

export function addEntry(data: AppData, input: EntryInput): AppData {
  const entry: TimetableEntry = {
    id: makeId(),
    courseId: input.courseId,
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
    room: cleanRoom(input.room),
    activeFrom: null,
    activeTo: null,
  };
  return { ...data, timetable: [...data.timetable, entry] };
}

/**
 * Time/room edits apply in place. Moving a slot to another course or weekday would
 * re-label past classes, so if the slot already has records it is retired as of
 * yesterday and replaced by a new slot starting today.
 */
export function updateEntry(
  data: AppData,
  id: string,
  input: EntryInput,
  today: string,
): AppData {
  const old = data.timetable.find((e) => e.id === id);
  if (!old) return data;
  const moved = old.courseId !== input.courseId || old.weekday !== input.weekday;

  if (moved && entryHasRecords(data, id)) {
    const retired = removeEntry(data, id, today);
    const replacement: TimetableEntry = {
      id: makeId(),
      courseId: input.courseId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      room: cleanRoom(input.room),
      activeFrom: today,
      activeTo: null,
    };
    return { ...retired, timetable: [...retired.timetable, replacement] };
  }

  return {
    ...data,
    timetable: data.timetable.map((e) =>
      e.id === id ? { ...e, ...input, room: cleanRoom(input.room) } : e,
    ),
  };
}

/** Deletes a slot, or retires it (keeping history) if it has attendance records. */
export function removeEntry(data: AppData, id: string, today: string): AppData {
  if (!entryHasRecords(data, id)) {
    return { ...data, timetable: data.timetable.filter((e) => e.id !== id) };
  }
  const yesterday = addDays(today, -1);
  return {
    ...data,
    timetable: data.timetable.map((e) =>
      e.id === id && (e.activeTo === null || e.activeTo > yesterday)
        ? { ...e, activeTo: yesterday }
        : e,
    ),
  };
}

/** Adds a one-off class on a single date, e.g. a substitute for a cancelled class. */
export function addExtraClass(data: AppData, date: string, input: Omit<EntryInput, 'weekday'>): AppData {
  const entry: TimetableEntry = {
    id: makeId(),
    courseId: input.courseId,
    weekday: new Date(`${date}T00:00:00`).getDay() as TimetableEntry['weekday'],
    startTime: input.startTime,
    endTime: input.endTime,
    room: cleanRoom(input.room),
    activeFrom: date,
    activeTo: date,
    extra: true,
  };
  return { ...data, timetable: [...data.timetable, entry] };
}

/** Removes a one-off class together with any attendance logged for it. */
export function removeExtraClass(data: AppData, entryId: string): AppData {
  const attendance = Object.fromEntries(
    Object.entries(data.attendance).filter(([, r]) => r.entryId !== entryId),
  );
  return { ...data, timetable: data.timetable.filter((e) => e.id !== entryId), attendance };
}

// ---- Attendance -------------------------------------------------------

export function setAttendance(
  data: AppData,
  entryId: string,
  date: string,
  status: DisplayStatus,
): AppData {
  const entry = data.timetable.find((e) => e.id === entryId);
  if (!entry) return data;
  const key = attendanceKey(entryId, date);
  const attendance = { ...data.attendance };
  if (status === 'not_logged') {
    delete attendance[key];
  } else {
    attendance[key] = { entryId, courseId: entry.courseId, date, status };
  }
  return { ...data, attendance };
}
