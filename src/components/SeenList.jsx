import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import Search from './Search.jsx';

export default function SeenList({ session, onSession, onClose }) {
  const [seenItems, setSeenItems] = useState([]);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchItems = async () => {
    if (session) {
      const { data, error } = await supabase
        .from('user_items')
        .select('id,list,payload')
        .eq('user_id', session.user.id)
        .in('list', ['seen', 'pinned'])
        .order('id');
      if (!error && data) {
        setSeenItems(data.filter((i) => i.list === 'seen'));
        setPinnedItems(data.filter((i) => i.list === 'pinned'));
      }
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      const pinned = JSON.parse(sessionStorage.getItem('pinned') || '[]');
      setSeenItems(seen);
      setPinnedItems(pinned);
    }
  };

  useEffect(() => {
    fetchItems();
    setOpen(true);
  }, [session]);

  const addItem = async (movie) => {
    if (!movie) return;
    if (session) {
      const { error } = await supabase
        .from('user_items')
        .insert({
          user_id: session.user.id,
          tmdb_id: movie.imdbID,
          item_type: 'movie',
          list: 'seen',
          payload: { title: movie.Title },
        });
      if (!error) fetchItems();
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      seen.push({ id: movie.imdbID, payload: { title: movie.Title } });
      sessionStorage.setItem('seen', JSON.stringify(seen));
      setSeenItems(seen);
    }
  };

  const removeItem = async (id, list) => {
    if (session) {
      const { error } = await supabase
        .from('user_items')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)
        .eq('list', list);
      if (!error) fetchItems();
    } else {
      const key = list === 'seen' ? 'seen' : 'pinned';
      const items = JSON.parse(sessionStorage.getItem(key) || '[]').filter((m) => m.id !== id);
      sessionStorage.setItem(key, JSON.stringify(items));
      if (key === 'seen') setSeenItems(items); else setPinnedItems(items);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    onSession?.(null);
  };

  return (
    <div className={`panel side-panel ${open ? 'open' : ''}`}>
      <div className="row row--actions">
        <h2>Your Lists</h2>
        <div className="row">
          {session && (
            <button className="btn secondary" type="button" onClick={signOut}>
              Sign Out
            </button>
          )}
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <Search onSelect={addItem} />
      <h3>Seen Movies</h3>
      <ul>
        {seenItems.map((m) => (
          <li key={m.id} className="row">
            <span>{m.payload?.title}</span>
            <button className="btn secondary" type="button" onClick={() => removeItem(m.id, 'seen')}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <h3>Pinned Movies</h3>
      <ul>
        {pinnedItems.map((m) => (
          <li key={m.id} className="row">
            <span>{m.payload?.title}</span>
            <button className="btn secondary" type="button" onClick={() => removeItem(m.id, 'pinned')}>
              Unpin
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
