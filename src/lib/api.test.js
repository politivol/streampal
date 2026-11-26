import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalFetch = global.fetch;

beforeEach(() => {
  vi.stubEnv('VITE_TMDB_API_KEY', 'test-key');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb-anon-key');
  vi.stubEnv('VITE_SITE_URL', 'http://localhost:5173');
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client');
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('searchTitles', () => {
  it('normalizes movie search results', async () => {
    vi.resetModules();
    const { searchTitles } = await import('./api');
    const fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        results: [
          { id: 1, title: 'Movie', poster_path: '/p.jpg' },
          { id: 2, name: 'Show', poster_path: null },
        ],
      }),
    }));
    global.fetch = fetchMock;

    const result = await searchTitles('matrix', 'movie');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/search/movie?'));
    expect(fetchMock.mock.calls[0][0]).toContain('query=matrix');
    expect(result).toEqual([
      {
        id: 1,
        title: 'Movie',
        artwork: 'https://image.tmdb.org/t/p/w500/p.jpg',
        mediaType: 'movie',
      },
      {
        id: 2,
        title: 'Show',
        artwork: null,
        mediaType: 'movie',
      },
    ]);
  });
});

describe('fetchDetails', () => {
  it('uses the requested media type and reads the IMDb score', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_OMDB_PROXY_URL', 'https://example.com/omdb-proxy');
    const { fetchDetails } = await import('./api');

    const tmdbData = {
      id: 1,
      name: 'Show 1',
      poster_path: '/p1.jpg',
      genres: [{ id: 1, name: 'Drama' }],
      vote_average: 8.3,
      external_ids: { imdb_id: 'tt123' },
      'watch/providers': {
        results: {
          US: {
            flatrate: [
              { provider_name: 'Netflix' },
              { provider_name: 'Obscure Provider' },
            ],
          },
        },
      },
      belongs_to_collection: null,
    };
    const omdbData = {
      Title: 'Show 1',
      Ratings: [{ Source: 'Internet Movie Database', Value: '8.1/10' }],
      Type: 'series',
      totalSeasons: '2',
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tmdbData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(omdbData) });
    global.fetch = fetchMock;

    const result = await fetchDetails(1, 'tv');

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/tv/1?'));
    expect(fetchMock.mock.calls[0][0]).not.toContain('/movie/1');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://example.com/omdb-proxy?i=tt123'),
      expect.anything()
    );
    expect(fetchMock.mock.calls[1][0]).not.toContain('tomatoes=true');
    expect(result.ratings).toEqual({ tmdb: 8.3, imdb: 8.1 });
    expect(result.mediaType).toBe('tv');
    expect(result.streaming).toEqual(['Netflix']);
    expect(result.series).toEqual({
      name: 'Show 1',
      totalSeasons: '2',
      imdbId: 'tt123',
      type: 'omdb',
    });
  });
});

describe('discoverTitles', () => {
  it('sends genre, provider, rating, and year filters to TMDB', async () => {
    vi.resetModules();
    const { discoverTitles } = await import('./api');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ genres: [{ id: 28, name: 'Action' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ provider_name: 'Netflix', provider_id: 8 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: 1, title: 'Movie', poster_path: '/p.jpg' }] }),
      });
    global.fetch = fetchMock;

    const result = await discoverTitles({
      mediaType: 'movie',
      genres: ['Action'],
      providers: ['Netflix'],
      minTmdb: 7,
      releaseDate: 'past_year',
    });

    const url = fetchMock.mock.calls[2][0];
    expect(url).toContain('/discover/movie?');
    expect(url).toContain('with_genres=28');
    expect(url).toContain('with_watch_providers=8');
    expect(url).toContain('vote_average.gte=7');
    expect(url).toContain('primary_release_date.gte=');
    expect(result[0]).toMatchObject({ id: 1, title: 'Movie', mediaType: 'movie' });
  });
});
