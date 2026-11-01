/** 1 = Monday ... 6 = Saturday (matches Date#getDay) */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6;

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';
export type DisplayStatus = AttendanceStatus | 'not_logged';

export interface SemesterSettings {
  semesterName: string;
  /** ISO date, YYYY-MM-DD */
  startDate: string;
  endDate: string;
  /** Decimal, e.g. 0.8 for 80% */
  threshold: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  archived: boolean;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  weekday: Weekday;
  /** HH:MM, 24h */
  startTime: string;
  endTime: string;
  room?: string;
  /** First date this slot applies; null = since the semester began */
  activeFrom: string | null;
  /** Last date this slot applies; null = still running */
  activeTo: string | null;
  /** One-off class on a single date (e.g. a substitute for a cancelled class) */
  extra?: boolean;
}

export interface AttendanceRecord {
  entryId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
}

export interface AppData {
  version: 1;
  settings: SemesterSettings | null;
  courses: Course[];
  timetable: TimetableEntry[];
  /** Keyed by attendanceKey(entryId, date) */
  attendance: Record<string, AttendanceRecord>;
}

/** One concrete class on one date */
export interface Occurrence {
  key: string;
  entryId: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  status: DisplayStatus;
}

export type AttendanceLevel = 'none' | 'good' | 'warning' | 'danger';

export interface AttendanceStats {
  present: number;
  absent: number;
  /** present + absent */
  total: number;
  /** 0-100, or null when nothing has been logged */
  percentage: number | null;
  /** Classes that can still be missed (>= 0), when at/above threshold */
  allowance: number | null;
  /** Consecutive classes to attend (> 0), when below threshold */
  recovery: number | null;
  /** +allowance, or -recovery; null when unknown */
  signed: number | null;
  level: AttendanceLevel;
}
