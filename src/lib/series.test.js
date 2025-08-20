import { describe, it, expect, vi, afterEach } from 'vitest';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('fetchSeriesEntries', () => {
  it('sorts TMDB collection entries by release date', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_TMDB_API_KEY', 'tmdb-key');
    const { fetchSeriesEntries } = await import('./series');

    const mockResponse = {
      parts: [
        { id: 1, title: 'B', release_date: '2020-01-01' },
        { id: 2, title: 'A', release_date: '2019-01-01' }
      ]
    };
    const fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(mockResponse) }));
    global.fetch = fetchMock;

    const result = await fetchSeriesEntries({ type: 'tmdb', id: 123 });

    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual([
      { id: 2, title: 'A', releaseDate: '2019-01-01' },
      { id: 1, title: 'B', releaseDate: '2020-01-01' }
    ]);
  });

  it('sorts OMDb episodes by release date', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_OMDB_PROXY_URL', 'https://example.com/omdb');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb-anon');
    const { fetchSeriesEntries } = await import('./series');

    const season1 = {
      Episodes: [
        { Episode: '1', Title: 'Ep1', imdbID: 'e1', Released: '02 Jan 2020' },
        { Episode: '2', Title: 'Ep2', imdbID: 'e2', Released: '01 Jan 2020' }
      ]
    };

    const fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(season1) }));
    global.fetch = fetchMock;

    const result = await fetchSeriesEntries({ type: 'omdb', imdbId: 'tt123', totalSeasons: '1' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://example.com/omdb?i=tt123&Season=1'),
      expect.anything()
    );
    expect(result).toEqual([
      { imdbID: 'e2', title: 'S1E2 - Ep2', releaseDate: '01 Jan 2020' },
      { imdbID: 'e1', title: 'S1E1 - Ep1', releaseDate: '02 Jan 2020' }
    ]);
  });
});
