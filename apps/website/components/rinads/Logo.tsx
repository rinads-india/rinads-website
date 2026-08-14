export function Logo({
  className = "",
  markClassName = "h-8 w-8 md:h-9 md:w-9",
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden
        className={`shrink-0 ${markClassName}`}
      >
        <defs>
          <linearGradient id="rinads-r" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e9b8ff" />
            <stop offset="35%" stopColor="#c06be8" />
            <stop offset="70%" stopColor="#9f4bc7" />
            <stop offset="100%" stopColor="#5c2480" />
          </linearGradient>
        </defs>
        <path
          fill="url(#rinads-r)"
          d="M14 8c0-2.2 1.8-4 4-4h18.5c9.4 0 15.5 5.6 15.5 14.2 0 6.2-3.2 10.8-8.4 13.2L54 56h-12.5L32.2 33.6H26V56H14V8Zm12 17.2h9.2c3.9 0 6.3-2.1 6.3-5.5s-2.4-5.5-6.3-5.5H26v11Z"
        />
      </svg>
      {wordmark && (
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-rinads-primary">
          Rinads
        </span>
      )}
    </span>
  );
}
