import type {
  AppData,
  AttendanceLevel,
  AttendanceRecord,
  AttendanceStats,
} from '../types';

/** Absorbs floating point noise, e.g. 4 / 0.8 = 5.000000000000001 */
const EPS = 1e-9;
/** How far below the threshold still counts as "warning" rather than "danger" */
const WARNING_MARGIN = 0.05;

export function attendanceKey(entryId: string, date: string): string {
  return `${entryId}|${date}`;
}

/**
 * Core attendance maths. `threshold` is a decimal (0.8 = 80%).
 *
 * P = present, A = absent, T = P + A
 * At/above threshold: allowance = floor(P / threshold - T)
 * Below threshold:    recovery  = ceil((threshold * T - P) / (1 - threshold))
 */
export function computeStats(present: number, absent: number, threshold: number): AttendanceStats {
  const total = present + absent;
  if (total === 0) {
    return {
      present,
      absent,
      total,
      percentage: null,
      allowance: null,
      recovery: null,
      signed: null,
      level: 'none',
    };
  }

  const ratio = present / total;
  const meets = present >= threshold * total - EPS;
  let allowance: number | null = null;
  let recovery: number | null = null;
  let level: AttendanceLevel;

  if (meets) {
    allowance = Math.max(0, Math.floor(present / threshold - total + EPS));
    level = 'good';
  } else {
    // threshold >= 1 can never be recovered once a class is missed
    if (threshold < 1) {
      recovery = Math.max(1, Math.ceil((threshold * total - present) / (1 - threshold) - EPS));
    }
    level = ratio >= threshold - WARNING_MARGIN ? 'warning' : 'danger';
  }

  return {
    present,
    absent,
    total,
    percentage: ratio * 100,
    allowance,
    recovery,
    signed: allowance !== null ? allowance : recovery !== null ? -recovery : null,
    level,
  };
}

export interface RecordCounts {
  present: number;
  absent: number;
  cancelled: number;
}

/** Counts records on or before `today`; future-dated records never count. */
export function countRecords(
  records: Iterable<AttendanceRecord>,
  today: string,
  courseIds?: ReadonlySet<string>,
): RecordCounts {
  const counts: RecordCounts = { present: 0, absent: 0, cancelled: 0 };
  for (const r of records) {
    if (r.date > today) continue;
    if (courseIds && !courseIds.has(r.courseId)) continue;
    counts[r.status]++;
  }
  return counts;
}

export function courseStats(data: AppData, courseId: string, today: string): AttendanceStats {
  const c = countRecords(Object.values(data.attendance), today, new Set([courseId]));
  return computeStats(c.present, c.absent, data.settings?.threshold ?? 0.8);
}

/** Overall = sum of present/absent across all active (non-archived) courses */
export function overallStats(data: AppData, today: string): AttendanceStats {
  const ids = new Set(data.courses.filter((c) => !c.archived).map((c) => c.id));
  const c = countRecords(Object.values(data.attendance), today, ids);
  return computeStats(c.present, c.absent, data.settings?.threshold ?? 0.8);
}

export function formatPercentage(p: number | null): string {
  return p === null ? '--' : `${Math.round(p * 10) / 10}%`;
}

/** +2, +0, -3, or "--" */
export function formatSigned(n: number | null): string {
  if (n === null) return '--';
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function describeSigned(s: AttendanceStats): string {
  if (s.total === 0) return 'No classes logged yet';
  if (s.allowance !== null) {
    if (s.allowance === 0) return 'Cannot miss another class';
    if (s.allowance === 1) return 'Can miss one more class';
    return `Can miss ${s.allowance} more classes`;
  }
  if (s.recovery === null) return 'Threshold can no longer be reached';
  if (s.recovery === 1) return 'Must attend the next class to recover';
  return `Must attend the next ${s.recovery} consecutive classes to recover`;
}
