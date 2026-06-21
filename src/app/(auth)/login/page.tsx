import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in — Frenchly",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background py-20">
      <div className="max-w-[480px] mx-auto px-5 md:px-6">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-2">
            Welcome back
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Great to see you again. Pick up right where you left off.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface-container-low rounded-[16px] p-6 md:p-8">
          <LoginForm />
        </div>

        {/* Cross-link */}
        <p className="mt-6 text-center font-body text-sm text-on-surface-variant">
          New to Frenchly?{" "}
          <Link
            href="/signup"
            className="text-primary hover:opacity-80 transition-opacity"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
