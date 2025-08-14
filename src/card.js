import { el } from './dom.js';
import { providerSlug } from './providerSlug.js';

export function card(t, state, { saveSeen, saveKept }) {
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

  const wrap = el('div', { className: 'card' });
  wrap.dataset.id = String(t.id);
  if (state.kept.has(String(t.id))) wrap.classList.add('kept');
  wrap.innerHTML = `
    <img class="poster" alt="" src="${poster}">
    <div class="meta">
      <div class="title">${title} ${year ? `<span class="sublabel">(${year})</span>` : ''}</div>
      <div class="sublabel">${t.overview?.slice(0, 180) ?? ''}${(t.overview || '').length > 180 ? '…' : ''}</div>
      <div class="badges">
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
