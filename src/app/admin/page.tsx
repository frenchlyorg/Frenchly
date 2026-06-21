import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin — Frenchly",
};

export default async function AdminPage() {
  // Defense-in-depth: proxy already guards /admin for unauthenticated users (T-02-13),
  // but the page independently enforces the role boundary (AUTH-05, T-02-11).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Non-admin authenticated users are sent to their dashboard (T-02-11)
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-8">
          Admin area
        </h1>

        <div className="bg-surface-container rounded-[16px] p-8">
          <p className="font-body text-on-surface text-base">
            Content management is coming soon. This area will allow lesson
            editing and student management.
          </p>
        </div>
      </div>
    </main>
  );
}
