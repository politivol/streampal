import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function AuthPanel({ onSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('magic');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: import.meta.env.VITE_SITE_URL },
    });
    if (error) setError(error.message);
    else setMessage('Check your email for the magic link.');
  };

  const signUp = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: import.meta.env.VITE_SITE_URL },
    });
    if (error) setError(error.message);
    else onSession?.(data.session);
  };

  const signInWithProvider = async (provider) => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: import.meta.env.VITE_SITE_URL },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="panel">
      <h2>{mode === 'sign_up' ? 'Sign Up' : 'Sign In'}</h2>
      {mode === 'sign_up' ? (
        <form onSubmit={signUp} className="row row--inputs">
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
            Sign Up
          </button>
        </form>
      ) : (
        <form onSubmit={sendMagicLink} className="row row--inputs">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit">
            Send Magic Link
          </button>
        </form>
      )}
      {error && <p>{error}</p>}
      {message && <p>{message}</p>}
      <div className="row row--inputs">
        <button
          className="btn secondary"
          type="button"
          onClick={() => signInWithProvider('google')}
        >
          Google
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={() => signInWithProvider('github')}
        >
          GitHub
        </button>
      </div>
      <p>
        {mode === 'sign_up' ? (
          <>Already have an account?{' '}
            <button
              className="btn secondary"
              type="button"
              onClick={() => setMode('magic')}
            >
              Sign in
            </button>
          </>
        ) : (
          <>Need an account?{' '}
            <button
              className="btn secondary"
              type="button"
              onClick={() => setMode('sign_up')}
            >
              Sign up
            </button>
          </>
        )}
      </p>
    </div>
  );
}

