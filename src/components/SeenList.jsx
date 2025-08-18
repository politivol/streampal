import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function SeenList({ session }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');

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

  const addItem = async (e) => {
    e.preventDefault();
    if (!title) return;
    const { error } = await supabase
      .from('user_items')
      .insert({
        user_id: session.user.id,
        tmdb_id: title,
        item_type: 'movie',
        list: 'seen',
        payload: { title },
      });
    if (!error) {
      setTitle('');
      fetchItems();
    }
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
  };

  return (
    <div className="panel">
      <div className="row row--actions">
        <h2>Seen Movies</h2>
        <button className="btn secondary" type="button" onClick={signOut}>Sign Out</button>
      </div>
      <form onSubmit={addItem} className="row row--inputs">
        <input
          type="text"
          placeholder="Movie title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn" type="submit">Add</button>
      </form>
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
