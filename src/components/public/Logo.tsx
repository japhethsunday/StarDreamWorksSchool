interface LogoProps {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  tagline?: string;
  crestClassName?: string;
}

/**
 * STAR DreamWorks Schools crest, drawn to match the embroidered uniform
 * emblem: a thin red-outline shield bearing a bold block "W".
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
      {/* Bold block W emblem */}
      <text
        x="32"
        y="53"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="32"
        fill="#C93720"
      >
        W
      </text>
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
