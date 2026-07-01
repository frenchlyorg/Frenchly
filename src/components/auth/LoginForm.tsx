"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/app/auth/actions";
import Spinner from "@/components/ui/Spinner";

interface FieldError {
  field: "email" | "password" | "general" | null;
  message: string;
}

const LOCKOUT_SUBSTRING = "15 minutes";

function isLockoutError(message: string): boolean {
  return message.includes(LOCKOUT_SUBSTRING);
}

export function LoginForm() {
  const [error, setError] = useState<FieldError | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError({ field: result.error, message: result.message });
      setPassword("");
    }
    setPending(false);
  }

  const showLockout =
    error?.field === "general" && isLockoutError(error.message);

  return (
    <form action={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Warm lockout banner — appears above fields */}
      {showLockout && (
        <div
          id="login-lockout-banner"
          role="alert"
          className="bg-secondary-container/30 border border-outline-variant rounded px-4 py-3 text-on-surface font-body text-sm"
        >
          <strong className="font-label">Too many attempts.</strong>{" "}
          {error!.message}
        </div>
      )}

      {/* General error (non-lockout) */}
      {error?.field === "general" && !showLockout && (
        <p
          id="login-general-error"
          role="alert"
          className="text-error font-label text-[13px]"
        >
          {error.message}
        </p>
      )}

      {/* Email field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="login-email"
          className="font-label text-[13px] text-on-surface-variant"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={
            error?.field === "email" ? "login-email-error" : undefined
          }
          aria-invalid={error?.field === "email" ? "true" : undefined}
          className="w-full border border-outline rounded px-3 py-2 bg-surface-container-low text-on-surface font-body text-sm min-h-[44px] focus:outline-none focus:border-b-[3px] focus:border-primary transition-all"
        />
        {error?.field === "email" && (
          <p
            id="login-email-error"
            role="alert"
            className="text-error font-label text-[13px]"
          >
            {error.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="font-label text-[13px] text-on-surface-variant"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="font-label text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={
              error?.field === "password" ? "login-password-error" : undefined
            }
            aria-invalid={error?.field === "password" ? "true" : undefined}
            className="w-full border border-outline rounded px-3 py-2 pr-11 bg-surface-container-low text-on-surface font-body text-sm min-h-[44px] focus:outline-none focus:border-b-[3px] focus:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error?.field === "password" && (
          <p
            id="login-password-error"
            role="alert"
            className="text-error font-label text-[13px]"
          >
            {error.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[44px] bg-primary text-on-primary font-label text-sm rounded px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Logging in…
          </span>
        ) : (
          "Log in to Frenchly"
        )}
      </button>
    </form>
  );
}
