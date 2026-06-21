// /account — Account settings page
// Protected: redirects to /login if no authenticated user (proxy also guards).
// Shows password change card and danger-zone card (delete account).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "@/components/auth/DeleteAccountForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background py-16">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6">
        <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-10">
          Account settings
        </h1>

        {/* ── Password card ────────────────────────────────────────────── */}
        <section
          aria-labelledby="password-section-heading"
          className="bg-surface border border-outline-variant rounded-lg p-6 mb-6"
        >
          <h2
            id="password-section-heading"
            className="font-heading text-lg font-semibold text-on-surface mb-1"
          >
            Change password
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-5">
            Choose a new password for your account.
          </p>
          <UpdatePasswordForm />
        </section>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="danger-zone-heading"
          className="border border-error/30 rounded-lg p-6"
        >
          <h2
            id="danger-zone-heading"
            className="font-heading text-lg font-semibold text-error mb-1"
          >
            Delete account
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-5">
            This will permanently remove your account. Your learning progress
            cannot be recovered.
          </p>
          <DeleteAccountForm />
        </section>
      </div>
    </main>
  );
}
