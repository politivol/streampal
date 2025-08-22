import React, { useState, useEffect } from 'react';
import { devConfig } from '../lib/devConfig.js';
import config from '../lib/config.js';

export default function DevStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({});

  useEffect(() => {
    // Only show in development
    if (!import.meta.env.DEV) return;

    const checkStatus = () => {
      setStatus({
        tmdbApi: !!config.tmdbApiKey,
        omdbProxy: !!config.omdbProxyUrl,
        rtProxy: !!config.rtProxyUrl,
        googleAuth: !!config.googleClientId,
        supabase: !!(config.supabaseUrl && config.supabaseAnonKey),
        mockMode: devConfig.mockRTScores
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
            <div>📊 TMDB API: {status.tmdbApi ? '✅' : '❌'}</div>
            <div>🎬 OMDB Proxy: {status.omdbProxy ? '✅' : '⚠️ CORS'}</div>
            <div>🍅 RT Proxy: {status.rtProxy ? '✅' : '⚠️ CORS'}</div>
            <div>🔐 Google Auth: {status.googleAuth ? '⚠️ Local' : '❌'}</div>
            <div>🗄️ Supabase: {status.supabase ? '✅' : '❌'}</div>
            {status.mockMode && <div>🎭 Mock RT Scores: ✅</div>}
            <div style={{ marginTop: '5px', fontSize: '10px' }}>
              ⚠️ = Expected in local dev
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
