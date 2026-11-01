import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { SemesterSettings } from '../types';
import { useAppData } from '../hooks/useAppData';
import { CourseManager } from '../components/CourseManager';
import { DataManager } from '../components/DataManager';
import { SemesterForm, defaultSemester } from '../components/SemesterForm';
import { TimetableEditor } from '../components/TimetableEditor';

const STEPS = ['Semester', 'Courses', 'Timetable'];

export function Setup() {
  const { data, setSettings } = useAppData();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SemesterSettings>(defaultSemester);

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-6 flex items-center gap-2 text-xl font-extrabold">
        <CheckCircle2 className="text-indigo-600" /> Attendly
      </div>

      <ol className="mb-6 flex gap-2" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <span className={`mt-1 block text-xs font-semibold ${i === step ? 'text-indigo-700' : 'text-slate-400'}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Set up your semester</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Tell us when the semester runs and how much attendance you need.
          </p>
          <SemesterForm
            initial={draft}
            submitLabel="Continue"
            onSubmit={(s) => {
              setDraft(s);
              setStep(1);
            }}
          />
          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="mb-3 text-sm text-slate-500">Already have a backup?</p>
            <DataManager showExport={false} />
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Add your courses</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">Name, code and a color for each course.</p>
          <CourseManager />
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary flex-1" disabled={data.courses.length === 0} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Build your timetable</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Add each class to its weekday. You can add several of the same course on one day.
          </p>
          <TimetableEditor />
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary flex-1" disabled={data.timetable.length === 0} onClick={() => setSettings(draft)}>
              Finish setup
            </button>
          </div>
        </>
      )}
    </div>
  );
}
