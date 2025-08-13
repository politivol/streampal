export function providerSlug(name) {
  const n = name.toLowerCase();
  if (n.includes('freevee')) return 'freevee';
  if (n.includes('prime') || n.includes('amazon')) return 'prime';
  if (n.includes('netflix')) return 'netflix';
  if (n.includes('disney')) return 'disney';
  if (n.includes('hulu')) return 'hulu';
  if (n === 'max' || n.includes('hbo')) return 'max';
  if (n.includes('apple')) return 'appletv';
  if (n.includes('paramount')) return 'paramount';
  if (n.includes('peacock')) return 'peacock';
  if (n.includes('starz')) return 'starz';
  if (n.includes('showtime')) return 'showtime';
  if (n.includes('amc')) return 'amc';
  if (n.includes('criterion')) return 'criterion';
  if (n.includes('tubi')) return 'tubi';
  if (n.includes('pluto')) return 'pluto';
  return '';
}

export default providerSlug;
