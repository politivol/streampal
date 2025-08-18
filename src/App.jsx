import { useEffect, useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
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
    <div className="container">
      <Header />
      {session ? (
        <SeenList session={session} onSession={setSession} />
      ) : (
        <AuthPanel onSession={setSession} />
      )}
    </div>
  );
}

export default App;
