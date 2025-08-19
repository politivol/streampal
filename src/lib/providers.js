export const US_STREAMING_PROVIDERS = [
  'Netflix',
  'Hulu',
  'Disney+',
  'Max',
  'Prime Video',
  'Paramount+',
  'Peacock',
  'Apple TV+',
];

const PROVIDER_ALIASES = {
  'netflix': 'Netflix',
  'netflix with ads': 'Netflix',
  'netflix basic with ads': 'Netflix',
  'hulu': 'Hulu',
  'disney+': 'Disney+',
  'disney plus': 'Disney+',
  'hbo max': 'Max',
  'hbo go': 'Max',
  'hbo now': 'Max',
  'max': 'Max',
  'amazon prime video': 'Prime Video',
  'amazon video': 'Prime Video',
  'amazon prime': 'Prime Video',
  'paramount+': 'Paramount+',
  'paramount plus': 'Paramount+',
  'paramount+ with showtime': 'Paramount+',
  'peacock tv': 'Peacock',
  'peacock premium': 'Peacock',
  'peacock premium plus': 'Peacock',
  'apple tv+': 'Apple TV+',
  'apple tv plus': 'Apple TV+',
  'apple tv': 'Apple TV+',
};

export function normalizeProviderName(name) {
  const cleaned = name.toLowerCase().replace(/\s+with ads?/g, '').trim();
  const canonical = PROVIDER_ALIASES[cleaned];
  if (canonical) return canonical;
  return name.replace(/\s+with ads?/i, '').trim();
}
