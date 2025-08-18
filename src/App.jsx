import { useEffect, useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';
import SeenList from './components/SeenList.jsx';
import { supabase } from './lib/supabaseClient.js';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <h1>StreamPal</h1>
      {session ? <SeenList session={session} /> : <AuthPanel />}
    </div>
  );
}

export default App;
