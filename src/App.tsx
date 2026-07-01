/**
 * App — top-level view switch between the cinematic Landing page and the
 * emulator Studio. A hash (`#studio`) keeps the chosen view across reloads.
 */

import { useEffect, useState } from 'react';
import Landing from './components/landing/Landing';
import Studio from './components/studio/Studio';

type View = 'landing' | 'studio';

export default function App() {
  const [view, setView] = useState<View>(() =>
    window.location.hash === '#studio' ? 'studio' : 'landing',
  );

  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#studio' ? 'studio' : 'landing');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const enter = () => {
    window.location.hash = 'studio';
    setView('studio');
    window.scrollTo(0, 0);
  };

  const exit = () => {
    window.location.hash = '';
    setView('landing');
  };

  return (
    <div className="view-root" data-view={view}>
      {view === 'landing' ? <Landing onEnter={enter} /> : <Studio onExit={exit} />}
    </div>
  );
}
