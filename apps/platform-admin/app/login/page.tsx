import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        RINADS Platform
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Founder and Super Admin access only. Server authorization is authoritative.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm defaultNext="/" />
      </Suspense>
    </main>
  );
}
