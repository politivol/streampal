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
      const seen = JSON.parse(localStorage.getItem('seen') || '[]');
      if (!seen.includes(r.id)) seen.push(r.id);
      localStorage.setItem('seen', JSON.stringify(seen));
      const pinned = (JSON.parse(localStorage.getItem('pinned') || '[]')).filter((id) => id !== r.id);
      localStorage.setItem('pinned', JSON.stringify(pinned));
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
      const pinned = new Set(JSON.parse(localStorage.getItem('pinned') || '[]'));
      if (pinned.has(r.id)) pinned.delete(r.id); else pinned.add(r.id);
      localStorage.setItem('pinned', JSON.stringify(Array.from(pinned)));
    }
  };

  return (
    <div className="panel">
      <div className="row row--actions">
        <h2>Results</h2>
        <button className="btn secondary" type="button" onClick={onRollAgain}>
          Roll Again
        </button>
      </div>
      <ul className="results-list">
        {results.map((r) => (
          <li key={r.id} className="result-card">
            {r.artwork && <img src={r.artwork} alt={r.title} />}
            <div className="result-card__body">
              <h3>{r.title}</h3>
              {r.releaseDate && <p className="release-date">{r.releaseDate}</p>}
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
                <button className="btn link" type="button" onClick={() => onShowSeries(r.series)}>
                  Series
                </button>
              )}
              <div className="actions">
                <button className="btn secondary" type="button" onClick={() => handleSeen(r)}>
                  Seen it!
                </button>
                <button className="btn secondary" type="button" onClick={() => handlePin(r)}>
                  {pinnedIds.has(r.id) ? 'Unpin' : 'Pin'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
