import { supabase } from '../lib/supabaseClient.js';

export default function ResultsList({
  results,
  session,
  pinnedIds = new Set(),
  onSeen,
  onPin,
  onRollAgain,
  onShowSeries,
}) {
  const handleSeen = async (r) => {
    onSeen?.(r.id);
    if (session) {
      await supabase
        .from('user_items')
        .upsert({
          user_id: session.user.id,
          tmdb_id: r.id,
          item_type: r.mediaType,
          list: 'seen',
          payload: { title: r.title },
        }, { onConflict: 'user_id,tmdb_id,list' });
      await supabase
        .from('user_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('tmdb_id', r.id)
        .eq('list', 'pinned');
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      if (!seen.find((i) => i.id === r.id)) seen.push({ id: r.id, payload: { title: r.title } });
      sessionStorage.setItem('seen', JSON.stringify(seen));
      const pinned = (JSON.parse(sessionStorage.getItem('pinned') || '[]')).filter((i) => i.id !== r.id);
      sessionStorage.setItem('pinned', JSON.stringify(pinned));
    }
  };

  const handlePin = async (r) => {
    onPin?.(r.id);
    const isPinned = pinnedIds.has(r.id);
    if (session) {
      if (isPinned) {
        await supabase
          .from('user_items')
          .delete()
          .eq('user_id', session.user.id)
          .eq('tmdb_id', r.id)
          .eq('list', 'pinned');
      } else {
        await supabase
          .from('user_items')
          .upsert({
            user_id: session.user.id,
            tmdb_id: r.id,
            item_type: r.mediaType,
            list: 'pinned',
            payload: { title: r.title },
          }, { onConflict: 'user_id,tmdb_id,list' });
      }
    } else {
      const pinned = JSON.parse(sessionStorage.getItem('pinned') || '[]');
      const idx = pinned.findIndex((i) => i.id === r.id);
      if (idx >= 0) pinned.splice(idx, 1); else pinned.push({ id: r.id, payload: { title: r.title } });
      sessionStorage.setItem('pinned', JSON.stringify(pinned));
    }
  };

  return (
    <section className="container">
      <div className="row row--actions">
        <h2>Results</h2>
        <button className="btn btn-primary" type="button" onClick={onRollAgain}>
          Roll Again
        </button>
      </div>
      <ul className="grid">
        {results.map((r) => (
          <li key={r.id} className="card">
            {r.artwork && (
              <img
                className="card__media"
                src={r.artwork}
                alt={r.title}
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="card__body">
              <h3 className="card__title">{r.title}</h3>
              {r.releaseDate && <p className="card__meta">{r.releaseDate}</p>}
              {r.genres && (
                <div className="genres">
                  {r.genres.map((g) => (
                    <span key={g} className="badge">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {r.streaming && (
                <div className="streaming">
                  {r.streaming.map((s) => (
                    <span key={s} className="badge badge--provider">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {r.series && (
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => onShowSeries(r.series)}
                >
                  Series
                </button>
              )}
              <div className="button-row">
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => handleSeen(r)}
                >
                  Seen it!
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => handlePin(r)}
                >
                  {pinnedIds.has(r.id) ? 'Unpin' : 'Pin'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
