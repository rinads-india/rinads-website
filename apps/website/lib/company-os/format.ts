const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatMoney(amount: number, currency = "INR"): string {
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${nf.format(amount)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function relativeDays(value: string | null | undefined, now: Date): string {
  if (!value) return "—";
  const days = Math.round((new Date(value).getTime() - now.getTime()) / 86_400_000);
  if (days === 0) return "today";
  return days > 0 ? `in ${days}d` : `${-days}d ago`;
}

export const titleCase = (s: string) => s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
