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
    <div className="panel">
      <div className="row row--actions">
        <h2>Results</h2>
        <sl-button variant="neutral" type="button" onClick={onRollAgain}>
          Roll Again
        </sl-button>
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
                <sl-button variant="text" type="button" onClick={() => onShowSeries(r.series)}>
                  Series
                </sl-button>
              )}
              <div className="actions">
                <sl-button variant="neutral" type="button" onClick={() => handleSeen(r)}>
                  Seen it!
                </sl-button>
                <sl-button variant="neutral" type="button" onClick={() => handlePin(r)}>
                  {pinnedIds.has(r.id) ? 'Unpin' : 'Pin'}
                </sl-button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
