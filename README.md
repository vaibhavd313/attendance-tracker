# Attendly

A mobile-first college attendance tracker. Set up a weekly timetable, log each class as present, absent or cancelled, and see at a glance whether every course is meeting the required attendance (80% by default) and how many classes you can still miss.

Everything runs in the browser. There is no backend, no account and no external API; data is stored in `localStorage`.

## Features

- **First-time setup:** semester name, dates and attendance threshold, then courses and a Monday–Saturday timetable.
- **Theory and Lab:** adding a course can also add its Lab component, tracked separately.
- **Attendance logging:** navigate week by week; mark each class Present, Absent, Cancelled or Not logged. Past weeks stay editable and changes save immediately.
- **Extra classes:** add a one-off class to a specific day, for example a substitute for a cancelled class.
- **Per-course dashboard:** attendance percentage, present/total, and a prominent signed bunk allowance.
- **Course details:** statistics plus a full history where any record can be edited.
- **Settings:** edit the semester and threshold, manage courses and timetable, archive courses, export and import JSON backups.

## How attendance is calculated

With `P` = present, `A` = absent, `T = P + A`, and the threshold as a decimal (80% = 0.8):

| Situation | Result |
| --- | --- |
| Attendance ≥ threshold | `+floor(P / threshold − T)` classes can still be missed |
| Attendance < threshold | `−ceil((threshold × T − P) / (1 − threshold))` consecutive classes must be attended |
| Nothing logged yet | `--` |

Cancelled, not logged and future classes never count. A class is never marked absent automatically.

## Data and history

- Each timetable slot is an independent class on a date, and attendance is stored against stable slot IDs and real dates.
- Deleting or moving a slot that has attendance retires it instead of rewriting the past.
- Archiving a course keeps its history. Only courses with no attendance can be deleted.
- Imported JSON is validated before it replaces anything.

Data lives in the browser and is specific to each device, browser and URL. Use **Settings → Export JSON** to back up or move data between devices.

## Tech stack

React, Vite, TypeScript, Tailwind CSS, Lucide React. Tests use Vitest.

## Getting started

Requires Node 18 or newer.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm test         # run unit tests
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  components/   Reusable UI (course cards, forms, dialogs, navigation)
  pages/        Setup, Dashboard, Log, CourseDetail, Settings
  hooks/        App state context, hash router, current-date hook
  storage/      localStorage load/save and JSON export
  utils/        Attendance maths, scheduling, data operations, validation, dates (with tests)
  types/        Shared TypeScript interfaces
```

All attendance calculations live in `src/utils/attendance.ts`.

## Deployment

The app is a static Vite build and deploys to Vercel with no configuration: import the repository and keep the detected settings (build command `npm run build`, output directory `dist`). Routing uses the URL hash, so no rewrite rules are needed.
