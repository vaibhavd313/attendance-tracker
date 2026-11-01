import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData, DisplayStatus, SemesterSettings } from '../types';
import { loadData, saveData } from '../storage/storage';
import * as ops from '../utils/dataOps';
import { todayISO } from '../utils/dates';

interface AppActions {
  setSettings: (s: SemesterSettings) => void;
  addCourse: (input: ops.CourseInput) => void;
  updateCourse: (id: string, input: ops.CourseInput) => void;
  setCourseArchived: (id: string, archived: boolean) => void;
  deleteCourse: (id: string) => void;
  addEntry: (input: ops.EntryInput) => void;
  updateEntry: (id: string, input: ops.EntryInput) => void;
  removeEntry: (id: string) => void;
  addExtraClass: (date: string, input: Omit<ops.EntryInput, 'weekday'>) => void;
  removeExtraClass: (entryId: string) => void;
  setAttendance: (entryId: string, date: string, status: DisplayStatus) => void;
  replaceAll: (data: AppData) => void;
  reset: () => void;
}

interface AppContextValue extends AppActions {
  data: AppData;
  saveFailed: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [saveFailed, setSaveFailed] = useState(false);

  // Every change is written straight to localStorage
  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  const apply = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);

  const actions = useMemo<AppActions>(
    () => ({
      setSettings: (s) => apply((d) => ops.setSettings(d, s)),
      addCourse: (i) => apply((d) => ops.addCourse(d, i)),
      updateCourse: (id, i) => apply((d) => ops.updateCourse(d, id, i)),
      setCourseArchived: (id, a) => apply((d) => ops.setCourseArchived(d, id, a)),
      deleteCourse: (id) => apply((d) => ops.deleteCourse(d, id)),
      addEntry: (i) => apply((d) => ops.addEntry(d, i)),
      updateEntry: (id, i) => apply((d) => ops.updateEntry(d, id, i, todayISO())),
      removeEntry: (id) => apply((d) => ops.removeEntry(d, id, todayISO())),
      addExtraClass: (date, i) => apply((d) => ops.addExtraClass(d, date, i)),
      removeExtraClass: (id) => apply((d) => ops.removeExtraClass(d, id)),
      setAttendance: (e, date, s) => apply((d) => ops.setAttendance(d, e, date, s)),
      replaceAll: (next) => setData(next),
      reset: () => setData(ops.emptyData()),
    }),
    [apply],
  );

  const value = useMemo(() => ({ data, saveFailed, ...actions }), [data, saveFailed, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used inside AppProvider');
  return ctx;
}
