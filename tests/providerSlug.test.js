import { describe, it, expect } from 'vitest';
import { providerSlug } from '../src/providerSlug.js';

describe('providerSlug', () => {
  it('maps HBO Max names to max', () => {
    expect(providerSlug('HBO Max')).toBe('max');
    expect(providerSlug('hbo max')).toBe('max');
  });

  it('maps Amazon Prime Video names to prime', () => {
    expect(providerSlug('Amazon Prime Video')).toBe('prime');
    expect(providerSlug('amazon prime video')).toBe('prime');
  });

  it('maps Apple TV+ names to appletv', () => {
    expect(providerSlug('Apple TV+')).toBe('appletv');
    expect(providerSlug('APPLE TV+')).toBe('appletv');
  });
});
