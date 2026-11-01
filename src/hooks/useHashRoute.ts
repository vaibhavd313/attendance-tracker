import { useCallback, useEffect, useState } from 'react';

const read = () => window.location.hash.replace(/^#/, '') || '/';

/** Minimal hash router: avoids a dependency and needs no server rewrites on Vercel. */
export function useHashRoute() {
  const [path, setPath] = useState(read);

  useEffect(() => {
    const onChange = () => {
      setPath(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return { path, navigate };
}
