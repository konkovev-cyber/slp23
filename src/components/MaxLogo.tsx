const MaxLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 640" className={`max-logo ${className ?? ""}`} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="max-bg-grad" x1="0%" y1="90%" x2="100%" y2="10%">
        <stop offset="0%" stopColor="#37B5F0" />
        <stop offset="45%" stopColor="#3D6BF3" />
        <stop offset="100%" stopColor="#8B4BF0" />
      </linearGradient>
      <linearGradient id="max-bubble-grad" x1="30%" y1="30%" x2="80%" y2="80%">
        <stop offset="0%" stopColor="#4A6EF5" />
        <stop offset="100%" stopColor="#6A3FE8" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="608" height="608" rx="144" fill="url(#max-bg-grad)" />
    <path
      fill="#FFFFFF"
      d="M320 92 C 198 92 112 182 112 296 c 0 64 30 120 76 158 c -4 34 -16 84 -36 122 c -2 5 3 10 8 8 c 52 -14 108 -30 146 -36 c 14 3 29 5 45 5 c 122 0 202 -90 202 -202 C 553 182 442 92 320 92 Z"
    />
    <circle cx="330" cy="312" r="118" fill="url(#max-bubble-grad)" />
    <text
      x="330"
      y="318"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="Manrope, Arial, sans-serif"
      fontWeight="800"
      fontSize="86"
      letterSpacing="2"
      fill="#FFFFFF"
    >
      max
    </text>
  </svg>
);

/** Монохромная версия логотипа для ч/б рядов соцкнопок (как VK/IG):
 * тот же силуэт пузыря MAX, залит currentColor, круг выбит evenodd-ом. */
export const MaxLogoMono = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 640" className={className} fill="currentColor" aria-hidden="true" focusable="false">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M320 92 C 198 92 112 182 112 296 c 0 64 30 120 76 158 c -4 34 -16 84 -36 122 c -2 5 3 10 8 8 c 52 -14 108 -30 146 -36 c 14 3 29 5 45 5 c 122 0 202 -90 202 -202 C 553 182 442 92 320 92 Z M 448 312 A 118 118 0 1 1 212 312 A 118 118 0 1 1 448 312 Z"
    />
  </svg>
);

export default MaxLogo;
