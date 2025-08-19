export default function ResultsList({
  results,
  pinnedIds = new Set(),
  onSeen,
  onPin,
  onRollAgain,
  onShowSeries,
}) {
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
                <button className="btn secondary" type="button" onClick={() => onSeen(r.id)}>
                  Seen it!
                </button>
                <button className="btn secondary" type="button" onClick={() => onPin(r.id)}>
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
