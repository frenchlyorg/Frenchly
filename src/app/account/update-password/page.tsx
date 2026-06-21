// /account/update-password — Password reset landing page
// The user arrives here after clicking the email reset link and the callback route
// exchanges the one-time code for a session.

import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-16">
      <div className="w-full max-w-[480px] mx-auto px-5 md:px-6">
        <div className="bg-surface border border-outline-variant rounded-lg p-8">
          <h1 className="font-heading text-2xl font-semibold text-on-surface mb-2">
            Set a new password
          </h1>
          <p className="font-body text-sm text-on-surface-variant mb-6">
            Choose a password you haven&apos;t used before.
          </p>
          <UpdatePasswordForm />
        </div>
      </div>
    </main>
  );
}
