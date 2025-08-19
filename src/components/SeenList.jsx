import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import Search from './Search.jsx';

export default function SeenList({ session, onSession }) {
  const [seenItems, setSeenItems] = useState([]);
  const [pinnedItems, setPinnedItems] = useState([]);

  const fetchItems = async () => {
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
  };

  useEffect(() => {
    fetchItems();
  }, [session]);

  const addItem = async (movie) => {
    if (!movie) return;
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
  };

  const removeItem = async (id, list) => {
    const { error } = await supabase
      .from('user_items')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
      .eq('list', list);
    if (!error) fetchItems();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    onSession?.(null);
  };

  return (
    <div className="panel">
      <div className="row row--actions">
        <h2>Your Lists</h2>
        <button className="btn secondary" type="button" onClick={signOut}>Sign Out</button>
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
