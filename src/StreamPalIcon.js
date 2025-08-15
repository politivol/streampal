export const StreamPalIcon = ({ size = 32, color = "#1E6CFB" } = {}) => {
  const template = document.createElement('template');
  template.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 128 128" role="img" aria-label="StreamPal icon">
      <g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="16" y="24" width="96" height="72" rx="16" ry="16" />
        <path d="M56 16 L64 24 M72 16 L64 24" />
        <path d="M28 104 L36 96 M100 104 L92 96" />
        <path d="M24 64 C 40 48, 56 56, 64 64 C 72 72, 88 80, 104 64" />
      </g>
    </svg>`;
  const svg = template.content.firstElementChild;
  if (color) svg.style.color = color;
  return svg;
};
