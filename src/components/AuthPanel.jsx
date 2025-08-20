import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../lib/toast.js';

export default function AuthPanel({ onSession, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('sign_in');

  const signIn = async (e) => {
    e?.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) toast(error.message, 'danger', 5000, 'exclamation-octagon');
    else {
      toast('Signed in successfully.', 'success', 5000, 'check-circle');
      onSession?.(data.session);
    }
  };

  const signUp = async (e) => {
    e?.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: import.meta.env.VITE_SITE_URL },
    });
    if (error) toast(error.message, 'danger', 5000, 'exclamation-octagon');
    else {
      toast('Account created successfully.', 'success', 5000, 'check-circle');
      onSession?.(data.session);
    }
  };

  const googleButtonRef = useRef(null);

  const handleGoogleCallback = async (response) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });
    if (error) toast(error.message, 'danger', 5000, 'exclamation-octagon');
    else {
      toast('Signed in successfully.', 'success', 5000, 'check-circle');
      onSession?.(data.session);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: 'outline', size: 'large', text: 'signin_with' }
        );
      }
    };
    document.body.appendChild(script);
    return () => {
      // Remove the Google SDK script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Remove the rendered Google button
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="panel modal">
      <div className="row row--actions">
        <h2>{mode === 'sign_up' ? 'Sign Up' : 'Sign In'}</h2>
        <sl-button variant="neutral" type="button" onClick={onClose}>
          Close
        </sl-button>
      </div>
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
          <sl-button variant="primary" type="submit" onClick={signUp}>
            Sign Up
          </sl-button>
        </form>
      ) : (
        <form onSubmit={signIn} className="row row--inputs">
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
          <sl-button variant="primary" type="submit" onClick={signIn}>
            Sign In
          </sl-button>
        </form>
      )}
      <div className="row row--inputs">
        <div ref={googleButtonRef}></div>
      </div>
      <p>
        {mode === 'sign_up' ? (
          <>Already have an account?{' '}
            <sl-button
              variant="neutral"
              type="button"
              onClick={() => setMode('sign_in')}
            >
              Sign in
            </sl-button>
          </>
        ) : (
          <>Need an account?{' '}
            <sl-button
              variant="neutral"
              type="button"
              onClick={() => setMode('sign_up')}
            >
              Sign up
            </sl-button>
          </>
        )}
      </p>
    </div>
  );
}

