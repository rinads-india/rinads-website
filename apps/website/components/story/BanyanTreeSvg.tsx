export function BanyanTreeSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 660 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ancient banyan tree drawn as a glowing purple circuit network"
    >
      <path className="story-btree-path" d="M330 390 L330 280" style={{ transitionDelay: "0.05s" }} />
      <path className="story-btree-path" d="M330 280 L330 240 L240 185 L240 130" style={{ transitionDelay: "0.3s" }} />
      <path className="story-btree-path" d="M240 185 L180 185 L180 390" style={{ transitionDelay: "0.65s" }} />
      <path className="story-btree-path" d="M330 280 L330 230 L420 175 L420 120" style={{ transitionDelay: "0.45s" }} />
      <path className="story-btree-path" d="M420 175 L480 175 L480 390" style={{ transitionDelay: "0.75s" }} />
      <path className="story-btree-path" d="M330 280 L330 110" style={{ transitionDelay: "0.55s" }} />
      <path className="story-btree-path" d="M240 130 L180 90 L110 90" style={{ transitionDelay: "0.9s" }} />
      <path className="story-btree-path" d="M240 130 L260 65 L260 28" style={{ transitionDelay: "1.0s" }} />
      <path className="story-btree-path" d="M330 110 L330 44 L295 18" style={{ transitionDelay: "1.1s" }} />
      <path className="story-btree-path" d="M330 110 L330 44 L368 16" style={{ transitionDelay: "1.15s" }} />
      <path className="story-btree-path" d="M420 120 L490 82 L560 82" style={{ transitionDelay: "1.2s" }} />
      <path className="story-btree-path" d="M420 120 L400 62 L400 28" style={{ transitionDelay: "1.3s" }} />
      <path className="story-btree-path" d="M330 390 L100 390" style={{ transitionDelay: "1.5s" }} />
      <path className="story-btree-path" d="M330 390 L560 390" style={{ transitionDelay: "1.55s" }} />
      <circle className="story-btree-node" cx="110" cy="90" style={{ transitionDelay: "1.7s" }} />
      <circle className="story-btree-node" cx="260" cy="28" style={{ transitionDelay: "1.75s" }} />
      <circle className="story-btree-node" cx="295" cy="18" style={{ transitionDelay: "1.8s" }} />
      <circle className="story-btree-node" cx="368" cy="16" style={{ transitionDelay: "1.85s" }} />
      <circle className="story-btree-node" cx="400" cy="28" style={{ transitionDelay: "1.9s" }} />
      <circle className="story-btree-node" cx="560" cy="82" style={{ transitionDelay: "1.95s" }} />
      <circle className="story-btree-node" cx="330" cy="110" style={{ transitionDelay: "2.0s" }} />
      <circle className="story-btree-node" cx="240" cy="130" style={{ transitionDelay: "2.05s" }} />
      <circle className="story-btree-node" cx="420" cy="120" style={{ transitionDelay: "2.1s" }} />
    </svg>
  );
}
