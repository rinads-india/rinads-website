/**
 * Safety checks for `runway:sync` (pure, so they can be unit-tested).
 *
 * Creating an avatar is not idempotent: running the sync twice without
 * RUNWAY_AVATAR_ID would silently create a second Character (and spend
 * credits). This is easy to do from CI, where every run starts from nothing.
 */

export type AvatarSummary = { id: string; name: string };

/**
 * Returns the id of an existing avatar with the same name, so the caller can
 * refuse to create a duplicate. Names are compared case-insensitively.
 */
export function findDuplicateAvatar(
  existing: readonly AvatarSummary[],
  name: string,
): AvatarSummary | null {
  const wanted = name.trim().toLowerCase();
  return existing.find((avatar) => avatar.name.trim().toLowerCase() === wanted) ?? null;
}

export function duplicateAvatarMessage(duplicate: AvatarSummary, name: string): string {
  return (
    `A Character named "${name}" already exists (${duplicate.id}). ` +
    `Set RUNWAY_AVATAR_ID=${duplicate.id} to update it instead, or pass --force-create ` +
    `to create another one on purpose.`
  );
}
