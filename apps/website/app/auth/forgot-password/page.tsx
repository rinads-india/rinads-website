import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | RINADS",
  description: "Request a RINADS password reset email.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-white">Forgot password</h1>
      <p className="mt-2 text-sm text-white/70">
        Enter your email. If an account exists, a reset link will be sent. This page never confirms
        whether an account exists.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm text-white/60">
        <Link href="/signup?mode=login" className="text-rinads-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
