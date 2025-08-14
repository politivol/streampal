import { describe, it, expect, vi } from 'vitest';
import { fetchJSON } from '../src/fetchJSON.js';

describe('fetchJSON', () => {
  it('returns parsed JSON for ok responses', async () => {
    const data = { foo: 'bar' };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
    await expect(fetchJSON('/test')).resolves.toEqual(data);
  });

  it('throws an error for non-ok responses', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(fetchJSON('/bad')).rejects.toThrow('HTTP 404');
  });
});
