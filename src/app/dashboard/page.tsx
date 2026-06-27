import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DiagnosticGate from "@/components/diagnostic/DiagnosticGate";

export const metadata = {
  title: "Dashboard — Frenchly",
};

export default async function DashboardPage() {
  // Defense-in-depth: proxy already guards this route, but double-check here (T-02-10)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Placement gate (D-P01 / T-04-EoP-04): a first-time student with no completed
  // placement is forced through the diagnostic before any content. This is a
  // Server Component guard, NOT middleware — middleware cannot do the RLS read (Pitfall 4).
  const { data: completedPlacement } = await supabase
    .from("diagnostic_attempts")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("diagnostic_type", "placement")
    .eq("status", "completed")
    .maybeSingle();

  if (!completedPlacement) {
    const { data: inProgress } = await supabase
      .from("diagnostic_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("diagnostic_type", "placement")
      .eq("status", "in_progress")
      .maybeSingle();
    return <DiagnosticGate hasInProgress={!!inProgress} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, unlocked_through_level_number")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? user.email ?? "there";

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        {/* Greeting */}
        <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-8">
          Welcome back, {username}.
        </h1>

        {/* Placeholder lesson card */}
        <div className="border-2 border-dashed border-outline-variant rounded-[16px] p-8 bg-surface-container-low">
          <p className="font-body text-on-surface-variant text-sm mb-1">
            Your lessons are coming soon.
          </p>
          <p className="font-body text-on-surface-variant text-sm">
            French 1 content launches in a future update.
          </p>
        </div>
      </div>
    </main>
  );
}
