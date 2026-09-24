import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — R GLOW Console",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/rglow-logo.png"
            alt="R GLOW"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-contain"
            priority
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">R GLOW · Salon OS</p>
            <h1 className="mt-0.5 text-xl font-semibold text-foreground">Owner &amp; staff console</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Sign in with your RINADS account to manage branches, services, staff, and appointments.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
