import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '../hooks/useFilterState.js';

// Mock the providers module
vi.mock('../lib/providers.js', () => ({
  normalizeProviderName: vi.fn((name) => name),
  US_STREAMING_PROVIDERS: ['Netflix', 'Hulu', 'Amazon Prime', 'Disney+'],
}));

// Mock the config module
vi.mock('../lib/config.js', () => ({
  default: {
    tmdbApiKey: 'test-api-key',
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useFilterState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({
        genres: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Comedy' },
        ],
        results: [
          { provider_name: 'Netflix', provider_id: 1 },
          { provider_name: 'Hulu', provider_id: 2 },
        ]
      }))
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useFilterState());

    expect(result.current.mediaType).toBe('movie');
    expect(result.current.selectedGenres).toEqual([]);
    expect(result.current.providers).toEqual([]);
    expect(result.current.releaseDate).toBe('any');
    expect(result.current.seriesOnly).toBe(false);
    expect(result.current.minTmdb).toBe(0);
    expect(result.current.minRotten).toBe(0);
    expect(result.current.notStreaming).toBe(false);
  });

  it('loads genres and providers on mount', async () => {
    const { result } = renderHook(() => useFilterState());

    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/genre/movie/list?api_key=test-api-key'
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/genre/tv/list?api_key=test-api-key'
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/watch/providers/movie?api_key=test-api-key&watch_region=US'
    );
    expect(result.current.genreOptions).toEqual(['Action', 'Comedy']);
    expect(result.current.providerOptions).toEqual(['Hulu', 'Netflix']);
  });

  it('handles genre selection and removal', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setSelectedGenres(['Action', 'Comedy']);
    });

    expect(result.current.selectedGenres).toEqual(['Action', 'Comedy']);

    act(() => {
      result.current.removeGenre('Action');
    });

    expect(result.current.selectedGenres).toEqual(['Comedy']);
  });

  it('handles provider selection and removal', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setProviders(['Netflix', 'Hulu']);
    });

    expect(result.current.providers).toEqual(['Netflix', 'Hulu']);

    act(() => {
      result.current.removeProvider('Netflix');
    });

    expect(result.current.providers).toEqual(['Hulu']);
  });

  it('calculates isGeneralSearch correctly', () => {
    const { result } = renderHook(() => useFilterState());

    // Should be general search by default
    expect(result.current.isGeneralSearch).toBe(true);

    // Should not be general search with filters applied
    act(() => {
      result.current.setSelectedGenres(['Action']);
    });

    expect(result.current.isGeneralSearch).toBe(false);

    // Reset and test with providers
    act(() => {
      result.current.setSelectedGenres([]);
      result.current.setProviders(['Netflix']);
    });

    expect(result.current.isGeneralSearch).toBe(false);
  });

  it('returns current filters correctly', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setMediaType('tv');
      result.current.setSelectedGenres(['Drama']);
      result.current.setProviders(['Netflix']);
      result.current.setReleaseDate('past_year');
      result.current.setMinTmdb(7.5);
      result.current.setMinRotten(80);
      result.current.setSeriesOnly(true);
      result.current.setNotStreaming(true);
    });

    const currentFilters = result.current.getCurrentFilters();

    expect(currentFilters).toEqual({
      mediaType: 'tv',
      genres: ['Drama'],
      releaseDate: 'past_year',
      providers: ['Netflix'],
      seriesOnly: true,
      minTmdb: 7.5,
      minRotten: 80,
      notStreaming: true,
      isGeneralSearch: false,
    });
  });

  it('resets all filters correctly', () => {
    const { result } = renderHook(() => useFilterState());

    // Set some filters
    act(() => {
      result.current.setSelectedGenres(['Action']);
      result.current.setProviders(['Netflix']);
      result.current.setMinTmdb(8.0);
    });

    // Reset
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.selectedGenres).toEqual([]);
    expect(result.current.providers).toEqual([]);
    expect(result.current.minTmdb).toBe(0);
    expect(result.current.minRotten).toBe(0);
    expect(result.current.seriesOnly).toBe(false);
    expect(result.current.notStreaming).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFilterState());

    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have fallback options
    expect(result.current.genreOptions).toEqual([
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
      'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
    ]);
    expect(result.current.providerOptions).toEqual(['Netflix', 'Hulu', 'Amazon Prime', 'Disney+']);
  });
});
