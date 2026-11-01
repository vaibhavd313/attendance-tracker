import type { AppData } from '../types';
import { emptyData } from '../utils/dataOps';
import { parseAppData } from '../utils/validate';

const KEY = 'attendly:v1';
const CORRUPT_KEY = 'attendly:v1:corrupt';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const result = parseAppData(JSON.parse(raw));
    if (result.ok) return result.data;
    // Keep the unreadable payload around rather than silently overwriting it
    localStorage.setItem(CORRUPT_KEY, raw);
  } catch {
    // storage unavailable or invalid JSON
  }
  return emptyData();
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadBackup(data: AppData): void {
  const blob = new Blob([exportJSON(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendly-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
