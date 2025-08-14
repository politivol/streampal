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
});
