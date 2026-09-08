/** Returns an ISO timestamp for "one day ago from now". Kept out of Server Component bodies to avoid impure-call lint findings there. */
export function oneDayAgoIso(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}
