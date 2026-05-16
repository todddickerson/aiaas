// "A" monogram for AIaaS — apex + crossbar, with an accent dot in the counter
// to echo the ".com" in the wordmark.

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      role="img"
    >
      <rect width="32" height="32" rx="6" fill="var(--text)" />
      <path
        d="M8 23 L15 8 L17 8 L24 23"
        stroke="var(--bg)"
        strokeWidth="2.4"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M11.2 17 L20.8 17"
        stroke="var(--bg)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="25.6" cy="23" r="1.8" fill="var(--accent)" />
    </svg>
  );
}
