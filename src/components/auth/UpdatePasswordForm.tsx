"use client";

// UpdatePasswordForm — D-03, D-04
// Used on both /account (change password) and /account/update-password (reset link landing).
// Calls supabase.auth.updateUser client-side after client-side validation.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface FieldError {
  field: "new" | "confirm" | "general";
  message: string;
}

export function UpdatePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation — D-03: 12+ chars with at least one digit
    if (newPassword.length < 12 || !/\d/.test(newPassword)) {
      setError({
        field: "new",
        message:
          "Make it at least 12 characters with a number — your account will thank you.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setError({
        field: "confirm",
        message: "Passwords don't match.",
      });
      return;
    }

    setPending(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError({
        field: "general",
        message: "Something went wrong. Please try again.",
      });
      setPending(false);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* General error */}
      {error?.field === "general" && (
        <p
          role="alert"
          className="font-label text-xs text-error mb-3"
          id="update-password-error-general"
        >
          {error.message}
        </p>
      )}

      {/* Success message */}
      {success && (
        <p
          role="status"
          className="font-label text-xs text-on-surface mb-3"
        >
          Password updated successfully.
        </p>
      )}

      {/* New password */}
      <div className="mb-4">
        <label
          htmlFor="new-password"
          className="block font-label text-sm text-on-surface mb-1"
        >
          New password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={pending}
            aria-describedby={
              error?.field === "new" ? "update-password-error-new" : undefined
            }
            aria-invalid={error?.field === "new"}
            className="w-full border border-outline rounded px-3 py-2 pr-10 bg-surface text-on-surface font-body text-sm focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? "Hide new password" : "Show new password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error?.field === "new" && (
          <p
            id="update-password-error-new"
            role="alert"
            className="font-label text-xs text-error mt-1"
          >
            {error.message}
          </p>
        )}
        <p className="font-label text-xs text-on-surface-variant mt-1">
          At least 12 characters, including a number
        </p>
      </div>

      {/* Confirm password */}
      <div className="mb-5">
        <label
          htmlFor="confirm-password"
          className="block font-label text-sm text-on-surface mb-1"
        >
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={pending}
            aria-describedby={
              error?.field === "confirm"
                ? "update-password-error-confirm"
                : undefined
            }
            aria-invalid={error?.field === "confirm"}
            className="w-full border border-outline rounded px-3 py-2 pr-10 bg-surface text-on-surface font-body text-sm focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
            className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error?.field === "confirm" && (
          <p
            id="update-password-error-confirm"
            role="alert"
            className="font-label text-xs text-error mt-1"
          >
            {error.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2 bg-primary text-on-primary rounded font-label text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Updating…
          </span>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}
