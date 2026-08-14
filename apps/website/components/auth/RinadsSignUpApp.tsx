"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/rinads/Logo";
import { ThemeToggle } from "@/components/rinads/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4";

const heroContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function RinadsSignUpApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = searchParams.get("mode") === "login";
  const { signup, login } = useAuth();
  const { openPhoneScreen } = useRinpo();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialHint, setSocialHint] = useState<string | null>(null);

  const steps = useMemo(
    () =>
      isLogin
        ? [
            { number: 1, text: "Sign in to your workspace", active: true },
            { number: 2, text: "Connect RINPO Intelligence", active: false },
            { number: 3, text: "Access RINADS Cloud", active: false },
          ]
        : [
            { number: 1, text: "Create your account", active: true },
            { number: 2, text: "Connect RINPO Intelligence", active: false },
            { number: 3, text: "Access RINADS Cloud", active: false },
          ],
    [isLogin]
  );

  const toggleModeHref = isLogin ? "/signup" : "/signup?mode=login";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const username =
      trimmedEmail ||
      `${firstName.trim()}.${lastName.trim()}`.replace(/^\.|\.$|^$/, "") ||
      firstName.trim() ||
      lastName.trim();

    if (!username) {
      setError("Please enter your email or name.");
      return;
    }

    if (password.length < 8) {
      setError("Password requires at least 8 symbols.");
      return;
    }

    const ok = isLogin
      ? login(username, password, "client")
      : signup(username, password, "client");

    if (!ok) {
      setError("Demo session could not start. Please try again.");
      return;
    }

    if (!isLogin) {
      openPhoneScreen("chat", "Hi RINPO — I just created my RINADS account.");
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-screen w-full bg-black p-2 transition-all duration-500 selection:bg-white/30 lg:h-screen lg:overflow-hidden lg:p-4">
      <section className="relative hidden h-full w-[52%] flex-col items-center justify-end overflow-hidden rounded-3xl px-12 pb-32 shadow-2xl lg:flex">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={heroItem} className="flex items-center gap-2.5 text-white">
            <Logo className="h-8 brightness-0 invert" priority={false} />
            <span className="text-xl font-semibold tracking-tight">RINADS</span>
          </motion.div>

          <motion.div variants={heroItem} className="space-y-3 text-white">
            <h1 className="whitespace-nowrap text-4xl font-medium tracking-tight">
              {isLogin ? "Welcome back" : "Join RINADS"}
            </h1>
            <p className="px-4 text-sm leading-relaxed text-white/60">
              {isLogin
                ? "Sign in to continue your RINADS Cloud journey with RINPO Intelligence."
                : "Follow these 3 quick phases to activate RINADS Cloud with RINPO Intelligence."}
            </p>
          </motion.div>

          <motion.div variants={heroItem} className="space-y-3">
            {steps.map((step) => (
              <StepItem key={step.number} number={step.number} text={step.text} active={step.active} />
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="signup-form-column relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-12 lg:overflow-hidden lg:px-16 lg:py-6 xl:px-24">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <motion.div
          className="w-full max-w-xl space-y-8 sm:space-y-10 lg:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight">
              {isLogin ? "Log in to RINADS Cloud" : "Create your RINADS profile"}
            </h2>
            <p className="signup-subtitle">
              {isLogin
                ? "Enter your credentials to access your workspace."
                : "Enter your details to start your Business Cloud journey."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialButton
              icon={<GoogleIcon />}
              label="Google"
              onClick={() => setSocialHint("Google sign-in is coming soon to RINADS Cloud.")}
            />
            <SocialButton
              icon={<LinkedInIcon />}
              label="LinkedIn"
              onClick={() => setSocialHint("LinkedIn sign-in is coming soon to RINADS Cloud.")}
            />
          </div>

          {socialHint ? (
            <p className="text-center text-xs text-rinads-primary" role="status">
              {socialHint}
            </p>
          ) : null}

          <div className="relative flex items-center">
            <div className="signup-divider-line grow border-t" />
            <span className="signup-divider-text">Or</span>
            <div className="signup-divider-line grow border-t" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputGroup
                  label="First Name"
                  placeholder="Alex"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                  required
                />
                <InputGroup
                  label="Last Name"
                  placeholder="Rivera"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                  required
                />
              </div>
            ) : null}

            <InputGroup
              label={isLogin ? "Email or username" : "Email"}
              placeholder={isLogin ? "you@company.com" : "you@company.com"}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />

            <div className="space-y-1.5">
              <InputGroup
                label="Password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70 dark:text-white/40 dark:hover:text-white/70"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              {!isLogin ? (
                <p className="text-xs text-white/35 dark:text-white/35 [.signup-form-column_&]:text-muted-foreground">
                  Requires at least 8 symbols.
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="signup-submit">
              {isLogin ? "Log in" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 [.signup-form-column_&]:text-muted-foreground">
            {isLogin ? "New to RINADS? " : "Already on the team? "}
            <a href={toggleModeHref} className="font-medium text-rinads-primary hover:underline">
              {isLogin ? "Create account" : "Log in"}
            </a>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function StepItem({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-rinads-primary bg-rinads-primary text-white"
          : "border-transparent bg-[#1a1224] text-white/80"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          active ? "bg-white text-rinads-primary" : "bg-white/10 text-white/40"
        }`}
      >
        {number}
      </span>
      <span>{text}</span>
    </div>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black text-sm font-medium text-white transition-colors hover:bg-white/5 dark:border-white/10 dark:bg-black dark:hover:bg-white/5 [.signup-form-column_&]:border-black/10 [.signup-form-column_&]:bg-surface [.signup-form-column_&]:text-foreground [.signup-form-column_&]:hover:bg-surface-muted"
    >
      {icon}
      {label}
    </button>
  );
}

function InputGroup({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  endAdornment,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  endAdornment?: ReactNode;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={id} className="block space-y-2">
      <span className="text-sm font-medium text-white [.signup-form-column_&]:text-foreground">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="signup-input"
        />
        {endAdornment}
      </div>
    </label>
  );
}
