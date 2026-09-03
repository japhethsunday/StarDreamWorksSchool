interface LogoProps {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  tagline?: string;
  crestClassName?: string;
}

/**
 * STAR DreamWorks Schools crest, drawn to match the embroidered uniform
 * patch: an interlocked "DW" monogram in collegiate outline style. The
 * curved outer "D" doubles as the shield-like frame, with the "W" nested
 * inside it. Layered strokes mimic the patch's distinct outer border and
 * raised satin-stitch edge, all in monochrome school red.
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
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Distinct outer border layer (darker red edge) */}
        <path d={D} stroke="#A82A18" strokeWidth="10" />
        <path d={W} stroke="#A82A18" strokeWidth="8" />
        {/* Main satin face */}
        <path d={D} stroke="#C93720" strokeWidth="7" />
        <path d={W} stroke="#C93720" strokeWidth="5.4" />
        {/* Hollow core between the stitched edges */}
        <path d={D} stroke="#FFFFFF" strokeWidth="3.2" />
        <path d={W} stroke="#FFFFFF" strokeWidth="2.2" />
        {/* Stitch line down the middle of each stroke */}
        <path
          d={D}
          stroke="#C93720"
          strokeWidth="1"
          strokeDasharray="2.4 2"
          opacity="0.55"
        />
        <path
          d={W}
          stroke="#C93720"
          strokeWidth="0.9"
          strokeDasharray="2.2 1.8"
          opacity="0.55"
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
