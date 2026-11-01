import { describe, expect, it } from 'vitest';
import {
  computeStats,
  countRecords,
  describeSigned,
  formatPercentage,
  formatSigned,
} from './attendance';
import type { AttendanceRecord } from '../types';

describe('computeStats', () => {
  it('returns no data when nothing is logged', () => {
    const s = computeStats(0, 0, 0.8);
    expect(s.percentage).toBeNull();
    expect(s.signed).toBeNull();
    expect(s.level).toBe('none');
    expect(formatPercentage(s.percentage)).toBe('--');
    expect(formatSigned(s.signed)).toBe('--');
  });

  it('computes percentage', () => {
    expect(computeStats(8, 2, 0.8).percentage).toBe(80);
    expect(computeStats(3, 1, 0.8).percentage).toBe(75);
  });

  it('gives bunk allowance when above threshold', () => {
    // 9/10 = 90%; 9/0.8 = 11.25 -> can reach 11 classes -> miss 1
    expect(computeStats(9, 1, 0.8).allowance).toBe(1);
    // 10/10; 10/0.8 = 12.5 -> miss 2
    expect(computeStats(10, 0, 0.8).allowance).toBe(2);
    expect(computeStats(10, 0, 0.8).signed).toBe(2);
  });

  it('gives +0 exactly at the threshold, despite float noise', () => {
    const s = computeStats(4, 1, 0.8); // 4 / 0.8 = 5.000000000000001
    expect(s.allowance).toBe(0);
    expect(s.signed).toBe(0);
    expect(formatSigned(s.signed)).toBe('+0');
    expect(s.level).toBe('good');
    expect(computeStats(8, 2, 0.8).allowance).toBe(0);
  });

  it('gives recovery classes when below threshold', () => {
    // 3/4 = 75% -> need (0.8*4 - 3) / 0.2 = 1 class
    const a = computeStats(3, 1, 0.8);
    expect(a.recovery).toBe(1);
    expect(a.signed).toBe(-1);
    // 6/10 = 60% -> (8 - 6)/0.2 = 10
    const b = computeStats(6, 4, 0.8);
    expect(b.recovery).toBe(10);
    expect(formatSigned(b.signed)).toBe('−10');
    // 0/1 -> 0.8/0.2 = 4
    expect(computeStats(0, 1, 0.8).recovery).toBe(4);
  });

  it('recovery classes actually restore the threshold', () => {
    for (let p = 0; p <= 20; p++) {
      for (let a = 1; a <= 20; a++) {
        const s = computeStats(p, a, 0.75);
        if (s.recovery !== null) {
          const after = computeStats(p + s.recovery, a, 0.75);
          expect(after.allowance).not.toBeNull();
          if (s.recovery > 1) {
            expect(computeStats(p + s.recovery - 1, a, 0.75).allowance).toBeNull();
          }
        }
      }
    }
  });

  it('allowance never lets attendance drop below the threshold', () => {
    for (let p = 1; p <= 30; p++) {
      for (let a = 0; a <= 10; a++) {
        const s = computeStats(p, a, 0.8);
        if (s.allowance === null) continue;
        const total = p + a + s.allowance;
        expect(p / total).toBeGreaterThanOrEqual(0.8 - 1e-9);
        expect(p / (total + 1)).toBeLessThan(0.8);
      }
    }
  });

  it('assigns levels', () => {
    expect(computeStats(9, 1, 0.8).level).toBe('good');
    expect(computeStats(15, 4, 0.8).level).toBe('warning'); // 78.9%
    expect(computeStats(5, 5, 0.8).level).toBe('danger');
  });

  it('handles a 100% threshold without dividing by zero', () => {
    expect(computeStats(5, 0, 1).allowance).toBe(0);
    const s = computeStats(4, 1, 1);
    expect(s.recovery).toBeNull();
    expect(s.signed).toBeNull();
  });
});

describe('describeSigned', () => {
  it('describes each case', () => {
    expect(describeSigned(computeStats(0, 0, 0.8))).toBe('No classes logged yet');
    expect(describeSigned(computeStats(10, 0, 0.8))).toBe('Can miss 2 more classes');
    expect(describeSigned(computeStats(9, 1, 0.8))).toBe('Can miss one more class');
    expect(describeSigned(computeStats(4, 1, 0.8))).toBe('Cannot miss another class');
    expect(describeSigned(computeStats(3, 1, 0.8))).toBe('Must attend the next class to recover');
    expect(describeSigned(computeStats(6, 4, 0.8))).toContain('next 10 consecutive classes');
  });
});

describe('countRecords', () => {
  const rec = (entryId: string, courseId: string, date: string, status: AttendanceRecord['status']) => ({
    entryId,
    courseId,
    date,
    status,
  });
  const records = [
    rec('e1', 'c1', '2025-01-06', 'present'),
    rec('e1', 'c1', '2025-01-13', 'absent'),
    rec('e1', 'c1', '2025-01-20', 'cancelled'),
    rec('e2', 'c2', '2025-01-06', 'present'),
    rec('e1', 'c1', '2025-02-03', 'present'), // future
  ];

  it('ignores cancelled and future records', () => {
    expect(countRecords(records, '2025-01-31', new Set(['c1']))).toEqual({
      present: 1,
      absent: 1,
      cancelled: 1,
    });
  });

  it('sums across courses when unfiltered', () => {
    expect(countRecords(records, '2025-01-31')).toEqual({ present: 2, absent: 1, cancelled: 1 });
  });
});
