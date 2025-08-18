import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function SeenList({ session }) {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState('');

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from('seen')
      .select('id,title')
      .eq('user_id', session.user.id)
      .order('id');
    if (!error && data) setMovies(data);
  };

  useEffect(() => {
    fetchMovies();
  }, [session]);

  const addMovie = async (e) => {
    e.preventDefault();
    if (!title) return;
    const { error } = await supabase
      .from('seen')
      .insert({ user_id: session.user.id, title });
    if (!error) {
      setTitle('');
      fetchMovies();
    }
  };

  const removeMovie = async (id) => {
    const { error } = await supabase
      .from('seen')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (!error) fetchMovies();
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
      <form onSubmit={addMovie} className="row row--inputs">
        <input
          type="text"
          placeholder="Movie title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn" type="submit">Add</button>
      </form>
      <ul>
        {movies.map((m) => (
          <li key={m.id} className="row">
            <span>{m.title}</span>
            <button className="btn secondary" type="button" onClick={() => removeMovie(m.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
