import { useState } from 'react';
import type { FormEvent } from 'react';
import { Archive, ArchiveRestore, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Course } from '../types';
import { useAppData } from '../hooks/useAppData';
import { COURSE_COLORS, courseHasHistory } from '../utils/dataOps';
import { ConfirmDialog, Dialog, EmptyState } from './ui';

function CourseForm({
  course,
  defaultColor,
  onClose,
}: {
  course?: Course;
  defaultColor: string;
  onClose: () => void;
}) {
  const { addCourse, updateCourse } = useAppData();
  const [name, setName] = useState(course?.name ?? '');
  const [code, setCode] = useState(course?.code ?? '');
  const [color, setColor] = useState(course?.color ?? defaultColor);
  // Every course has a lab component, so new courses add one by default
  const [withLab, setWithLab] = useState(true);
  const [labCode, setLabCode] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return setError('Name and code are required.');
    if (!course && withLab && !labCode.trim()) return setError('Enter the lab code, or untick the lab option.');
    if (course) updateCourse(course.id, { name, code, color });
    else {
      addCourse({ name, code, color });
      if (withLab) addCourse({ name: `${name.trim()} Lab`, code: labCode, color });
    }
    onClose();
  };

  return (
    <Dialog title={course ? 'Edit course' : 'Add course'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="course-name">Course name</label>
          <input id="course-name" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Linear Algebra" />
        </div>
        <div>
          <label className="label" htmlFor="course-code">Course code</label>
          <input id="course-code" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MA201" />
        </div>
        {!course && (
          <div className="rounded-xl border border-slate-200 p-3">
            <label className="flex min-h-10 items-center gap-3 text-sm font-medium">
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={withLab} onChange={(e) => setWithLab(e.target.checked)} />
              Also add the Lab component
            </label>
            {withLab && (
              <div className="mt-2">
                <label className="label" htmlFor="lab-code">Lab code</label>
                <input id="lab-code" className="input" value={labCode} onChange={(e) => setLabCode(e.target.value)} placeholder="e.g. MA201L" />
                <p className="mt-1 text-xs text-slate-500">
                  Added as a separate course named “{name.trim() || 'Subject'} Lab”, so Theory and Lab track attendance independently.
                </p>
              </div>
            )}
          </div>
        )}
        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`h-10 w-10 rounded-full ring-offset-2 ${color === c ? 'ring-2 ring-slate-900' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm font-medium text-rose-600" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full">{course ? 'Save changes' : 'Add course'}</button>
      </form>
    </Dialog>
  );
}

export function CourseManager() {
  const { data, setCourseArchived, deleteCourse } = useAppData();
  const [editing, setEditing] = useState<Course | 'new' | null>(null);
  const [toArchive, setToArchive] = useState<Course | null>(null);
  const [toDelete, setToDelete] = useState<Course | null>(null);

  const active = data.courses.filter((c) => !c.archived);
  const archived = data.courses.filter((c) => c.archived);

  const row = (c: Course) => (
    <li key={c.id} className="flex items-center gap-3 py-3">
      <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${c.archived ? 'text-slate-500' : ''}`}>{c.name}</p>
        <p className="truncate text-xs text-slate-500">{c.code}</p>
      </div>
      <button className="btn-ghost !px-2" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
        <Pencil size={18} />
      </button>
      {c.archived ? (
        <button className="btn-ghost !px-2" aria-label={`Restore ${c.name}`} onClick={() => setCourseArchived(c.id, false)}>
          <ArchiveRestore size={18} />
        </button>
      ) : (
        <button className="btn-ghost !px-2" aria-label={`Archive ${c.name}`} onClick={() => setToArchive(c)}>
          <Archive size={18} />
        </button>
      )}
      {!courseHasHistory(data, c.id) && (
        <button className="btn-ghost !px-2 text-rose-600" aria-label={`Delete ${c.name}`} onClick={() => setToDelete(c)}>
          <Trash2 size={18} />
        </button>
      )}
    </li>
  );

  return (
    <div>
      {data.courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses yet"
          text="Add the courses you’re taking this semester."
        />
      ) : (
        <ul className="card divide-y divide-slate-100 px-4">
          {active.map(row)}
          {archived.length > 0 && (
            <li className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Archived</li>
          )}
          {archived.map(row)}
        </ul>
      )}
      <button className="btn-secondary mt-3 w-full" onClick={() => setEditing('new')}>
        <Plus size={18} /> Add course
      </button>

      {editing && (
        <CourseForm
          course={editing === 'new' ? undefined : editing}
          defaultColor={COURSE_COLORS[data.courses.length % COURSE_COLORS.length]}
          onClose={() => setEditing(null)}
        />
      )}
      {toArchive && (
        <ConfirmDialog
          title="Archive course?"
          message={`“${toArchive.name}” will be hidden from the dashboard and no new classes will be scheduled. Its attendance history is kept and you can restore it any time.`}
          confirmLabel="Archive"
          onCancel={() => setToArchive(null)}
          onConfirm={() => {
            setCourseArchived(toArchive.id, true);
            setToArchive(null);
          }}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete course?"
          message={`“${toDelete.name}” has no attendance history. Deleting it also removes its timetable slots. This can’t be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteCourse(toDelete.id);
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
