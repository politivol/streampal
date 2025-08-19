import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import Search from './Search.jsx';
import { toast } from '../lib/toast.js';

export default function SeenList({ session, onClose }) {
  const [seenItems, setSeenItems] = useState([]);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchItems = async () => {
    if (session) {
      const { data, error } = await supabase
        .from('user_items')
        .select('id,payload')
        .eq('user_id', session.user.id)
        .eq('list', 'seen')
        .order('id');
      if (error) {
        toast(error.message, 'danger', 5000, 'exclamation-octagon');
      } else if (data) {
        setSeenItems(data);
      }
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      setSeenItems(seen);
    }
    const pinned = JSON.parse(sessionStorage.getItem('pinned') || '[]');
    setPinnedItems(pinned);
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
      if (error) {
        toast(error.message, 'danger', 5000, 'exclamation-octagon');
      } else {
        toast('Added to seen list', 'success', 3000, 'check-circle');
        fetchItems();
      }
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      seen.push({ id: movie.imdbID, payload: { title: movie.Title } });
      sessionStorage.setItem('seen', JSON.stringify(seen));
      setSeenItems(seen);
      toast('Added to seen list', 'success', 3000, 'check-circle');
    }
  };

  const removeItem = async (id, list) => {
    if (session && list === 'seen') {
      const { error } = await supabase
        .from('user_items')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)
        .eq('list', 'seen');
      if (error) {
        toast(error.message, 'danger', 5000, 'exclamation-octagon');
      } else {
        fetchItems();
        toast('Removed item', 'success', 3000, 'check-circle');
      }
    } else {
      const key = list === 'seen' ? 'seen' : 'pinned';
      const items = JSON.parse(sessionStorage.getItem(key) || '[]').filter((m) => m.id !== id);
      sessionStorage.setItem(key, JSON.stringify(items));
      if (key === 'seen') setSeenItems(items); else setPinnedItems(items);
      toast('Removed item', 'success', 3000, 'check-circle');
    }
  };

  return (
    <div className={`panel side-panel ${open ? 'open' : ''}`}>
      <div className="row row--actions">
        <h2>Your Lists</h2>
        <div className="row">
          <sl-button variant="neutral" type="button" onClick={onClose}>
            Close
          </sl-button>
        </div>
      </div>
      <Search onSelect={addItem} />
      <h3>Seen Movies</h3>
      <ul>
        {seenItems.map((m) => (
          <li key={m.id} className="row">
            <span>{m.payload?.title}</span>
            <sl-button variant="neutral" type="button" onClick={() => removeItem(m.id, 'seen')}>
              Remove
            </sl-button>
          </li>
        ))}
      </ul>
      <h3>Pinned Movies</h3>
      <ul>
        {pinnedItems.map((m) => (
          <li key={m.id} className="row">
            <span>{m.payload?.title}</span>
            <sl-button variant="neutral" type="button" onClick={() => removeItem(m.id, 'pinned')}>
              Unpin
            </sl-button>
          </li>
        ))}
      </ul>
    </div>
  );
}
