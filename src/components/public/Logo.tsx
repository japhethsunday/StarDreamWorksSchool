interface LogoProps {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  tagline?: string;
  crestClassName?: string;
}

/**
 * STAR DreamWorks Schools crest, drawn to match the embroidered uniform
 * emblem: a thin red-outline shield bearing the interlocked "DW" monogram
 * (a collegiate outer "D" with a "W" nested inside), all in school red.
 */
export function Crest({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 78"
      role="img"
      aria-label="STAR DreamWorks Schools crest"
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M32 5L55 13.5V39c0 15-10 25.5-23 31.5C19 64.5 9 54 9 39V13.5z"
        fill="#FFFFFF"
        stroke="#C93720"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Interlocked DW monogram in collegiate outline style */}
      <g
        fill="none"
        stroke="#C93720"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer D: stem + bowl */}
        <path d="M23 22V58" strokeWidth="5" />
        <path d="M23 22C39 22 49 31 49 40C49 49 39 58 23 58" strokeWidth="5" />
        {/* Inner W nested in the D */}
        <path
          d="M27.5 33L31.5 51L35.5 38.5L39.5 51L43.5 33"
          strokeWidth="3.6"
        />
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
