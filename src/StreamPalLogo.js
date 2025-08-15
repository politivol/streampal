export const StreamPalLogo = ({ size = 36, textSize, color = "#1E6CFB", label = "StreamPal", className = "", gap = 12 } = {}) => {
  const wordmarkSize = textSize ?? Math.round(size * 0.75);
  const outer = document.createElement('div');
  if (className) outer.className = className;
  outer.setAttribute('aria-label', label);
  outer.style.display = 'inline-flex';
  outer.style.alignItems = 'center';
  outer.style.gap = `${gap}px`;
  if (color) outer.style.color = color;

  const template = document.createElement('template');
  template.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 128 128" role="img" aria-label="${label} icon" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="16" y="24" width="96" height="72" rx="16" ry="16" />
        <path d="M56 16 L64 24 M72 16 L64 24" />
        <path d="M28 104 L36 96 M100 104 L92 96" />
        <path d="M24 64 C 40 48, 56 56, 64 64 C 72 72, 88 80, 104 64" />
      </g>
    </svg>
    <span style="
      font-family: Montserrat, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
      font-weight: 700;
      font-size: ${wordmarkSize}px;
      line-height: 1;
      letter-spacing: 0.5px;
    ">
      Stream<span style="font-weight: 700">Pal</span>
    </span>
  `;
  outer.append(...template.content.childNodes);
  return outer;
};

export default StreamPalLogo;
