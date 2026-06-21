import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Create your account — Frenchly",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <div className="max-w-[480px] mx-auto px-5 md:px-6">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-2">
            Create your account
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Start your French journey — it only takes a minute.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface-container-low rounded-[16px] p-6 md:p-8">
          <SignupForm />
        </div>

        {/* Cross-link */}
        <p className="mt-6 text-center font-body text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:opacity-80 transition-opacity"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
