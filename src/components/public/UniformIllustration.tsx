/**
 * Flat illustrative artwork of pupils in the STAR DreamWorks Schools uniform
 * (white shirt, red tie, navy bottoms, crest) sharing a book in class.
 *
 * Deliberately stylised illustration — not presented as a photograph of
 * real pupils. Used where genuine school photography is not yet published.
 */
export default function UniformIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 560 420"
      role="img"
      aria-label="Illustration of pupils in STAR DreamWorks Schools uniform reading together"
      className={className}
    >
      {/* Backdrop */}
      <rect x="0" y="0" width="560" height="420" rx="20" fill="#FFF9EC" />
      <rect x="0" y="0" width="560" height="420" rx="20" fill="none" stroke="#E9E2CF" strokeWidth="2" />
      {/* Sun / star motif */}
      <circle cx="478" cy="66" r="30" fill="#F5B301" opacity="0.9" />
      <path
        d="M478 22l4.4 9.2 10.1 1.3-7.4 7 1.9 10-9-4.9-9 4.9 1.9-10-7.4-7 10.1-1.3z"
        fill="#fff"
        opacity="0.85"
      />
      {/* Bookshelf blocks */}
      <g opacity="0.9">
        <rect x="36" y="60" width="150" height="14" rx="4" fill="#1F2A5E" opacity="0.12" />
        <rect x="36" y="82" width="110" height="14" rx="4" fill="#C93720" opacity="0.14" />
        <rect x="36" y="104" width="132" height="14" rx="4" fill="#1E7A4C" opacity="0.14" />
      </g>
      {/* Desk */}
      <rect x="70" y="330" width="420" height="18" rx="8" fill="#1F2A5E" />
      <rect x="96" y="348" width="16" height="44" fill="#1F2A5E" opacity="0.8" />
      <rect x="448" y="348" width="16" height="44" fill="#1F2A5E" opacity="0.8" />

      {/* Pupil 1 (left) */}
      <g>
        <circle cx="170" cy="170" r="34" fill="#8D5524" opacity="0.85" />
        <path d="M136 168a34 34 0 0168 0v-6c0-20-15-32-34-32s-34 12-34 32z" fill="#1B2340" />
        <rect x="132" y="212" width="76" height="92" rx="14" fill="#FFFFFF" stroke="#D8D2BD" strokeWidth="2" />
        <path d="M170 214l-11 10 6 44h10l6-44z" fill="#C93720" />
        <path d="M159 212l11 8 11-8 4 6-15 10-15-10z" fill="#EDE8D6" />
        {/* crest */}
        <rect x="188" y="238" width="12" height="14" rx="3" fill="none" stroke="#C93720" strokeWidth="1.6" />
        <text x="194" y="249" textAnchor="middle" fontSize="9" fontWeight="900" fill="#C93720" fontFamily="Arial, Helvetica, sans-serif">W</text>
        {/* arm to book */}
        <rect x="200" y="252" width="52" height="20" rx="10" fill="#fff" stroke="#D8D2BD" strokeWidth="2" />
        <circle cx="254" cy="262" r="11" fill="#8D5524" opacity="0.85" />
      </g>

      {/* Pupil 2 (centre, standing with book) */}
      <g>
        <circle cx="290" cy="140" r="36" fill="#6B4226" opacity="0.9" />
        <path d="M254 138a36 36 0 0172 0v-8c0-21-16-34-36-34s-36 13-36 34z" fill="#1B2340" />
        <rect x="250" y="184" width="80" height="104" rx="14" fill="#FFFFFF" stroke="#D8D2BD" strokeWidth="2" />
        <path d="M290 186l-12 11 6 48h12l6-48z" fill="#C93720" />
        <path d="M278 184l12 9 12-9 4 6-16 11-16-11z" fill="#EDE8D6" />
        <rect x="308" y="212" width="13" height="15" rx="3" fill="none" stroke="#C93720" strokeWidth="1.6" />
        <text x="314.5" y="224" textAnchor="middle" fontSize="10" fontWeight="900" fill="#C93720" fontFamily="Arial, Helvetica, sans-serif">W</text>
        {/* open book */}
        <path d="M228 300c20-10 42-10 62 0 20-10 42-10 62 0v34c-20-10-42-10-62 0-20-10-42-10-62 0z" fill="#fff" stroke="#1F2A5E" strokeWidth="2.5" />
        <line x1="290" y1="300" x2="290" y2="334" stroke="#1F2A5E" strokeWidth="2.5" />
        <g stroke="#C9C2A8" strokeWidth="2">
          <line x1="240" y1="310" x2="280" y2="310" />
          <line x1="240" y1="318" x2="280" y2="318" />
          <line x1="300" y1="310" x2="340" y2="310" />
          <line x1="300" y1="318" x2="340" y2="318" />
        </g>
        {/* arms */}
        <rect x="216" y="240" width="46" height="20" rx="10" fill="#fff" stroke="#D8D2BD" strokeWidth="2" />
        <rect x="318" y="240" width="46" height="20" rx="10" fill="#fff" stroke="#D8D2BD" strokeWidth="2" />
        {/* navy skirt/trousers */}
        <path d="M250 288h80l10 44H240z" fill="#1F2A5E" />
      </g>

      {/* Pupil 3 (right) */}
      <g>
        <circle cx="408" cy="172" r="33" fill="#7A4E2D" opacity="0.88" />
        <path d="M375 170a33 33 0 0166 0v-6c0-19-15-31-33-31s-33 12-33 31z" fill="#1B2340" />
        <rect x="371" y="213" width="74" height="90" rx="14" fill="#FFFFFF" stroke="#D8D2BD" strokeWidth="2" />
        <path d="M408 215l-11 10 6 42h10l6-42z" fill="#C93720" />
        <path d="M397 213l11 8 11-8 4 6-15 10-15-10z" fill="#EDE8D6" />
        <rect x="382" y="239" width="12" height="14" rx="3" fill="none" stroke="#C93720" strokeWidth="1.6" />
        <text x="388" y="250" textAnchor="middle" fontSize="9" fontWeight="900" fill="#C93720" fontFamily="Arial, Helvetica, sans-serif">W</text>
        <rect x="330" y="252" width="50" height="20" rx="10" fill="#fff" stroke="#D8D2BD" strokeWidth="2" />
        <circle cx="328" cy="262" r="11" fill="#7A4E2D" opacity="0.88" />
      </g>

      {/* Floor books */}
      <g>
        <rect x="392" y="306" width="52" height="12" rx="3" fill="#C93720" opacity="0.85" />
        <rect x="396" y="294" width="52" height="12" rx="3" fill="#1F2A5E" opacity="0.9" />
        <rect x="120" y="308" width="46" height="11" rx="3" fill="#1E7A4C" opacity="0.8" />
      </g>
    </svg>
  );
}
