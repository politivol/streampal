import React from "react";

const StreamPalLogo = ({
  size = 36,
  textSize,
  color = "#1E6CFB",
  label = "StreamPal",
  className,
  gap = 12,
}) => {
  const wordmarkSize = textSize ?? Math.round(size * 0.75);

  return (
    <div
      className={className}
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", gap, color }}
    >
      {/* Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        role="img"
        aria-label={`${label} icon`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* TV body */}
          <rect x="16" y="24" width="96" height="72" rx="16" ry="16" />
          {/* Antennas */}
          <path d="M56 16 L64 24 M72 16 L64 24" />
          {/* Feet */}
          <path d="M28 104 L36 96 M100 104 L92 96" />
          {/* Stream wave */}
          <path d="M24 64 C 40 48, 56 56, 64 64 C 72 72, 88 80, 104 64" />
        </g>
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontFamily:
            "Montserrat, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
          fontWeight: 700,
          fontSize: wordmarkSize,
          lineHeight: 1,
          letterSpacing: 0.5,
        }}
      >
        Stream<span style={{ fontWeight: 700 }}>Pal</span>
      </span>
    </div>
  );
};

export default StreamPalLogo;
