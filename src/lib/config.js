const REQUIRED_KEYS = {
  supabaseUrl: 'VITE_SUPABASE_URL',
  supabaseAnonKey: 'VITE_SUPABASE_ANON_KEY',
  siteUrl: 'VITE_SITE_URL',
  googleClientId: 'VITE_GOOGLE_CLIENT_ID',
};

const OPTIONAL_KEYS = {
  omdbProxyUrl: 'VITE_OMDB_PROXY_URL',
  tmdbApiKey: 'VITE_TMDB_API_KEY',
  tmdbProxyUrl: 'VITE_TMDB_PROXY_URL',
};

const config = {};
const missing = [];

for (const [key, envKey] of Object.entries(REQUIRED_KEYS)) {
  const value = import.meta.env[envKey];
  if (!value) missing.push(envKey);
  else config[key] = value;
}

for (const [key, envKey] of Object.entries(OPTIONAL_KEYS)) {
  const value = import.meta.env[envKey];
  if (value) config[key] = value;
}

if (!config.tmdbApiKey && !config.tmdbProxyUrl) {
  missing.push('VITE_TMDB_PROXY_URL or VITE_TMDB_API_KEY');
}

if (missing.length) {
  const message = `Missing environment variables: ${missing.join(', ')}`;
  if (import.meta.env.PROD) {
    throw new Error(message);
  } else {
    console.error(message);
  }
}

export default config;
