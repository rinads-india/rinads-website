"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type BranchOption = { id: string; name: string };

function withBranch(pathname: string, searchParams: Pick<URLSearchParams, "toString" | "get">, branchId?: string): string {
  const params = new URLSearchParams(searchParams.toString());
  if (branchId) params.set("branch", branchId);
  else params.delete("branch");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function branchHref(href: string, branchId?: string | null): string {
  if (!branchId) return href;
  const [path, existing] = href.split("?");
  const params = new URLSearchParams(existing ?? "");
  if (!params.has("branch")) params.set("branch", branchId);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function BranchSwitcher({ branches }: { branches: BranchOption[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("branch") ?? "";

  if (branches.length === 0) return null;

  if (branches.length === 1) {
    return (
      <span className="rounded-full border border-rinads-primary/20 bg-surface-muted px-3 py-1 text-xs font-semibold text-rinads-primary">
        {branches[0].name}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" aria-label="Store">
      <Link
        href={withBranch(pathname, searchParams)}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          !current ? "bg-rinads-primary text-white" : "bg-surface-muted text-foreground hover:bg-rinads-primary/10"
        }`}
      >
        All stores
      </Link>
      {branches.map((branch) => (
        <Link
          key={branch.id}
          href={withBranch(pathname, searchParams, branch.id)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            current === branch.id ? "bg-rinads-primary text-white" : "bg-surface-muted text-foreground hover:bg-rinads-primary/10"
          }`}
        >
          {branch.name}
        </Link>
      ))}
    </div>
  );
}
