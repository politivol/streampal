import { $, el } from './dom.js';
import { setupDrawer } from './drawer.js';
import { fetchJSON } from './fetchJSON.js';
import { card } from './card.js';
import { providerSlug } from './providerSlug.js';

/*** 🔧 CONFIG — add your keys ***/
const TMDB_KEY = "f653b3ff00c4561dfaebe995836a28e7";
const OMDB_KEY = "84da1316"; // free 1k/day; upgrade if needed

const state = {
  type: "movie",
  genres: [],
  genreMap: { movie: {}, tv: {} },
  providersUS: [], // [{slug, provider_id, label}]
  chosenProviders: new Set(),
  lastBatch: [],
  pageCursor: 1,
  seen: new Set(
    (JSON.parse(localStorage.getItem("seenIds")||"[]"))
      .map(x => typeof x === "string" ? x.replace(":", "-") : x)
  ),
  kept: new Set(JSON.parse(localStorage.getItem("keptIds")||"[]"))
};

function toast(msg){ $("#status").textContent = msg; setTimeout(()=>$("#status").textContent="", 4500); }
function toggleChip(chip){
  const v = chip.dataset.value;
  chip.classList.toggle("active");
  if(chip.parentElement.id === "genreChips"){
    chip.classList.contains("active") ? state.genres.push(v) : state.genres = state.genres.filter(x=>x!==v);
  } else if (chip.parentElement.id === "providerChips"){
    chip.classList.contains("active") ? state.chosenProviders.add(v) : state.chosenProviders.delete(v);
  } else if (chip.parentElement.id === "typeChips"){
    [...chip.parentElement.children].forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    state.type = v;
    buildGenres(); // reload genre chips for this type
  }
}

function saveSeen(){ localStorage.setItem("seenIds", JSON.stringify([...state.seen])); }
function saveKept(){ localStorage.setItem("keptIds", JSON.stringify([...state.kept])); }

let filterDrawerCtrl;
let seenDrawerCtrl;

async function renderSeenList(){
  const grid = $("#seenGrid");
  grid.innerHTML = "";
  const ids = [...state.seen];
  for(const key of ids){
    const [typ,id] = key.split(/[-:]/);
    try{
      const t = await fetchJSON(`https://api.themoviedb.org/3/${typ}/${id}?api_key=${TMDB_KEY}&language=en-US`);
      t.genre_ids = (t.genres||[]).map(g=>g.id);
      const prev = state.type; state.type = typ;
      const c = card(t, state, { saveSeen, saveKept });
      state.type = prev;
      const footer = c.querySelector('.footer');
      const details = footer.querySelector('a');
      footer.innerHTML='';
      const rem = el('button',{className:'btn secondary',textContent:'Remove'});
      rem.addEventListener('click',()=>{
        state.seen.delete(key); saveSeen(); c.remove();
      });
      footer.append(rem, details);
      grid.appendChild(c);
    }catch(e){}
  }
}

export async function initFilters(){
  document.addEventListener("click",(e)=>{
    if(e.target.classList.contains("chip")) toggleChip(e.target);
  });

  filterDrawerCtrl = setupDrawer("#filterDrawer", "#filtersBtn");

  $("#shuffleBtn").addEventListener("click", ()=> {
    filterDrawerCtrl.close();
    discover(true);
  });
  $("#findBtn").addEventListener("click", ()=> {
    filterDrawerCtrl.close();
    state.pageCursor = 1;
    discover(false);
  });

  await Promise.all([loadGenres(), loadProvidersUS()]);
}

export function initSeenList(){
  seenDrawerCtrl = setupDrawer("#seenDrawer", "#seenBtn", renderSeenList);
  $("#resetListsBtn").addEventListener("click",()=>{
    state.seen.clear();
    state.kept.clear();
    localStorage.removeItem("seenIds");
    localStorage.removeItem("keptIds");
    $("#seenGrid").innerHTML="";
    $("#results").innerHTML="";
  });
}

