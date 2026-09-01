export function LoginSketchArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 640 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Laptop — faded */}
        <g opacity="0.18" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="88" y="120" width="140" height="90" rx="6" />
          <line x1="98" y1="130" x2="218" y2="130" />
          <path d="M72 218 L244 218 L256 238 L60 238 Z" />
        </g>

        {/* Office chair — bright */}
        <g opacity="0.75" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M420 140 C420 110 460 110 460 140 L460 200" />
          <ellipse cx="440" cy="205" rx="28" ry="8" />
          <line x1="440" y1="213" x2="440" y2="270" />
          <path d="M410 270 L470 270" />
          <path d="M420 280 L400 295 M460 280 L480 295" />
        </g>

        {/* Box / package — medium */}
        <g opacity="0.35" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M300 320 L360 290 L420 320 L420 400 L360 430 L300 400 Z" />
          <path d="M360 290 L360 430" />
          <path d="M300 320 L360 350 L420 320" />
        </g>

        {/* Monitor — bright */}
        <g opacity="0.85" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="120" y="380" width="160" height="110" rx="8" />
          <line x1="200" y1="490" x2="200" y2="520" />
          <line x1="160" y1="520" x2="240" y2="520" />
        </g>

        {/* Smartphone — faded */}
        <g opacity="0.22" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="500" y="360" width="56" height="100" rx="10" />
          <circle cx="528" cy="448" r="4" />
        </g>

        {/* Camera — medium bright */}
        <g opacity="0.55" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="60" y="560" width="100" height="72" rx="10" />
          <circle cx="110" cy="596" r="22" />
          <circle cx="110" cy="596" r="12" />
          <rect x="130" y="572" width="18" height="12" rx="3" />
        </g>

        {/* Gavel — bright accent */}
        <g opacity="0.9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="380" y="520" width="70" height="22" rx="4" transform="rotate(-35 415 531)" />
          <line x1="400" y1="545" x2="360" y2="610" />
          <path d="M340 615 Q355 625 370 615" />
        </g>

        {/* Desk lamp — faded */}
        <g opacity="0.2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M280 600 L280 680" />
          <path d="M260 680 L300 680" />
          <path d="M280 600 Q320 560 360 580" />
          <path d="M355 575 L370 590 L345 600 Z" />
        </g>

        {/* Printer — medium */}
        <g opacity="0.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="440" y="620" width="130" height="70" rx="6" />
          <rect x="460" y="600" width="90" height="24" rx="4" />
          <line x1="460" y1="660" x2="550" y2="660" />
          <rect x="470" y="670" width="70" height="8" rx="2" />
        </g>

        {/* Headphones — bright */}
        <g opacity="0.7" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M150 720 Q150 680 190 680 Q230 680 230 720" />
          <rect x="138" y="718" width="24" height="40" rx="10" />
          <rect x="218" y="718" width="24" height="40" rx="10" />
        </g>

        {/* Keyboard — faded */}
        <g opacity="0.15" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="300" y="740" width="160" height="50" rx="6" />
          <line x1="315" y1="755" x2="445" y2="755" />
          <line x1="315" y1="768" x2="445" y2="768" />
          <line x1="315" y1="781" x2="400" y2="781" />
        </g>

        {/* Trophy — bright accent */}
        <g opacity="0.8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M520 720 L520 760 L500 780 L540 780 L520 760" />
          <path d="M500 780 L540 780 L545 790 L495 790 Z" />
          <path d="M505 720 C505 690 535 690 535 720" />
          <path d="M505 720 L495 700 M535 720 L545 700" />
        </g>

        {/* Decorative dots */}
        <circle cx="560" cy="180" r="2" fill="white" opacity="0.3" />
        <circle cx="200" cy="300" r="1.5" fill="white" opacity="0.5" />
        <circle cx="340" cy="480" r="2" fill="white" opacity="0.25" />
        <circle cx="80" cy="420" r="1.5" fill="white" opacity="0.4" />
        <circle cx="580" cy="540" r="2" fill="white" opacity="0.35" />
      </svg>

      {/* Soft vignette so sketches blend into gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-indigo-800/30" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-indigo-900/40 to-transparent" />
    </div>
  );
}
