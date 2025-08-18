import { describe, it, expect } from 'vitest';
import { card } from '../src/card.js';

// Ensure card renders the entire overview without truncation

describe('card', () => {
  it('renders the full overview text', () => {
    const longText = 'A'.repeat(200);
    const t = { title: 'Test', overview: longText, id: 1, release_date: '2024-01-01' };
    const state = { genreMap: { movie: {} }, type: 'movie', kept: new Set(), seen: new Set() };
    const wrap = card(t, state, { saveSeen() {}, saveKept() {}, tmdbKey: '' });
    const sublabels = wrap.querySelectorAll('.sublabel');
    expect(sublabels[1].textContent).toBe(longText);
  });
});
