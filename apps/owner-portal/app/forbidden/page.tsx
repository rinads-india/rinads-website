import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This workspace is limited to active owner and staff roles. Server authorization is
        authoritative; navigation is not shown for unauthorized accounts.
      </p>
      <Link href="/login" className="mt-6 text-sm font-medium text-rinads-primary hover:underline">
        Return to sign in
      </Link>
    </main>
  );
}
