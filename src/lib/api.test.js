import { describe, it, expect, vi, afterEach } from 'vitest';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('fetchTrending', () => {
  it('fetches and normalizes trending data', async () => {
    vi.resetModules();
    const { fetchTrending } = await import('./api');

    const mockResponse = {
      results: [
        { id: 1, title: 'Movie', poster_path: '/p.jpg', media_type: 'movie' },
        { id: 2, name: 'Show', poster_path: null, media_type: 'tv' }
      ]
    };
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) }));
    global.fetch = fetchMock;

    const result = await fetchTrending('movie');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/trending/movie/week'));
    expect(result).toEqual([
      {
        id: 1,
        title: 'Movie',
        artwork: 'https://image.tmdb.org/t/p/w500/p.jpg',
        mediaType: 'movie'
      },
      {
        id: 2,
        title: 'Show',
        artwork: null,
        mediaType: 'tv'
      }
    ]);
  });
});

describe('fetchDetails', () => {
  it('combines TMDB and OMDb data and normalizes output', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_OMDB_PROXY_URL', 'https://example.com/omdb-proxy');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb-anon-key');
    const { fetchDetails } = await import('./api');

    const tmdbData = {
      id: 1,
      title: 'Movie 1',
      poster_path: '/p1.jpg',
      genres: [{ id: 1, name: 'Action' }],
      vote_average: 8.3,
      external_ids: { imdb_id: 'tt123' },
      'watch/providers': {
        results: {
          US: {
            flatrate: [
              { provider_name: 'Netflix with ads' },
              { provider_name: 'Amazon Prime Video' },
              { provider_name: 'HBO Max' },
              { provider_name: 'Hulu' },
              { provider_name: 'Obscure Provider' }
            ]
          }
        }
      },
      belongs_to_collection: null
    };
    const omdbData = {
      Title: 'Movie 1',
      Ratings: [{ Source: 'Rotten Tomatoes', Value: '88%' }],
      Type: 'series',
      totalSeasons: '2'
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tmdbData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(omdbData) });

    global.fetch = fetchMock;

    const result = await fetchDetails(1);

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/movie/1'));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://example.com/omdb-proxy?i=tt123&tomatoes=true'),
      expect.anything()
    );

    expect(result).toEqual({
      id: 1,
      title: 'Movie 1',
      artwork: 'https://image.tmdb.org/t/p/w500/p1.jpg',
      releaseDate: null,
      runtime: null,
      genres: ['Action'],
      ratings: { tmdb: 8.3, rottenTomatoes: 88, rtSource: 'omdb' },
      streaming: ['Netflix', 'Prime Video', 'Max', 'Hulu'],
      series: { name: 'Movie 1', totalSeasons: '2', imdbId: 'tt123', type: 'omdb' },
      mediaType: 'movie'
    });
  });
});

describe('discoverTitles', () => {
  it('builds discover query with filters', async () => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { discoverTitles } = await import('./api');

    const fetchMock = vi
      .fn()
      // genres list
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ genres: [{ id: 28, name: 'Action' }] })
      })
      // providers list
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ results: [{ provider_name: 'Netflix', provider_id: 8 }] })
      })
      // discover first page (to get total_pages)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total_pages: 500, results: [] })
      })
      // discover random page results
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ results: [{ id: 1, title: 'Movie', poster_path: '/p.jpg' }] })
      });

    global.fetch = fetchMock;

    const result = await discoverTitles({
      mediaType: 'movie',
      genres: ['Action'],
      providers: ['Netflix'],
      minTmdb: 7
    });

    const url = fetchMock.mock.calls[3][0];
    expect(url).toContain('/discover/movie?');
    expect(url).toContain('with_genres=28');
    expect(url).toContain('with_watch_providers=8');
    expect(url).toContain('vote_average.gte=7');
    expect(url).toContain('page=251');

    expect(result).toEqual([
      {
        id: 1,
        title: 'Movie',
        artwork: 'https://image.tmdb.org/t/p/w500/p.jpg',
        mediaType: 'movie'
      }
    ]);
  });
});
