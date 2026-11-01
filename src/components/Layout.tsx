import type { ReactNode } from 'react';
import { CalendarCheck, CheckCircle2, LayoutDashboard, Settings } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/log', label: 'Log', icon: CalendarCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function isActive(path: string, to: string) {
  if (to === '/') return path === '/' || path.startsWith('/course/');
  return path === to;
}

export function Layout({
  path,
  saveFailed,
  children,
}: {
  path: string;
  saveFailed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold">
          <CheckCircle2 className="text-indigo-600" /> Attendly
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <a
              key={to}
              href={`#${to}`}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                isActive(path, to) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={20} /> {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8 md:pb-10 md:pt-8">
        {saveFailed && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Couldn’t save to this browser’s storage. Export a backup from Settings so you don’t lose
            changes.
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <a
            key={to}
            href={`#${to}`}
            aria-current={isActive(path, to) ? 'page' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              isActive(path, to) ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Icon size={22} strokeWidth={isActive(path, to) ? 2.5 : 2} />
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
