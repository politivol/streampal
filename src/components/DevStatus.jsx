import React, { useState, useEffect } from 'react';
import config from '../lib/config.js';

export default function DevStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({});

  useEffect(() => {
    // Only show in development
    if (!import.meta.env.DEV) return;

    const checkStatus = () => {
      setStatus({
        tmdbApi: !!(config.tmdbApiKey || config.tmdbProxyUrl),
        tmdbProxy: !!config.tmdbProxyUrl,
        omdbProxy: !!config.omdbProxyUrl,
        googleAuth: !!config.googleClientId,
        supabase: !!(config.supabaseUrl && config.supabaseAnonKey),
      });
    };

    checkStatus();
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: isVisible ? '300px' : 'auto',
        cursor: 'pointer'
      }}
      onClick={() => setIsVisible(!isVisible)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>🔧</span>
        <span>Dev Status</span>
        {isVisible && (
          <div style={{ marginLeft: '10px' }}>
            <div>📊 TMDB: {status.tmdbProxy ? '✅ proxy' : status.tmdbApi ? '⚠️ key in browser' : '❌'}</div>
            <div>🎬 OMDB Proxy: {status.omdbProxy ? '✅' : '⚠️ off'}</div>
            <div>🔐 Google Auth: {status.googleAuth ? '✅' : '❌'}</div>
            <div>🗄️ Supabase: {status.supabase ? '✅' : '❌'}</div>
            <div style={{ marginTop: '5px', fontSize: '10px' }}>
              ⚠️ = Expected in local dev
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
