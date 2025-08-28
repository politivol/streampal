import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../hooks/useAppState.js';

// Mock the API functions
vi.mock('../lib/api.js', () => ({
  fetchTrending: vi.fn(),
  fetchDetails: vi.fn(),
  searchTitles: vi.fn(),
  discoverTitles: vi.fn(),
}));

// Mock Supabase
vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    })),
  },
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Import mocked modules
import { fetchTrending, fetchDetails, searchTitles, discoverTitles } from '../lib/api.js';
import { supabase } from '../lib/supabaseClient.js';

const mockFetchTrending = vi.mocked(fetchTrending);
const mockFetchDetails = vi.mocked(fetchDetails);
const mockSearchTitles = vi.mocked(searchTitles);
const mockDiscoverTitles = vi.mocked(discoverTitles);
const mockSupabase = vi.mocked(supabase);

describe('useAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue('[]');
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
    
    // Set up default mock implementations
    mockFetchTrending.mockResolvedValue([
      { id: 1, title: 'Movie 1', artwork: null, mediaType: 'movie' },
      { id: 2, title: 'Movie 2', artwork: null, mediaType: 'movie' }
    ]);
    mockFetchDetails.mockResolvedValue({
      id: 1,
      title: 'Movie 1',
      artwork: null,
      mediaType: 'movie',
      genres: [],
      releaseDate: '2023-01-01',
      streaming: [],
      ratings: { tmdb: 7.5, rottenTomatoes: 80 }
    });
    mockSearchTitles.mockResolvedValue([
      { id: 1, title: 'Search Result', artwork: null, mediaType: 'movie' }
    ]);
    mockDiscoverTitles.mockResolvedValue([
      { id: 1, title: 'Filtered Result', artwork: null, mediaType: 'movie' }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', async () => {
    // Override mocks to return empty results for initial state test
    mockFetchTrending.mockResolvedValue([]);
    mockFetchDetails.mockResolvedValue(null);
    
    const { result } = renderHook(() => useAppState());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.session).toBeNull();
    expect(result.current.showFilters).toBe(false);
    expect(result.current.showSeen).toBe(false);
    expect(result.current.showAuth).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.resultsTitle).toBe('Trending');
  });

  it('loads seen items from sessionStorage when no session', async () => {
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify([
      { id: 1, title: 'Movie 1' },
      { id: 2, title: 'Movie 2' }
    ]));

    const { result } = renderHook(() => useAppState());

    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.seenIds).toEqual(new Set([1, 2]));
  });

  it('loads seen items from Supabase when session exists', async () => {
    const mockSession = { user: { id: 'user-123' } };
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{ tmdb_id: 1 }, { tmdb_id: 2 }]
          }))
        }))
      }))
    });

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.seenIds).toEqual(new Set([1, 2]));
  });

  it('handles search functionality', async () => {
    // Override mocks for this specific test
    mockFetchTrending.mockResolvedValue([]);
    mockFetchDetails.mockResolvedValue(null);
    mockSearchTitles.mockResolvedValue([
      { id: 1, title: 'Search Result 1', artwork: 'poster1.jpg', mediaType: 'movie' }
    ]);
    mockFetchDetails.mockResolvedValue({
      id: 1,
      title: 'Search Result 1',
      artwork: 'poster1.jpg',
      releaseDate: '2023-01-01',
      genres: ['Action'],
      ratings: { tmdb: 8.5, rottenTomatoes: 85 },
      streaming: ['Netflix'],
      series: null,
      mediaType: 'movie'
    });

    const { result } = renderHook(() => useAppState());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.handleSearch('test query');
    });

    expect(mockSearchTitles).toHaveBeenCalledWith('test query', 'movie');
    expect(result.current.results).toHaveLength(1);
    expect(result.current.resultsTitle).toBe('Search results for "test query"');
  });

  it('handles filter application', async () => {
    mockDiscoverTitles.mockResolvedValue([
      { id: 1, title: 'Filtered Movie', artwork: 'poster.jpg', mediaType: 'movie' }
    ]);
    mockFetchDetails.mockResolvedValue({
      id: 1,
      title: 'Filtered Movie',
      artwork: 'poster.jpg',
      releaseDate: '2023-01-01',
      genres: ['Action'],
      ratings: { tmdb: 8.5, rottenTomatoes: 85 },
      streaming: ['Netflix'],
      series: null,
      mediaType: 'movie'
    });

    const { result } = renderHook(() => useAppState());

    const testFilters = {
      mediaType: 'movie',
      genres: ['Action'],
      providers: ['Netflix'],
      minTmdb: 7.0,
      isGeneralSearch: false
    };

    await act(async () => {
      await result.current.applyFilters(testFilters);
    });

    expect(mockDiscoverTitles).toHaveBeenCalledWith(testFilters);
    expect(result.current.showFilters).toBe(false);
  });

  it('handles seen item marking', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleSeen(123);
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.seenIds.has(123)).toBe(true);
    expect(result.current.pinnedIds.has(123)).toBe(false);
  });

  it('handles pin toggling', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.togglePin(456);
    });

    expect(result.current.pinnedIds.has(456)).toBe(true);

    act(() => {
      result.current.togglePin(456);
    });

    expect(result.current.pinnedIds.has(456)).toBe(false);
  });

  it('handles logout', async () => {
    const mockSession = { user: { id: 'user-123' } };
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
    mockSupabase.auth.signOut.mockResolvedValue();

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });
});
