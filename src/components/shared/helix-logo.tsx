export function HelixLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="12" fill="url(#helixBg)" />
      <path
        d="M12 10c6 4 10 16 16 20"
        stroke="url(#helixStroke)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M28 10c-6 4-10 16-16 20"
        stroke="url(#helixStroke2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10" r="2.2" fill="#3ecfcf" />
      <circle cx="28" cy="10" r="2.2" fill="#1fa8a0" />
      <circle cx="28" cy="30" r="2.2" fill="#3ecfcf" />
      <circle cx="12" cy="30" r="2.2" fill="#e6a23c" />
      <defs>
        <linearGradient id="helixBg" x1="8" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14303a" />
          <stop offset="1" stopColor="#0b1620" />
        </linearGradient>
        <linearGradient id="helixStroke" x1="12" y1="10" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3ecfcf" />
          <stop offset="1" stopColor="#1fa8a0" />
        </linearGradient>
        <linearGradient id="helixStroke2" x1="28" y1="10" x2="12" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7ad4d4" />
          <stop offset="1" stopColor="#e6a23c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
