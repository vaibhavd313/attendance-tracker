import { useEffect, useState } from 'react';
import { todayISO } from '../utils/dates';

/** Today's date, refreshed when the tab regains focus (so it rolls over at midnight). */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const refresh = () => setToday(todayISO());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}
