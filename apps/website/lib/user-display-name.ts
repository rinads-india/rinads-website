export type UserDisplayNameInput = {
  preferredName?: string | null;
  firstName?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  /** Never used for greeting — accepted only so callers can pass the object safely. */
  email?: string | null;
};

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return null;
  return trimmed;
}

/**
 * Resolve a human greeting name. Never returns an email address.
 * Fallback chain: preferred_name → first_name → display_name → full_name → "there"
 */
export function getUserDisplayName(input: UserDisplayNameInput = {}): string {
  return (
    clean(input.preferredName) ??
    clean(input.firstName) ??
    clean(input.displayName) ??
    clean(input.fullName) ??
    "there"
  );
}
