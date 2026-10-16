/**
 * Small "Red Devils" drawings: simple flat red shapes, our own (the club's crest is not used).
 */

const RED = "#DA291C";

/** A pitchfork (trident), pointing up. */
export function Pitchfork({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 110" className={className} aria-hidden="true">
      <g fill="none" stroke={RED} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M9 18 V32 Q9 46 24 46 Q39 46 39 32 V18 M24 6 V106" />
        <polygon points="24,1 31,15 17,15" fill={RED} strokeWidth="2" />
        <polygon points="9,5 15,19 3,19" fill={RED} strokeWidth="2" />
        <polygon points="39,5 45,19 33,19" fill={RED} strokeWidth="2" />
      </g>
    </svg>
  );
}

/** A pair of devil horns. */
export function Horns({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 34" className={className} aria-hidden="true">
      <g fill={RED}>
        <path d="M6 32 C1 18 4 6 16 1 C14 9 17 18 26 24 Z" />
        <path d="M58 32 C63 18 60 6 48 1 C50 9 47 18 38 24 Z" />
      </g>
    </svg>
  );
}

/** A thin line with a small pitchfork in the middle. */
export function PitchforkDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-white/20" />
      <Pitchfork className="h-10 w-auto" />
      <div className="h-px flex-1 bg-white/20" />
    </div>
  );
}
