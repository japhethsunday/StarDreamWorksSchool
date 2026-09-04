interface LogoProps {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  tagline?: string;
  crestClassName?: string;
}

/**
 * STAR DreamWorks Schools crest: a modern geometric interlocked "DW"
 * monogram with a faceted, beveled look. Layered gradient planes in
 * monochrome school red with crisp white edge highlights give it a raised,
 * embossed finish that echoes the embroidered uniform patch.
 */
export function Crest({ className = "w-10 h-10" }: { className?: string }) {
  const D = "M20 62 V16 C40 16 52 27 52 39.5 C52 52 40 62 20 62";
  const W = "M26.5 35 L31 58.5 L35.5 43 L40 58.5 L44.5 35";
  return (
    <svg
      viewBox="0 0 64 78"
      role="img"
      aria-label="STAR DreamWorks Schools crest"
      className={className}
    >
      <defs>
        <linearGradient id="dw-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8543A" />
          <stop offset="0.55" stopColor="#C93720" />
          <stop offset="1" stopColor="#8E2313" />
        </linearGradient>
        <linearGradient id="dw-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0755C" />
          <stop offset="0.5" stopColor="#D63F27" />
          <stop offset="1" stopColor="#A82A18" />
        </linearGradient>
        <linearGradient id="dw-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Deep bevel base */}
        <path d={D} stroke="#7A1D0F" strokeWidth="11" />
        <path d={W} stroke="#7A1D0F" strokeWidth="9" />
        {/* Facet planes */}
        <path d={D} stroke="url(#dw-edge)" strokeWidth="8" />
        <path d={W} stroke="url(#dw-edge)" strokeWidth="6.2" />
        <path d={D} stroke="url(#dw-face)" strokeWidth="4.2" />
        <path d={W} stroke="url(#dw-face)" strokeWidth="3" />
        {/* Raised top-edge highlights (embossed light) */}
        <path
          d="M20 16 C40 16 52 27 52 39.5"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          opacity="0.85"
        />
        <path
          d="M20 62 C40 62 52 52 52 42"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity="0.25"
        />
        <path
          d="M26.5 35 L31 58.5 L35.5 43 L40 58.5 L44.5 35"
          stroke="url(#dw-sheen)"
          strokeWidth="1.1"
          opacity="0.7"
        />
        {/* Flat polygonal glints for the crystal cut */}
        <polygon points="30,20 38,20 34,30" fill="#FFFFFF" opacity="0.28" />
        <polygon points="44,44 50,48 45,54" fill="#FFFFFF" opacity="0.22" />
        <polygon points="24,50 29,52 26,58" fill="#7A1D0F" opacity="0.3" />
      </g>
    </svg>
  );
}

export default function Logo({
  variant = "dark",
  showWordmark = true,
  tagline,
  crestClassName = "w-10 h-10 lg:w-11 lg:h-11",
}: LogoProps) {
  const starLine =
    variant === "dark" ? "text-brand-navy" : "text-white";
  const nameLine = variant === "dark" ? "text-brand-red" : "text-brand-yellow";

  return (
    <span className="flex items-center gap-2.5">
      <Crest className={crestClassName} />
      {showWordmark && (
        <span className="leading-none">
          <span
            className={`block text-[11px] font-bold uppercase ${starLine}`}
            style={{ letterSpacing: "0.32em" }}
          >
            Star
          </span>
          <span
            className={`block font-heading text-lg lg:text-[1.35rem] font-bold ${nameLine}`}
          >
            DreamWorks Schools
          </span>
          {tagline && (
            <span
              className={`mt-1 hidden sm:block text-[10px] lg:text-[11px] font-medium uppercase tracking-wider ${
                variant === "dark" ? "text-brand-muted" : "text-white/50"
              }`}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
