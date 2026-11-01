import type { AppData, AttendanceRecord, Course, TimetableEntry, Weekday } from '../types';
import { TIME_RE, isValidISODate } from './dates';
import { attendanceKey } from './attendance';
import { COURSE_COLORS } from './dataOps';

export type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const STATUSES = ['present', 'absent', 'cancelled'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmpty = (v: unknown): v is string => isStr(v) && v.trim().length > 0;

class ValidationError extends Error {}
function fail(msg: string): never {
  throw new ValidationError(msg);
}

/** Validates untrusted JSON (imports, localStorage) and returns clean AppData. */
export function parseAppData(input: unknown): ParseResult {
  try {
    return { ok: true, data: parse(input) };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message };
    throw e;
  }
}

function parse(input: unknown): AppData {
  if (!isObj(input)) fail('File is not a valid Attendly backup.');
  if (input.version !== 1) fail('Unsupported or missing backup version.');

  // settings
  let settings: AppData['settings'] = null;
  if (input.settings !== null && input.settings !== undefined) {
    const s = input.settings;
    if (!isObj(s)) fail('Semester settings are malformed.');
    if (!isNonEmpty(s.semesterName)) fail('Semester name is missing.');
    if (!isValidISODate(s.startDate) || !isValidISODate(s.endDate)) fail('Semester dates are invalid.');
    if (s.startDate > s.endDate) fail('Semester start date is after its end date.');
    if (typeof s.threshold !== 'number' || !(s.threshold > 0 && s.threshold < 1)) {
      fail('Attendance threshold must be between 0 and 1 (exclusive).');
    }
    settings = {
      semesterName: s.semesterName.trim(),
      startDate: s.startDate,
      endDate: s.endDate,
      threshold: s.threshold,
    };
  }

  // courses
  if (!Array.isArray(input.courses)) fail('Courses are missing.');
  const courses: Course[] = [];
  const courseIds = new Set<string>();
  input.courses.forEach((c: unknown, i: number) => {
    if (!isObj(c)) fail(`Course #${i + 1} is malformed.`);
    if (!isNonEmpty(c.id) || courseIds.has(c.id)) fail(`Course #${i + 1} has a missing or duplicate id.`);
    if (!isNonEmpty(c.name)) fail(`Course #${i + 1} has no name.`);
    if (c.code !== undefined && !isStr(c.code)) fail(`Course "${c.name}" has an invalid code.`);
    if (c.color !== undefined && !(isStr(c.color) && HEX_RE.test(c.color))) {
      fail(`Course "${c.name}" has an invalid color.`);
    }
    courseIds.add(c.id);
    courses.push({
      id: c.id,
      name: c.name.trim(),
      code: isStr(c.code) ? c.code.trim() : '',
      color: isStr(c.color) ? c.color : COURSE_COLORS[i % COURSE_COLORS.length],
      archived: c.archived === true,
    });
  });

  // timetable
  if (!Array.isArray(input.timetable)) fail('Timetable is missing.');
  const timetable: TimetableEntry[] = [];
  const entryIds = new Map<string, TimetableEntry>();
  input.timetable.forEach((e: unknown, i: number) => {
    if (!isObj(e)) fail(`Timetable entry #${i + 1} is malformed.`);
    if (!isNonEmpty(e.id) || entryIds.has(e.id)) fail(`Timetable entry #${i + 1} has a missing or duplicate id.`);
    if (!isStr(e.courseId) || !courseIds.has(e.courseId)) fail(`Timetable entry #${i + 1} refers to an unknown course.`);
    if (typeof e.weekday !== 'number' || !Number.isInteger(e.weekday) || e.weekday < 1 || e.weekday > 6) {
      fail(`Timetable entry #${i + 1} has an invalid weekday.`);
    }
    if (!isStr(e.startTime) || !TIME_RE.test(e.startTime) || !isStr(e.endTime) || !TIME_RE.test(e.endTime)) {
      fail(`Timetable entry #${i + 1} has an invalid time.`);
    }
    if (e.endTime <= e.startTime) fail(`Timetable entry #${i + 1} ends before it starts.`);
    if (e.room !== undefined && !isStr(e.room)) fail(`Timetable entry #${i + 1} has an invalid room.`);
    for (const f of ['activeFrom', 'activeTo'] as const) {
      const v = e[f];
      if (v !== null && v !== undefined && !isValidISODate(v)) fail(`Timetable entry #${i + 1} has an invalid ${f} date.`);
    }
    const entry: TimetableEntry = {
      id: e.id,
      courseId: e.courseId,
      weekday: e.weekday as Weekday,
      startTime: e.startTime,
      endTime: e.endTime,
      room: isStr(e.room) && e.room.trim() ? e.room.trim() : undefined,
      activeFrom: (e.activeFrom as string | null | undefined) ?? null,
      activeTo: (e.activeTo as string | null | undefined) ?? null,
      ...(e.extra === true ? { extra: true } : {}),
    };
    if (entry.extra && (!entry.activeFrom || entry.activeFrom !== entry.activeTo)) {
      fail(`Timetable entry #${i + 1} is a one-off class without a single valid date.`);
    }
    entryIds.set(entry.id, entry);
    timetable.push(entry);
  });

  // attendance
  if (!isObj(input.attendance)) fail('Attendance records are missing.');
  const attendance: Record<string, AttendanceRecord> = {};
  for (const [key, r] of Object.entries(input.attendance)) {
    if (!isObj(r)) fail('An attendance record is malformed.');
    if (!isStr(r.entryId) || !isValidISODate(r.date)) fail('An attendance record has an invalid entry or date.');
    const entry = entryIds.get(r.entryId);
    if (!entry) fail('An attendance record refers to an unknown timetable entry.');
    if (key !== attendanceKey(r.entryId, r.date)) fail('An attendance record has a mismatched key.');
    if (r.courseId !== entry.courseId) fail('An attendance record refers to the wrong course.');
    if (!isStr(r.status) || !STATUSES.includes(r.status)) fail('An attendance record has an invalid status.');
    attendance[key] = {
      entryId: r.entryId,
      courseId: entry.courseId,
      date: r.date,
      status: r.status as AttendanceRecord['status'],
    };
  }

  return { version: 1, settings, courses, timetable, attendance };
}
