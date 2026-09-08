import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — R GLOW Console",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">R GLOW · Salon OS</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Owner &amp; staff console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your RINADS account to manage branches, services, staff, and appointments.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
