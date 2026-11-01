import { describe, expect, it } from 'vitest';
import type { AppData } from '../types';
import {
  addCourse,
  addEntry,
  addExtraClass,
  removeExtraClass,
  deleteCourse,
  emptyData,
  removeEntry,
  setAttendance,
  setCourseArchived,
  setSettings,
  updateEntry,
} from './dataOps';
import { occurrencesForCourse, occurrencesOn } from './schedule';
import { courseStats, overallStats } from './attendance';

// 2025-01-06 is a Monday
function fixture(): { data: AppData; courseId: string; e1: string; e2: string } {
  let d = setSettings(emptyData(), {
    semesterName: 'Spring',
    startDate: '2025-01-01',
    endDate: '2025-05-31',
    threshold: 0.8,
  });
  d = addCourse(d, { name: 'Maths', code: 'M101' });
  const courseId = d.courses[0].id;
  d = addEntry(d, { courseId, weekday: 1, startTime: '09:00', endTime: '10:00' });
  d = addEntry(d, { courseId, weekday: 1, startTime: '11:00', endTime: '12:00' });
  return { data: d, courseId, e1: d.timetable[0].id, e2: d.timetable[1].id };
}

describe('occurrences', () => {
  it('keeps two same-day classes of one course independent', () => {
    let { data, e1, e2 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = setAttendance(data, e2, '2025-01-06', 'absent');
    const occ = occurrencesOn(data, '2025-01-06');
    expect(occ.map((o) => o.status)).toEqual(['present', 'absent']);
    expect(new Set(occ.map((o) => o.key)).size).toBe(2);
  });

  it('is empty outside the semester and on unscheduled days', () => {
    const { data } = fixture();
    expect(occurrencesOn(data, '2025-01-07')).toHaveLength(0);
    expect(occurrencesOn(data, '2024-12-30')).toHaveLength(0);
  });

  it('clearing a status removes the record', () => {
    let { data, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = setAttendance(data, e1, '2025-01-06', 'not_logged');
    expect(Object.keys(data.attendance)).toHaveLength(0);
  });
});

describe('statistics', () => {
  it('only counts present/absent that are not in the future', () => {
    let { data, courseId, e1, e2 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = setAttendance(data, e2, '2025-01-06', 'cancelled');
    data = setAttendance(data, e1, '2025-01-13', 'absent');
    data = setAttendance(data, e1, '2025-03-03', 'present'); // future relative to "today"
    const s = courseStats(data, courseId, '2025-01-31');
    expect([s.present, s.absent, s.total]).toEqual([1, 1, 2]);
  });

  it('overall equals summed course-level records and skips archived courses', () => {
    let { data, e1 } = fixture();
    data = addCourse(data, { name: 'Physics', code: 'P101' });
    const physics = data.courses[1].id;
    data = addEntry(data, { courseId: physics, weekday: 2, startTime: '09:00', endTime: '10:00' });
    const e3 = data.timetable[2].id;
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = setAttendance(data, e3, '2025-01-07', 'absent');
    expect(overallStats(data, '2025-01-31').total).toBe(2);
    data = setCourseArchived(data, physics, true);
    expect(overallStats(data, '2025-01-31').total).toBe(1);
  });
});

describe('timetable changes preserve history', () => {
  it('retires (not deletes) a slot with records, and past records still count', () => {
    let { data, courseId, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = removeEntry(data, e1, '2025-01-20');
    expect(data.timetable.find((e) => e.id === e1)?.activeTo).toBe('2025-01-19');
    // no more scheduled instances after retirement, but history is intact
    expect(occurrencesOn(data, '2025-01-27').map((o) => o.entryId)).not.toContain(e1);
    expect(occurrencesOn(data, '2025-01-06').map((o) => o.entryId)).toContain(e1);
    expect(courseStats(data, courseId, '2025-02-01').present).toBe(1);
  });

  it('hard-deletes a slot with no records', () => {
    let { data, e1 } = fixture();
    data = removeEntry(data, e1, '2025-01-20');
    expect(data.timetable.some((e) => e.id === e1)).toBe(false);
  });

  it('moving a slot with history creates a new slot and leaves old records untouched', () => {
    let { data, courseId, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    const before = { ...data.attendance };
    data = updateEntry(data, e1, { courseId, weekday: 3, startTime: '09:00', endTime: '10:00' }, '2025-01-20');
    expect(data.attendance).toEqual(before);
    // old Monday record still shown on its original date
    expect(occurrencesOn(data, '2025-01-06').find((o) => o.entryId === e1)?.status).toBe('present');
    // new Wednesday slot from today on, not retroactively
    expect(occurrencesOn(data, '2025-01-22')).toHaveLength(1);
    expect(occurrencesOn(data, '2025-01-08')).toHaveLength(0);
  });

  it('time-only edits apply in place', () => {
    let { data, courseId, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = updateEntry(data, e1, { courseId, weekday: 1, startTime: '08:00', endTime: '09:00', room: ' A1 ' }, '2025-01-20');
    const e = data.timetable.find((x) => x.id === e1)!;
    expect([e.startTime, e.room]).toEqual(['08:00', 'A1']);
    expect(data.timetable).toHaveLength(2);
  });

  it('shows archived courses history but no new scheduled classes', () => {
    let { data, courseId, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    data = setCourseArchived(data, courseId, true);
    expect(occurrencesOn(data, '2025-01-06')).toHaveLength(1); // the logged one
    expect(occurrencesOn(data, '2025-01-13')).toHaveLength(0);
  });

  it('refuses to delete a course with history', () => {
    let { data, courseId, e1 } = fixture();
    data = setAttendance(data, e1, '2025-01-06', 'present');
    expect(deleteCourse(data, courseId).courses).toHaveLength(1);
  });
});

describe('occurrencesForCourse', () => {
  it('lists every scheduled class up to the end date, oldest first', () => {
    const { data, courseId } = fixture();
    const list = occurrencesForCourse(data, courseId, '2025-01-01', '2025-01-20');
    expect(list.map((o) => `${o.date} ${o.startTime}`)).toEqual([
      '2025-01-06 09:00',
      '2025-01-06 11:00',
      '2025-01-13 09:00',
      '2025-01-13 11:00',
      '2025-01-20 09:00',
      '2025-01-20 11:00',
    ]);
  });
});

describe('extra (one-off) classes', () => {
  it('appears only on its date, counts toward stats, and is independent of the regular slots', () => {
    let { data, courseId, e1 } = fixture();
    data = addExtraClass(data, '2025-01-08', { courseId, startTime: '14:00', endTime: '15:00' }); // Wednesday
    const extra = data.timetable.find((e) => e.extra)!;
    expect(occurrencesOn(data, '2025-01-08').map((o) => o.entryId)).toEqual([extra.id]);
    expect(occurrencesOn(data, '2025-01-15')).toHaveLength(0);
    data = setAttendance(data, e1, '2025-01-06', 'cancelled');
    data = setAttendance(data, extra.id, '2025-01-08', 'present');
    const s = courseStats(data, courseId, '2025-01-31');
    expect([s.present, s.absent]).toEqual([1, 0]);
  });

  it('removing an extra class deletes its records too', () => {
    let { data, courseId } = fixture();
    data = addExtraClass(data, '2025-01-08', { courseId, startTime: '14:00', endTime: '15:00' });
    const extra = data.timetable.find((e) => e.extra)!;
    data = setAttendance(data, extra.id, '2025-01-08', 'absent');
    data = removeExtraClass(data, extra.id);
    expect(data.timetable.some((e) => e.extra)).toBe(false);
    expect(Object.keys(data.attendance)).toHaveLength(0);
  });
});
