import { useAppData } from './hooks/useAppData';
import { useHashRoute } from './hooks/useHashRoute';
import { Layout } from './components/Layout';
import { CourseDetail } from './pages/CourseDetail';
import { Dashboard } from './pages/Dashboard';
import { Log } from './pages/Log';
import { Settings } from './pages/Settings';
import { Setup } from './pages/Setup';

export default function App() {
  const { data, saveFailed } = useAppData();
  const { path } = useHashRoute();

  if (!data.settings) return <Setup />;

  let page;
  if (path.startsWith('/course/')) page = <CourseDetail courseId={path.slice('/course/'.length)} />;
  else if (path === '/log') page = <Log />;
  else if (path === '/settings') page = <Settings />;
  else page = <Dashboard />;

  return (
    <Layout path={path} saveFailed={saveFailed}>
      {page}
    </Layout>
  );
}
