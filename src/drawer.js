import { $ } from './dom.js';

let activeDrawer = null;

export function setupDrawer(drawerId, btnId, onOpen) {
  const drawer = $(drawerId);
  const btn = $(btnId);
  let focusables = [];

  function trap(e) {
    if (e.key === 'Escape') return close();
    if (e.key === 'Tab' && focusables.length) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open() {
    if (activeDrawer && activeDrawer !== api) activeDrawer.close();
    drawer.classList.add('drawer--open');
    btn.setAttribute('aria-expanded', 'true');
    onOpen && onOpen();
    focusables = [...drawer.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')];
    if (focusables[0]) focusables[0].focus();
    document.addEventListener('keydown', trap);
    activeDrawer = api;
  }

  function close() {
    drawer.classList.remove('drawer--open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trap);
    btn.focus();
    if (activeDrawer === api) activeDrawer = null;
  }

  btn.addEventListener('click', () => {
    drawer.classList.contains('drawer--open') ? close() : open();
  });

  const api = { open, close };
  return api;
}
