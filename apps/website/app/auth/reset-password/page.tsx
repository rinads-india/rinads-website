import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | RINADS",
  description: "Set a new RINADS password after a valid recovery session.",
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-white">Reset password</h1>
      <p className="mt-2 text-sm text-white/70">
        A valid recovery session is required. Password updates are refused without one.
      </p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
