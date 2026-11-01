import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { CourseManager } from '../components/CourseManager';
import { DataManager } from '../components/DataManager';
import { SemesterForm } from '../components/SemesterForm';
import { TimetableEditor } from '../components/TimetableEditor';
import { ConfirmDialog, PageHeader } from '../components/ui';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mb-3 text-sm text-slate-500">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

export function Settings() {
  const { data, setSettings, reset } = useAppData();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <PageHeader title="Settings" />

      <Section title="Semester" hint="Changing dates or the threshold never alters logged attendance.">
        <div className="card p-4">
          <SemesterForm
            initial={data.settings!}
            submitLabel="Save semester"
            onSubmit={(s) => {
              setSettings(s);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          />
          {saved && (
            <p className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-600">
              <Check size={16} /> Saved
            </p>
          )}
        </div>
      </Section>

      <Section title="Courses" hint="Archive a course to hide it but keep its history.">
        <CourseManager />
      </Section>

      <Section title="Timetable" hint="Removing or moving a class keeps the attendance you already logged.">
        <TimetableEditor />
      </Section>

      <Section title="Backup" hint="Export everything as JSON, or restore from a backup. Imports are validated before anything is replaced.">
        <DataManager />
      </Section>

      <Section title="Danger zone">
        <button className="btn-secondary w-full !border-rose-200 text-rose-600" onClick={() => setConfirmReset(true)}>
          Erase all data
        </button>
      </Section>

      {confirmReset && (
        <ConfirmDialog
          title="Erase all data?"
          message="This deletes your semester, courses, timetable and all attendance from this browser. Export a backup first if you might need it."
          confirmLabel="Erase everything"
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            reset();
            setConfirmReset(false);
            window.location.hash = '/';
          }}
        />
      )}
    </>
  );
}
