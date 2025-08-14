import { describe, it, expect } from 'vitest';
import { setupDrawer } from '../src/drawer.js';

describe('setupDrawer', () => {
  it('toggles drawer open and closed', () => {
    document.body.innerHTML = `
      <button id="btn"></button>
      <aside id="drawer" class="drawer"></aside>
    `;
    const ctrl = setupDrawer('#drawer', '#btn');
    const drawer = document.getElementById('drawer');
    const btn = document.getElementById('btn');

    btn.click();
    expect(drawer.classList.contains('drawer--open')).toBe(true);

    btn.click();
    expect(drawer.classList.contains('drawer--open')).toBe(false);

    ctrl.open();
    expect(drawer.classList.contains('drawer--open')).toBe(true);

    ctrl.close();
    expect(drawer.classList.contains('drawer--open')).toBe(false);
  });

  it('does not focus first element on coarse pointers', () => {
    document.body.innerHTML = `
      <button id="btn"></button>
      <aside id="drawer" class="drawer"><input id="in" /></aside>
    `;
    const original = window.matchMedia;
    window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {} });
    const ctrl = setupDrawer('#drawer', '#btn');
    ctrl.open();
    expect(document.activeElement.id).not.toBe('in');
    window.matchMedia = original;
  });

  it('positions drawer below the actual header height', () => {
    document.body.innerHTML = `
      <header id="hdr"></header>
      <button id="btn"></button>
      <aside id="drawer" class="drawer"></aside>
    `;
    const header = document.getElementById('hdr');
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 120 });
    setupDrawer('#drawer', '#btn');
    const drawer = document.getElementById('drawer');
    expect(drawer.style.top).toBe('120px');
  });
});
