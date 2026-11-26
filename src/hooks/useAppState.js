import { useEffect, useRef, useState } from 'react';
import { fetchDetails, searchTitles, discoverTitles } from '../lib/api.js';
import { supabase } from '../lib/supabaseClient.js';

const DETAIL_LIMIT = 12;

function emptyFilters() {
  return {
    mediaType: 'movie',
    genres: [],
    releaseDate: 'any',
    providers: [],
    seriesOnly: false,
    minTmdb: 0,
    minImdb: 0,
    notStreaming: false,
    isGeneralSearch: true,
  };
}

function idKey(id) {
  return String(id);
}

async function readSaved(session) {
  if (session) {
    const { data, error } = await supabase
      .from('user_items')
      .select('tmdb_id, list')
      .eq('user_id', session.user.id);
    if (error) throw new Error(error.message);
    const seen = [];
    const pinned = [];
    for (const row of data || []) {
      const id = idKey(row.tmdb_id);
      if (row.list === 'seen') seen.push(id);
      else if (row.list === 'pinned') pinned.push(id);
    }
    return { seen: new Set(seen), pinned: new Set(pinned) };
  }

  const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
  const pinned = JSON.parse(sessionStorage.getItem('pinned') || '[]');
  return {
    seen: new Set(seen.map((item) => idKey(item.id))),
    pinned: new Set(pinned.map((item) => idKey(item.id))),
  };
}

function isGeneralSearch(filters) {
  if (typeof filters.isGeneralSearch === 'boolean') return filters.isGeneralSearch;
  return (
    !filters.genres?.length &&
    (!filters.releaseDate || filters.releaseDate === 'any') &&
    !filters.providers?.length &&
    !filters.seriesOnly &&
    !filters.minTmdb &&
    !filters.minImdb &&
    !filters.notStreaming
  );
}

