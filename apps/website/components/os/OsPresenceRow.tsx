"use client";

const AVATARS = ["A", "B", "C", "D", "E"] as const;

export function OsPresenceRow() {
  return (
    <div className="os-glass flex items-center justify-center gap-2 rounded-full px-4 py-2 shadow-sm">
      {AVATARS.map((initial, index) => (
        <span
          key={initial}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 text-xs font-semibold text-gray-800"
          style={{ marginLeft: index === 0 ? 0 : -8 }}
        >
          {initial}
        </span>
      ))}
      <span className="ml-1 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
        +17
      </span>
    </div>
  );
}
