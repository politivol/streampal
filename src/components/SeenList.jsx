import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import Search from './Search.jsx';

export default function SeenList({ session, onSession }) {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('user_items')
      .select('id,payload')
      .eq('user_id', session.user.id)
      .eq('list', 'seen')
      .order('id');
    if (!error && data) setItems(data);
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

  const removeItem = async (id) => {
    const { error } = await supabase
      .from('user_items')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
      .eq('list', 'seen');
    if (!error) fetchItems();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    onSession?.(null);
  };

  return (
    <div className="panel">
      <div className="row row--actions">
        <h2>Seen Movies</h2>
        <button className="btn secondary" type="button" onClick={signOut}>Sign Out</button>
      </div>
      <Search onSelect={addItem} />
      <ul>
        {items.map((m) => (
          <li key={m.id} className="row">
            <span>{m.payload?.title}</span>
            <button className="btn secondary" type="button" onClick={() => removeItem(m.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
