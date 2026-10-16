"use client";

type Props = {
  title: string;
  description: string;
  onOpenChat?: (prompt: string) => void;
};

/** Public-safe placeholder for modes that require an authenticated workspace. */
export function RinpoModePlaceholder({ title, description, onOpenChat }: Props) {
  return (
    <div className="flex h-full flex-col justify-between p-4 text-white">
      <div>
        <h3 className="text-sm font-bold text-purple-300">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-white/60">{description}</p>
      </div>
      {onOpenChat ? (
        <button
          type="button"
          onClick={() => onOpenChat(`Show me a demo of ${title} in RINADS.`)}
          className="mt-6 rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-left text-xs font-semibold text-purple-200 transition hover:border-purple-400/50"
        >
          Preview with RINPO in Ask →
        </button>
      ) : null}
    </div>
  );
}
