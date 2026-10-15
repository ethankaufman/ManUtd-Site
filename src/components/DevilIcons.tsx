/**
 * Small "Red Devils" drawings in the same inked style as the intro: black outline, red fill.
 * (Our own simple drawings: the club's crest is not used.)
 */

const INK = "#000000";
const RED = "#DA291C";

/**
 * A pitchfork (trident), pointing up. It is drawn twice, a fat outline underneath and the red on top, so the
 * outline colour can change: black on light backgrounds, white on dark ones.
 */
export function Pitchfork({ className = "", outline = INK }: { className?: string; outline?: string }) {
  const body = "M9 20 V32 Q9 46 24 46 Q39 46 39 32 V20 M24 16 V46 M24 46 V106";
  const tips = ["24,1 33,18 15,18", "9,5 17,22 1,22", "39,5 47,22 31,22"];
  return (
    <svg viewBox="0 0 48 110" className={className} aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round" fill="none">
        <path d={body} stroke={outline} strokeWidth="12" />
        {tips.map((t) => (
          <polygon key={t} points={t} fill={outline} stroke={outline} strokeWidth="6" />
        ))}
        <path d={body} stroke={RED} strokeWidth="6" />
        {tips.map((t) => (
          <polygon key={t} points={t} fill={RED} stroke={RED} strokeWidth="1" />
        ))}
      </g>
    </svg>
  );
}

/** A pair of devil horns. */
export function Horns({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 34" className={className} aria-hidden="true">
      <g fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M6 32 C1 18 4 6 16 1 C14 9 17 18 26 24 Z" />
        <path d="M58 32 C63 18 60 6 48 1 C50 9 47 18 38 24 Z" />
      </g>
    </svg>
  );
}

/** A divider line with a pitchfork in the middle. */
export function PitchforkDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <div className="h-[5px] flex-1 bg-white" />
      <Pitchfork className="h-16 w-auto -rotate-12" outline="#fff" />
      <div className="h-[5px] flex-1 bg-white" />
    </div>
  );
}
