import { el } from './dom.js';
import { providerSlug } from './providerSlug.js';
import { fetchJSON } from './fetchJSON.js';

export function card(t, state, { saveSeen, saveKept, tmdbKey }) {
  const title = t.title || t.name;
  const year = (t.release_date || t.first_air_date || '').slice(0, 4);
  const poster = t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : '';
  const gmap = state.genreMap[state.type];
  const g = (t.genre_ids || []).slice(0, 3).map(id => gmap[String(id)]).filter(Boolean);
  const rt = t.rtRating ? `🍅 ${t.rtRating}` : '';
  const imdb = t.imdbRating ? `IMDb ${t.imdbRating}` : (t.vote_average ? `TMDb ${t.vote_average.toFixed(1)}/10` : '');
  const detailsBtn = el('a', { textContent: 'Details', href: `https://www.themoviedb.org/${state.type}/${t.id}`, target: '_blank', className: 'btn', style: 'text-align:center;text-decoration:none' });
  const seenBtn = el('button', { className: 'btn secondary icon-btn', textContent: '✅', title: "Stream'd it!" });
  const keepBtn = el('button', { className: 'btn secondary icon-btn', textContent: '📌', title: 'Keep it' });

  const provHTML = (t._providers || []).map(p => `<span class="prov-badge ${providerSlug(p)}">${p}</span>`).join('');

  const showSeries = t.belongs_to_collection || (state.type === 'tv' && (t.number_of_seasons || 0) > 1);
  const seriesLabel = state.type === 'movie' ? t.belongs_to_collection?.name : 'Series';

  const wrap = el('div', { className: 'card' });
  wrap.dataset.id = String(t.id);
  if (state.kept.has(String(t.id))) wrap.classList.add('kept');
  wrap.innerHTML = `
    <img class="poster" alt="" src="${poster}">
    <div class="meta">
      <div class="title">${title} ${year ? `<span class="sublabel">(${year})</span>` : ''}</div>
      <div class="sublabel">${t.overview?.slice(0, 180) ?? ''}${(t.overview || '').length > 180 ? '…' : ''}</div>
      <div class="badges">
        ${showSeries ? `<span class="badge series-badge">${seriesLabel}</span>` : ''}
        ${g.map(x => `<span class="badge">${x}</span>`).join('')}
      </div>
      ${provHTML ? `<div class="provline">${provHTML}</div>` : ''}
      <div class="ratings">
        ${imdb ? `<span class="badge">${imdb}</span>` : ''}
        ${rt ? `<span class="badge">${rt}</span>` : ''}
      </div>
    </div>
    <div class="footer"></div>
  `;
  const footer = wrap.querySelector('.footer');
  footer.append(seenBtn, keepBtn, detailsBtn);

  if (showSeries) {
    const badge = wrap.querySelector('.series-badge');
    badge.addEventListener('click', async () => {
      const existing = wrap.querySelector('.series-box');
      if (existing) { existing.remove(); return; }
      const box = el('div', { className: 'series-box', textContent: 'Loading…' });
      wrap.appendChild(box);
      try {
        if (state.type === 'movie') {
          const colId = t.belongs_to_collection?.id;
          const data = await fetchJSON(`https://api.themoviedb.org/3/collection/${colId}?api_key=${tmdbKey}&language=en-US`);
          const items = (data.parts || []).sort((a,b)=> new Date(a.release_date||0) - new Date(b.release_date||0));
          box.innerHTML = items.map(m=>`<div class="series-box-item">${m.title} ${(m.release_date||'').slice(0,4)}</div>`).join('');
        } else {
          const data = await fetchJSON(`https://api.themoviedb.org/3/tv/${t.id}?api_key=${tmdbKey}&language=en-US`);
          const items = (data.seasons || []).filter(s=>s.season_number>0).sort((a,b)=> new Date(a.air_date||0) - new Date(b.air_date||0));
          box.innerHTML = items.map(s=>`<div class="series-box-item">${s.name} ${(s.air_date||'').slice(0,4)}</div>`).join('');
        }
      } catch(e) {
        box.textContent = 'Failed to load series';
      }
    });
  }

  seenBtn.addEventListener('click', () => {
    const id = String(t.id);
    const key = `${state.type}-${id}`;
    state.seen.add(key);
    saveSeen();
    if (state.kept.delete(id)) saveKept();
    wrap.classList.add('seen');
    wrap.remove();
  });

  keepBtn.addEventListener('click', () => {
    const id = String(t.id);
    if (state.kept.has(id)) {
      state.kept.delete(id);
      wrap.classList.remove('kept');
    } else {
      state.kept.add(id);
      wrap.classList.add('kept');
    }
    saveKept();
  });
  return wrap;
}

export default card;
