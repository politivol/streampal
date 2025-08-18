import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function AuthPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('sign_in');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'sign_in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: import.meta.env.VITE_SITE_URL },
      });
      if (error) setError(error.message);
    }
  };

  return (
    <div className="panel">
      <h2>{mode === 'sign_in' ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="row row--inputs">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn" type="submit">
          {mode === 'sign_in' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      {error && <p>{error}</p>}
      <p>
        {mode === 'sign_in' ? (
          <>Need an account?{' '}
            <button className="btn secondary" type="button" onClick={() => setMode('sign_up')}>Sign up</button>
          </>
        ) : (
          <>Have an account?{' '}
            <button className="btn secondary" type="button" onClick={() => setMode('sign_in')}>Sign in</button>
          </>
        )}
      </p>
    </div>
  );
}
