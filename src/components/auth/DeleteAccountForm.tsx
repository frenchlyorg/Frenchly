"use client";

// DeleteAccountForm — AUTH-04, D-14
// The delete button stays disabled until the user types exactly "delete" (case-sensitive).
// Calls deleteAccount server action on submit — never passes a user id (T-02-15).

import { useState, useRef } from "react";
import { deleteAccount } from "@/app/auth/actions";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isConfirmed = confirmation.trim() === "delete";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed) return;

    setPending(true);
    setError(null);

    try {
      await deleteAccount();
      // deleteAccount redirects on success — this line is unreachable on success
    } catch (err: unknown) {
      // Next.js redirect() throws internally — re-throw so the navigation fires
      if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT:")) {
        throw err;
      }
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label
          htmlFor="delete-confirmation"
          className="block font-label text-sm text-on-surface mb-1"
        >
          Type <span className="font-mono font-semibold">delete</span> to confirm
        </label>
        <input
          id="delete-confirmation"
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="delete"
          aria-label="Type delete to confirm account deletion"
          aria-describedby={error ? "delete-error" : undefined}
          autoComplete="off"
          disabled={pending}
          className="w-full border border-outline rounded px-3 py-2 bg-surface text-on-surface font-body text-sm focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-50"
        />
      </div>

      {error && (
        <p
          id="delete-error"
          role="alert"
          className="font-label text-xs text-error mb-3"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isConfirmed || pending}
        aria-disabled={!isConfirmed || pending}
        className="border border-error text-error font-label text-sm px-4 py-2 rounded bg-transparent transition-opacity disabled:opacity-40 enabled:hover:bg-error enabled:hover:text-on-error"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