export function initSearch(){
  const input = $("#searchInput");
  const go = () => {
    const q = input.value.trim();
    if(!q) return;
    searchTitles(q);
  };
  input.addEventListener("keydown", e => { if(e.key === "Enter") go(); });
}

async function loadGenres(){
  const [movieG, tvG] = await Promise.all([
    fetchJSON(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_KEY}&language=en-US`),
    fetchJSON(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_KEY}&language=en-US`)
  ]);
  state.genreMap.movie = Object.fromEntries(movieG.genres.map(g=>[String(g.id), g.name]));
  state.genreMap.tv    = Object.fromEntries(tvG.genres.map(g=>[String(g.id), g.name]));
  buildGenres();
}

function buildGenres(){
  const box = $("#genreChips"); box.innerHTML="";
  const map = state.genreMap[state.type];
  Object.entries(map).forEach(([id,name])=>{
    const c = el("div",{className:"chip", textContent:name}); c.dataset.value=id; box.appendChild(c);
  });
  state.genres = []; // reset when switching type
}

async function loadProvidersUS(){
  const [pMovies, pTv] = await Promise.all([
    fetchJSON(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_KEY}&watch_region=US`),
    fetchJSON(`https://api.themoviedb.org/3/watch/providers/tv?api_key=${TMDB_KEY}&watch_region=US`)
  ]);

  const labels = {
    netflix: 'Netflix',
    prime: 'Prime Video',
    disney: 'Disney+',
    hulu: 'Hulu',
    max: 'Max',
    appletv: 'Apple TV+',
    paramount: 'Paramount+',
    peacock: 'Peacock',
    starz: 'STARZ',
    showtime: 'Showtime',
    amc: 'AMC+',
    criterion: 'Criterion Channel',
    freevee: 'Freevee',
    tubi: 'Tubi',
    pluto: 'Pluto TV',
  };

  const seen = new Map();
  [...pMovies.results, ...pTv.results].forEach(p => {
    const slug = providerSlug(p.provider_name);
    if (!labels[slug]) return;
    if (!seen.has(slug)) {
      seen.set(slug, { slug, provider_id: p.provider_id, label: labels[slug] });
    }
  });

  state.providersUS = [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  buildProviders();
}

function buildProviders(){
  const box = $("#providerChips"); box.innerHTML="";
  state.chosenProviders.clear();
  state.providersUS.forEach(({provider_id, label})=>{
    const c = el("div",{className:"chip",textContent:label}); c.dataset.value=String(provider_id); box.appendChild(c);
  });
}

function buildDiscoverURL(page=1){
  const base = `https://api.themoviedb.org/3/discover/${state.type}?api_key=${TMDB_KEY}&language=en-US&include_adult=false&page=${page}`;
  const params = new URLSearchParams();
  if(state.chosenProviders.size){
    params.set("with_watch_providers", [...state.chosenProviders].join("|"));
    params.set("watch_region","US");
    params.set("with_watch_monetization_types","flatrate|ads|free");
  }
  if(state.genres.length){
    params.set("with_genres", state.genres.join(","));
  }
  const window = $("#releaseWindow").value;
  if(window){
    const now = new Date();
    if(window === "new"){
      params.set("primary_release_date.gte", `${now.getFullYear()-2}-01-01`);
    } else if(window === "recent"){
      params.set("primary_release_date.gte", "2015-01-01");
      params.set("primary_release_date.lte", "2021-12-31");
    } else if(window === "classic"){
      params.set("primary_release_date.lte", "2014-12-31");
    }
  }
  const mood = $("#mood").value;
  if(mood) params.set("with_keywords", mood);
  return `${base}&${params.toString()}`;
}

async function enrichWithRatings(items){
  const out = [];
  const needOmdb = items.slice(0,12);
  const ids = needOmdb.map(it=>it.id);
  const omdbMap = {};
  for(const it of needOmdb){
    try{
      const imdbIdRes = await fetchJSON(`https://api.themoviedb.org/3/${state.type}/${it.id}?api_key=${TMDB_KEY}`);
      const imdb = imdbIdRes.imdb_id;
      if(imdb){
        const om = await fetchJSON(`https://www.omdbapi.com/?i=${imdb}&apikey=${OMDB_KEY}`);
        if(om.imdbRating && om.imdbRating !== 'N/A') it.imdbRating = om.imdbRating;
        if(om.Ratings){
          const rt = om.Ratings.find(r=>r.Source === 'Rotten Tomatoes');
          if(rt) it.rtRating = rt.Value;
        }
      }
      out.push(it);
    }catch(e){
      out.push(it);
    }
  }
  return out.concat(items.slice(12));
}

async function attachProviders(items){
  for(const it of items){
    try{
      const pv = await fetchJSON(`https://api.themoviedb.org/3/${state.type}/${it.id}/watch/providers?api_key=${TMDB_KEY}`);
      const us = pv.results?.US;
      const names = new Set();
      ["flatrate","ads","free"].forEach(k => (us?.[k]||[]).forEach(p=>names.add(p.provider_name)));
      it._providers = [...names].slice(0,3);
    }catch(e){}
  }
  return items;
}

async function searchTitles(query){
  try{
    const grid = $("#results");
    const keptEls = [...grid.querySelectorAll('.card.kept')];
    const keptIdsOnPage = keptEls.map(el=>el.dataset.id);
    grid.innerHTML = "";
    keptEls.forEach(el=>grid.appendChild(el));
    toast("Searching…");
    const url = `https://api.themoviedb.org/3/search/${state.type}?api_key=${TMDB_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(query)}`;
    const data = await fetchJSON(url);
    let picks = (data.results || []).filter(p=>!state.seen.has(`${state.type}-${p.id}`) && !keptIdsOnPage.includes(String(p.id)));
    picks = await enrichWithRatings(picks);
    picks = await attachProviders(picks);
    if(!picks.length){ toast("No results found"); return; }
    picks.slice(0,8).forEach(p => grid.appendChild(card(p, state, { saveSeen, saveKept })));
    toast(`Found ${picks.length} results`);
  }catch(e){
    toast("Search failed");
    console.error(e);
  }
}

export async function discover(nextPage=false){
  try{
    const grid = $("#results");
    const keptEls = [...grid.querySelectorAll(".card.kept")];
    const keptIdsOnPage = keptEls.map(el=>el.dataset.id);
    grid.innerHTML = "";
    keptEls.forEach(el=>grid.appendChild(el));
    toast(nextPage?"Shuffling…":"Finding options…");
    const url = buildDiscoverURL(nextPage ? ++state.pageCursor : (state.pageCursor=1));
    const data = await fetchJSON(url);
    let picks = (data.results || []).filter(p=>!state.seen.has(`${state.type}-${p.id}`) && !keptIdsOnPage.includes(String(p.id)));
    picks = await enrichWithRatings(picks);
    const min = parseFloat($("#minImdb").value);
    picks = picks.filter(p=>{
      const imdb = p.imdbRating ? parseFloat(p.imdbRating) : null;
      const tmdb = p.vote_average || 0;
      return (imdb && imdb >= min) || (!imdb && tmdb >= (min+0.5));
    });
    picks = await attachProviders(picks);
    state.lastBatch = picks;
    if(!picks.length){ toast("No matches—try lowering the rating or adding providers."); return; }
    picks.slice(0,8).forEach(p => grid.appendChild(card(p, state, { saveSeen, saveKept })));
    toast(`Showing ${Math.min(8,picks.length)} of ${picks.length} matches`);
  }catch(e){
    toast("Oops—API error. Check keys and try again.");
    console.error(e);
  }
}

export async function init(){
  await initFilters();
  initSeenList();
  initSearch();
}

export default { init, initFilters, initSeenList, initSearch, discover };
