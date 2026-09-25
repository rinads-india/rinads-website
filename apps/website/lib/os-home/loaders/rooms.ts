import type { RoomSummary } from "@/lib/os-home/types";

/**
 * No Rooms backend yet. Live mode returns an empty list (honest empty state).
 * Demo rooms come only from the demo adapter — never mix into live.
 */
export async function loadLiveRooms(): Promise<RoomSummary[]> {
  return [];
}