export function useAppState() {
  const [session, setSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSeen, setShowSeen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [results, setResults] = useState([]);
  const [pinnedIds, setPinnedIds] = useState(() => new Set());
  const [seenIds, setSeenIds] = useState(() => new Set());
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultsTitle, setResultsTitle] = useState('Trending');
  const requestId = useRef(0);
  const filtersRef = useRef(filters);
  const savedRef = useRef({ seen: new Set(), pinned: new Set() });
  filtersRef.current = filters;

  const loadResults = async (nextFilters, saved, existingRequestId) => {
    const id = existingRequestId ?? ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const general = isGeneralSearch(nextFilters);
      const mediaType = nextFilters.mediaType || 'movie';
      const query = general
        ? { ...nextFilters, mediaType, randomPage: true, isGeneralSearch: true }
        : { ...nextFilters, mediaType, randomPage: Boolean(nextFilters.randomPage), isGeneralSearch: false };
      const data = await discoverTitles(query);
      if (id !== requestId.current) return;

      const hidden = saved || savedRef.current;
      const title = data.length
        ? general
          ? `Random ${mediaType === 'tv' ? 'TV Shows' : 'Movies'}`
          : `Filtered ${mediaType === 'tv' ? 'TV Shows' : 'Movies'}`
        : 'Trending';

      const pool = data
        .filter((item) => !hidden.pinned.has(idKey(item.id)) && !hidden.seen.has(idKey(item.id)))
        .slice(0, DETAIL_LIMIT);
      const detailed = (
        await Promise.all(
          pool.map((item) => fetchDetails(item.id, item.mediaType || mediaType).catch(() => null))
        )
      ).filter(Boolean);
      if (id !== requestId.current) return;

      const applied = detailed.filter((item) => {
        if (general) return true;
        if (nextFilters.genres?.length && !nextFilters.genres.every((genre) => item.genres?.includes(genre))) return false;
        if (nextFilters.releaseDate && nextFilters.releaseDate !== 'any' && item.releaseDate) {
          const diff = new Date().getFullYear() - new Date(item.releaseDate).getFullYear();
          if (nextFilters.releaseDate === 'past_year' && diff > 1) return false;
          if (nextFilters.releaseDate === 'older' && diff <= 1) return false;
        }
        if (
          nextFilters.providers?.length &&
          !nextFilters.notStreaming &&
          !nextFilters.providers.some((provider) => item.streaming?.includes(provider))
        ) {
          return false;
        }
        if (nextFilters.notStreaming && item.streaming?.length) return false;
        if (nextFilters.seriesOnly && !item.series) return false;
        if (nextFilters.minTmdb && (item.ratings?.tmdb ?? 0) < parseFloat(nextFilters.minTmdb)) return false;
        if (nextFilters.minImdb && (item.ratings?.imdb ?? 0) < parseFloat(nextFilters.minImdb)) return false;
        return true;
      });

      setResults((prev) => {
        const pinned = prev.filter((item) => hidden.pinned.has(idKey(item.id)));
        return [...pinned, ...applied];
      });
      setResultsTitle(title);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Could not load titles');
      setResults([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: next } }) => {
      setSession(next);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) setShowAuth(false);
  }, [session]);

  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const saved = await readSaved(session);
        if (cancelled || id !== requestId.current) return;
        savedRef.current = {
          seen: new Set(saved.seen),
          pinned: new Set(saved.pinned),
        };
        setSeenIds(savedRef.current.seen);
        setPinnedIds(savedRef.current.pinned);
        await loadResults(filtersRef.current, savedRef.current, id);
      } catch (err) {
        if (cancelled || id !== requestId.current) return;
        setError(err.message || 'Could not load your lists');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Reload lists when the signed-in user changes. Filters are read from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const applyFilters = async (nextFilters) => {
    const next = {
      ...emptyFilters(),
      ...nextFilters,
      minTmdb: nextFilters.minTmdb || 0,
      minImdb: nextFilters.minImdb || 0,
    };
    setFilters(next);
    setShowFilters(false);
    await loadResults(next, savedRef.current);
  };

  const resetFilters = async () => {
    const defaults = emptyFilters();
    setFilters(defaults);
    setShowFilters(false);
    await loadResults(defaults, savedRef.current);
  };

  const rollAgain = async () => {
    await loadResults({ ...filtersRef.current, randomPage: true }, savedRef.current);
  };

  const handleSearch = async (query) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const mediaType = filtersRef.current.mediaType || 'movie';
      const data = await searchTitles(query, mediaType);
      if (id !== requestId.current) return;
      const hidden = savedRef.current;
      const pool = data
        .filter((item) => !hidden.seen.has(idKey(item.id)))
        .slice(0, DETAIL_LIMIT);
      const detailed = (
        await Promise.all(
          pool.map((item) => fetchDetails(item.id, item.mediaType || mediaType).catch(() => null))
        )
      ).filter(Boolean);
      if (id !== requestId.current) return;
      setResults(detailed);
      setResultsTitle(`Search results for "${query}"`);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const handleSeen = (id) => {
    const key = idKey(id);
    const pinned = new Set(savedRef.current.pinned);
    pinned.delete(key);
    const seen = new Set(savedRef.current.seen);
    seen.add(key);
    savedRef.current = { seen, pinned };
    setResults((items) => items.filter((item) => idKey(item.id) !== key));
    setPinnedIds(pinned);
    setSeenIds(seen);
  };

  const togglePin = (id) => {
    const key = idKey(id);
    setPinnedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      savedRef.current = { ...savedRef.current, pinned: next };
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    session,
    showFilters,
    showSeen,
    showAuth,
    filters,
    results,
    pinnedIds,
    seenIds,
    series,
    loading,
    error,
    resultsTitle,
    setSession,
    setShowFilters,
    setShowSeen,
    setShowAuth,
    setSeries,
    applyFilters,
    resetFilters,
    rollAgain,
    handleSearch,
    handleSeen,
    togglePin,
    handleLogout,
  };
}
