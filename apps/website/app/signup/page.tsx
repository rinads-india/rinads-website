import type { Metadata } from "next";
import { Suspense } from "react";
import "./signup.css";
import RinadsSignUpApp from "@/components/auth/RinadsSignUpApp";
import { getPageMetadata } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/signup");
}

export default function SignUpPage() {
  return (
    <div className="signup-page">
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <RinadsSignUpApp />
      </Suspense>
    </div>
  );
}
