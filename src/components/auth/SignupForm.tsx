"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signUp } from "@/app/auth/actions";
import Spinner from "@/components/ui/Spinner";

interface FieldError {
  field: "email" | "username" | "password" | "general" | null;
  message: string;
}

export function SignupForm() {
  const [error, setError] = useState<FieldError | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError({ field: result.error, message: result.message });
      setPassword("");
    }
    setPending(false);
  }

  return (
    <form action={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* General error banner */}
      {error?.field === "general" && (
        <p
          id="signup-general-error"
          role="alert"
          className="text-error font-label text-[13px] bg-error/10 rounded px-3 py-2"
        >
          {error.message}
        </p>
      )}

      {/* Email field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="signup-email"
          className="font-label text-[13px] text-on-surface-variant"
        >
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={
            error?.field === "email" ? "signup-email-error" : undefined
          }
          aria-invalid={error?.field === "email" ? "true" : undefined}
          className="w-full border border-outline rounded px-3 py-2 bg-surface-container-low text-on-surface font-body text-sm min-h-[44px] focus:outline-none focus:border-b-[3px] focus:border-primary transition-all"
        />
        {error?.field === "email" && (
          <p
            id="signup-email-error"
            role="alert"
            className="text-error font-label text-[13px]"
          >
            {error.message}
          </p>
        )}
      </div>

      {/* Username field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="signup-username"
          className="font-label text-[13px] text-on-surface-variant"
        >
          Username
        </label>
        <input
          id="signup-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          aria-describedby={
            error?.field === "username"
              ? "signup-username-error"
              : "signup-username-hint"
          }
          aria-invalid={error?.field === "username" ? "true" : undefined}
          className="w-full border border-outline rounded px-3 py-2 bg-surface-container-low text-on-surface font-body text-sm min-h-[44px] focus:outline-none focus:border-b-[3px] focus:border-primary transition-all"
        />
        {error?.field === "username" ? (
          <p
            id="signup-username-error"
            role="alert"
            className="text-error font-label text-[13px]"
          >
            {error.message}
          </p>
        ) : (
          <p
            id="signup-username-hint"
            className="text-on-surface-variant font-label text-[13px]"
          >
            3–20 characters: letters, numbers, underscores
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="signup-password"
          className="font-label text-[13px] text-on-surface-variant"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={
              error?.field === "password"
                ? "signup-password-error"
                : "signup-password-hint"
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
        {error?.field === "password" ? (
          <p
            id="signup-password-error"
            role="alert"
            className="text-error font-label text-[13px]"
          >
            {error.message}
          </p>
        ) : (
          <p
            id="signup-password-hint"
            className="text-on-surface-variant font-label text-[13px]"
          >
            At least 12 characters including one number
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
            <Spinner /> Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}
