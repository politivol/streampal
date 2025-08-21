import React, { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import FilterPanel from './FilterPanel.jsx';

// Ensure Shoelace custom elements do not interfere with tests
// by defining a minimal stub for sl-button
class SlButton extends HTMLElement {}
customElements.define('sl-button', SlButton);

// Same for sl-tag and sl-spinner maybe? Wait FilterPanel uses sl-tag and sl-spinner.
// Since our test renders FilterPanel but not interact with sl-tag or sl-spinner, we may need to define them to prevent errors? In jsdom, unknown elements are fine; but to avoid warnings, we may define simple stubs for 'sl-tag' and 'sl-spinner'. However we don't need them if they are not observed? Actually, React will call customElements.get to check? For not defined custom elements, we may just leave; but to be safe, define them.
class SlTag extends HTMLElement {}
customElements.define('sl-tag', SlTag);
class SlSpinner extends HTMLElement {}
customElements.define('sl-spinner', SlSpinner);


describe('FilterPanel search button', () => {
  it('is enabled and triggers onApply when clicked', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onApply = vi.fn();

    let root;
    act(() => {
      root = createRoot(container);
      root.render(<FilterPanel onApply={onApply} />);
    });

    const button = container.querySelector('sl-button[variant="primary"]');
    expect(button).toBeTruthy();
    // Button should not be disabled
    expect(button.hasAttribute('disabled')).toBe(false);

    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onApply).toHaveBeenCalled();
  });
});
