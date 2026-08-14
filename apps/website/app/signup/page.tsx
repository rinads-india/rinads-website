import type { Metadata } from "next";
import { Suspense } from "react";
import "./signup.css";
import RinadsSignUpApp from "@/components/auth/RinadsSignUpApp";

export const metadata: Metadata = {
  title: "RINADS | Sign Up",
  description: "Create your RINADS profile and activate RINADS Cloud with RINPO Intelligence.",
};

export default function SignUpPage() {
  return (
    <div className="signup-page">
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <RinadsSignUpApp />
      </Suspense>
    </div>
  );
}
