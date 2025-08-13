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

  it('maps Netflix variants to netflix', () => {
    expect(providerSlug('Netflix')).toBe('netflix');
    expect(providerSlug('Netflix Basic with Ads')).toBe('netflix');
  });

  it('maps Paramount+ variants to paramount', () => {
    expect(providerSlug('Paramount+')).toBe('paramount');
    expect(providerSlug('Paramount+ with Showtime')).toBe('paramount');
  });
});

describe('provider grouping', () => {
  function groupBySlug(list) {
    const seen = new Map();
    list.forEach(p => {
      const slug = providerSlug(p.provider_name);
      if (!slug) return;
      if (!seen.has(slug)) seen.set(slug, p);
    });
    return [...seen.values()];
  }

  it('coalesces Netflix variants into one chip', () => {
    const providers = [
      { provider_id: 8, provider_name: 'Netflix' },
      { provider_id: 275, provider_name: 'Netflix Basic with Ads' },
    ];
    const grouped = groupBySlug(providers);
    expect(grouped).toHaveLength(1);
    expect(providerSlug(grouped[0].provider_name)).toBe('netflix');
  });

  it('coalesces Paramount+ variants into one chip', () => {
    const providers = [
      { provider_id: 531, provider_name: 'Paramount+' },
      { provider_id: 789, provider_name: 'Paramount+ with Showtime' },
    ];
    const grouped = groupBySlug(providers);
    expect(grouped).toHaveLength(1);
    expect(providerSlug(grouped[0].provider_name)).toBe('paramount');
  });
});
