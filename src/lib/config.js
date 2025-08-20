const REQUIRED_KEYS = {
  supabaseUrl: 'VITE_SUPABASE_URL',
  supabaseAnonKey: 'VITE_SUPABASE_ANON_KEY',
  omdbProxyUrl: 'VITE_OMDB_PROXY_URL',
  siteUrl: 'VITE_SITE_URL',
  googleClientId: 'VITE_GOOGLE_CLIENT_ID',
};

const config = {};
const missing = [];

for (const [key, envKey] of Object.entries(REQUIRED_KEYS)) {
  const value = import.meta.env[envKey];
  if (!value) missing.push(envKey);
  if (value) config[key] = value;
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
