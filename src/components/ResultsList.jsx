import { supabase } from '../lib/supabaseClient.js';

export default function ResultsList({
  results,
  title = 'Results',
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
    } else {
      const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
      if (!seen.find((i) => i.id === r.id)) seen.push({ id: r.id, payload: { title: r.title } });
      sessionStorage.setItem('seen', JSON.stringify(seen));
    }
    const pinned = (JSON.parse(sessionStorage.getItem('pinned') || '[]')).filter((i) => i.id !== r.id);
    sessionStorage.setItem('pinned', JSON.stringify(pinned));
  };

  const handlePin = async (r) => {
    onPin?.(r.id);
    const pinned = JSON.parse(sessionStorage.getItem('pinned') || '[]');
    const idx = pinned.findIndex((i) => i.id === r.id);
    if (idx >= 0) pinned.splice(idx, 1);
    else pinned.push({ id: r.id, payload: { title: r.title } });
    sessionStorage.setItem('pinned', JSON.stringify(pinned));
  };

  const slugify = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="panel">
      <div className="row row--actions">
        <h2>{title}</h2>
        <sl-button variant="neutral" type="button" onClick={onRollAgain}>
          Roll Again
        </sl-button>
      </div>
      <ul className="results-list">
        {results.map((r) => (
          <li key={r.id}>
            <sl-card class="movie-card">
              {r.artwork && <img slot="image" src={r.artwork} alt={r.title} />}
              <div className="card-body">
                <h3 className="title-box">{r.title}</h3>
                <div className="details">
                  {r.releaseDate && (
                    <span className="tag tag--release">Release: {r.releaseDate}</span>
                  )}
                  {r.runtime && (
                    <span className="tag tag--runtime">Length: {r.runtime}m</span>
                  )}
                </div>
                {r.streaming ? (
                  <div className="streaming">
                    {r.streaming.map((s) => (
                      <span key={s} className={`badge service-${slugify(s)}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="streaming" style={{ visibility: 'hidden' }}>
                    <span className="badge">placeholder</span>
                  </div>
                )}
                {r.genres && (
                  <div className="genres">
                    {r.genres.map((g) => (
                      <span key={g} className="badge">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <div className="ratings">
                  {r.ratings.tmdb != null ? (
                    <span className="badge rating rating--tmdb">
                      TMDB: {r.ratings.tmdb.toFixed ? r.ratings.tmdb.toFixed(1) : r.ratings.tmdb}
                    </span>
                  ) : (
                    <div className="badge rating rating--tmdb" style={{ visibility: 'hidden' }}>
                      TMDB
                    </div>
                  )}
                  {r.ratings.rottenTomatoes != null ? (
                    <span className="badge rating rating--rotten">
                      RT: {r.ratings.rottenTomatoes}%
                    </span>
                  ) : (
                    <div className="badge rating rating--rotten" style={{ visibility: 'hidden' }}>
                      RT
                    </div>
                  )}
                </div>
                {r.series ? (
                  <sl-button
                    variant="neutral"
                    type="button"
                    data-action="details"
                    onClick={() => onShowSeries(r.series)}
                  >
                    Series
                  </sl-button>
                ) : (
                  <div style={{ visibility: 'hidden' }}>
                    <sl-button variant="neutral" type="button">Series</sl-button>
                  </div>
                )}
              </div>
              <div slot="footer" className="actions">
                <sl-button
                  variant="neutral"
                  type="button"
                  data-action="seen"
                  onClick={() => handleSeen(r)}
                >
                  Seen it!
                </sl-button>
                <sl-button
                  variant="neutral"
                  type="button"
                  data-action="pin"
                  onClick={() => handlePin(r)}
                >
                  {pinnedIds.has(r.id) ? 'Unpin' : 'Pin'}
                </sl-button>
              </div>
            </sl-card>
          </li>
        ))}
      </ul>
    </div>
  );
}
