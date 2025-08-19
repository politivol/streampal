export function toast(message, variant = 'primary', duration = 3000, icon) {
  const container = document.getElementById('toasts');
  if (!container) return;

  const alert = document.createElement('sl-alert');
  alert.variant = variant;
  alert.closable = true;
  alert.duration = duration;

  if (icon) {
    const iconEl = document.createElement('sl-icon');
    iconEl.setAttribute('slot', 'icon');
    iconEl.setAttribute('name', icon);
    alert.append(iconEl);
  }
  alert.append(message);

  container.append(alert);
  alert.toast();
  return alert;
}
