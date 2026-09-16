/**
 * The small icons that sit inside form controls.
 *
 * Kept together so every field that carries one is drawn at the same weight and
 * size — a set that drifts looks worse than no icons at all.
 */

function Glyph({ children }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const MailIcon = () => (
  <Glyph>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 9 6 9-6" />
  </Glyph>
);

export const LockIcon = () => (
  <Glyph>
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Glyph>
);

export const UserIcon = () => (
  <Glyph>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Glyph>
);

export const KeyIcon = () => (
  <Glyph>
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H21m-3 0v3m-3-3v2" />
  </Glyph>
);
