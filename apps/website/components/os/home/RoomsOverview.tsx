"use client";

import Link from "next/link";
import type { RoomSummary } from "@/lib/os-home/types";

export function RoomsOverview({
  rooms,
  error,
}: {
  rooms: RoomSummary[];
  error?: string;
}) {
  return (
    <section aria-labelledby="os-rooms-heading" className="os-glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="os-rooms-heading" className="text-base font-semibold text-gray-900">
          Rooms
        </h2>
        <Link
          href="/os/rooms"
          className="min-h-11 rounded-xl border border-gray-300/80 bg-white/60 px-3 text-xs font-semibold text-gray-900 transition hover:bg-white"
        >
          Open Rooms
        </Link>
      </div>

      {rooms.some((r) => r.source === "demo") && (
        <p className="mt-2 text-xs text-amber-800">Sample rooms — collaboration backend ships later.</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          Could not load rooms.
        </p>
      )}

      {!error && rooms.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-700">No rooms yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Create a Room for a project, team, or ongoing collaboration when Rooms IA is available.
          </p>
          <Link
            href="/os/rooms"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white"
          >
            Go to Rooms
          </Link>
        </div>
      )}

      {rooms.length > 0 && (
        <ul className="mt-4 space-y-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={room.href}
                className="flex min-h-11 flex-col rounded-2xl bg-white/55 px-4 py-3 transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{room.name}</span>
                  {room.live && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                      {room.liveLabel ?? "Live"}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 text-xs text-gray-600">{room.description}</span>
                <span className="mt-1 text-xs text-gray-500">
                  {[
                    room.participantCount != null ? `${room.participantCount} participants` : null,
                    room.unreadCount != null && room.unreadCount > 0
                      ? `${room.unreadCount} unread`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
