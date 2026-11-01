import { describe, expect, it } from 'vitest';
import { addCourse, addEntry, addExtraClass, emptyData, setAttendance, setSettings } from './dataOps';
import { parseAppData } from './validate';

function sample() {
  let d = setSettings(emptyData(), {
    semesterName: 'Spring',
    startDate: '2025-01-01',
    endDate: '2025-05-31',
    threshold: 0.8,
  });
  d = addCourse(d, { name: 'Maths', code: 'M101' });
  d = addEntry(d, { courseId: d.courses[0].id, weekday: 1, startTime: '09:00', endTime: '10:00' });
  return setAttendance(d, d.timetable[0].id, '2025-01-06', 'present');
}

describe('parseAppData', () => {
  it('round-trips exported data', () => {
    const d = sample();
    const r = parseAppData(JSON.parse(JSON.stringify(d)));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(d);
  });

  it('accepts an empty, unconfigured backup', () => {
    expect(parseAppData(emptyData()).ok).toBe(true);
  });

  it('rejects junk', () => {
    expect(parseAppData(null).ok).toBe(false);
    expect(parseAppData('hi').ok).toBe(false);
    expect(parseAppData({}).ok).toBe(false);
    expect(parseAppData({ ...sample(), version: 2 }).ok).toBe(false);
  });

  it('rejects bad settings', () => {
    const d = sample();
    expect(parseAppData({ ...d, settings: { ...d.settings, threshold: 80 } }).ok).toBe(false);
    expect(parseAppData({ ...d, settings: { ...d.settings, startDate: '2025-13-40' } }).ok).toBe(false);
    expect(parseAppData({ ...d, settings: { ...d.settings, startDate: '2026-01-01' } }).ok).toBe(false);
  });

  it('rejects broken references', () => {
    const d = sample();
    const badEntry = { ...d, timetable: [{ ...d.timetable[0], courseId: 'nope' }] };
    expect(parseAppData(badEntry).ok).toBe(false);

    const [key, rec] = Object.entries(d.attendance)[0];
    const orphan = { ...d, attendance: { [key]: { ...rec, entryId: 'ghost' } } };
    expect(parseAppData(orphan).ok).toBe(false);

    const badStatus = { ...d, attendance: { [key]: { ...rec, status: 'late' } } };
    expect(parseAppData(badStatus).ok).toBe(false);

    const badKey = { ...d, attendance: { wrong: rec } };
    expect(parseAppData(badKey).ok).toBe(false);
  });

  it('rejects invalid times and weekdays', () => {
    const d = sample();
    expect(parseAppData({ ...d, timetable: [{ ...d.timetable[0], endTime: '08:00' }] }).ok).toBe(false);
    expect(parseAppData({ ...d, timetable: [{ ...d.timetable[0], weekday: 7 }] }).ok).toBe(false);
    expect(parseAppData({ ...d, timetable: [{ ...d.timetable[0], startTime: '9am' }] }).ok).toBe(false);
  });

  it('round-trips extra classes and rejects malformed ones', () => {
    const d = sample();
    const ok = addExtraClass(d, '2025-01-08', { courseId: d.courses[0].id, startTime: '14:00', endTime: '15:00' });
    expect(parseAppData(JSON.parse(JSON.stringify(ok))).ok).toBe(true);
    const bad = { ...ok, timetable: ok.timetable.map((e) => (e.extra ? { ...e, activeTo: '2025-02-01' } : e)) };
    expect(parseAppData(bad).ok).toBe(false);
  });
});
