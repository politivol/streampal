import { supabase } from './lib/supabaseClient.js';

const btn = document.querySelector('.nav-toggle');
const nav = document.getElementById('mobile-nav');
const filterBtn = document.getElementById('filter-btn');
const loginBtn = document.getElementById('login-btn');
const accountBtn = document.getElementById('account-btn');
const logoutBtn = document.getElementById('logout-btn');

const closeMenu = () => btn?.setAttribute('aria-expanded', 'false');

if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
  });
}

filterBtn?.addEventListener('click', () => {
  window.dispatchEvent(new Event('open-filters'));
  closeMenu();
});

loginBtn?.addEventListener('click', () => {
  window.dispatchEvent(new Event('open-login'));
  closeMenu();
});

accountBtn?.addEventListener('click', () => {
  window.dispatchEvent(new Event('open-account'));
  closeMenu();
});

logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  closeMenu();
});

const toggleAuthButtons = (session) => {
  if (session) {
    loginBtn?.setAttribute('hidden', '');
    accountBtn?.removeAttribute('hidden');
    logoutBtn?.removeAttribute('hidden');
  } else {
    loginBtn?.removeAttribute('hidden');
    accountBtn?.setAttribute('hidden', '');
    logoutBtn?.setAttribute('hidden', '');
  }
};

supabase.auth.getSession().then(({ data: { session } }) => toggleAuthButtons(session));
supabase.auth.onAuthStateChange((_event, session) => toggleAuthButtons(session));
