interface LogoProps {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  tagline?: string;
  crestClassName?: string;
}

/**
 * STAR DreamWorks Schools crest, drawn to match the school's identity as
 * seen on the flyer/exercise-book cover and the embroidered uniform emblem:
 * a navy shield bearing a red "W", crowned with a gold star.
 */
export function Crest({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 78"
      role="img"
      aria-label="STAR DreamWorks Schools crest"
      className={className}
    >
      {/* Gold star above the shield */}
      <path
        d="M32 1.5l2.35 4.9 5.4.72-3.96 3.76.99 5.35L32 13.6l-4.78 2.63.99-5.35-3.96-3.76 5.4-.72z"
        fill="#F5B301"
      />
      {/* Shield */}
      <path
        d="M32 17L55 25.5V42c0 14.5-9.8 24.6-23 30-13.2-5.4-23-15.5-23-30V25.5z"
        fill="#FFFFFF"
        stroke="#1F2A5E"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M32 21.5L50.5 28v14c0 12-8.2 20.4-18.5 25-10.3-4.6-18.5-13-18.5-25V28z"
        fill="none"
        stroke="#C93720"
        strokeWidth="1.6"
        opacity="0.55"
      />
      {/* Red W emblem */}
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="27"
        fill="#C93720"
      >
        W
      </text>
      {/* Navy STAR ribbon word inside shield */}
      <text
        x="32"
        y="62.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="7.5"
        letterSpacing="1.5"
        fill="#1F2A5E"
      >
        STAR
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
