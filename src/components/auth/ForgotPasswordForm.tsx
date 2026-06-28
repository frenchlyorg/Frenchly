"use client";

// ForgotPasswordForm — D-04
// Collects an email and calls the resetPassword server action, which sends a
// Supabase reset link. The action always returns the same message regardless of
// whether the email is registered (no enumeration, T-02-16).

import { useState } from "react";
import { resetPassword } from "@/app/auth/actions";
import Spinner from "@/components/ui/Spinner";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await resetPassword(formData);
    setMessage(result.message);
    setPending(false);
  }

  return (
    <form action={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Always-same confirmation — shown after submit (no enumeration) */}
      {message && (
        <p
          role="status"
          className="bg-secondary-container/30 border border-outline-variant rounded px-4 py-3 text-on-surface font-body text-sm"
        >
          {message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="reset-email"
          className="font-label text-[13px] text-on-surface-variant"
        >
          Email
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full border border-outline rounded px-3 py-2 bg-surface-container-low text-on-surface font-body text-sm min-h-[44px] focus:outline-none focus:border-b-[3px] focus:border-primary transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[44px] bg-primary text-on-primary font-label text-sm rounded px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Sending reset link…
          </span>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
