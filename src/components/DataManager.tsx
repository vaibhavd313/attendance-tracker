import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import type { AppData } from '../types';
import { useAppData } from '../hooks/useAppData';
import { downloadBackup } from '../storage/storage';
import { parseAppData } from '../utils/validate';
import { ConfirmDialog } from './ui';

export function DataManager({ showExport = true }: { showExport?: boolean }) {
  const { data, replaceAll } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [error, setError] = useState('');

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const result = parseAppData(JSON.parse(await file.text()));
      if (result.ok) setPending(result.data);
      else setError(result.error);
    } catch {
      setError('That file isn’t valid JSON.');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {showExport && (
          <button className="btn-secondary flex-1" onClick={() => downloadBackup(data)}>
            <Download size={18} /> Export JSON
          </button>
        )}
        <button className="btn-secondary flex-1" onClick={() => fileRef.current?.click()}>
          <Upload size={18} /> Import JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      </div>
      {error && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">Import failed: {error}</p>}
      {pending && (
        <ConfirmDialog
          title="Replace all data?"
          message={`This backup has ${pending.courses.length} course(s) and ${Object.keys(pending.attendance).length} attendance record(s). Importing replaces everything currently in the app.`}
          confirmLabel="Replace"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => {
            replaceAll(pending);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
