import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DiagnosticGate from "@/components/diagnostic/DiagnosticGate";
import { minDelay } from "@/lib/min-delay";

export const metadata = {
  title: "Dashboard — Frenchly",
};

export default async function DashboardPage() {
  // Defense-in-depth: proxy already guards this route, but double-check here (T-02-10)
  const supabase = await createClient();
  const delayPromise = minDelay();
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
    await delayPromise;
    return <DiagnosticGate hasInProgress={!!inProgress} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, unlocked_through_level_number")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? user.email ?? "there";

  // Fetch current level with nested lessons + sub_components (Pitfall 3: order by referenced table)
  const { data: level } = await supabase
    .from("levels")
    .select(
      "id, slug, name, level_number, lessons ( id, slug, title, position, sub_components ( id, position ) )"
    )
    .eq("level_number", profile?.unlocked_through_level_number ?? 1)
    .order("position", { referencedTable: "lessons" })
    .single();

  // Fetch student's completed sub_components (Pitfall 1: empty .in([]) crashes — use sentinel)
  const allSubIds = (level?.lessons ?? []).flatMap(
    (l) => (l.sub_components ?? []).map((s) => s.id)
  );
  const { data: progressRows } = await supabase
    .from("sub_component_progress")
    .select("sub_component_id")
    .eq("user_id", user.id)
    .in("sub_component_id", allSubIds.length > 0 ? allSubIds : ["__none__"]);
  const completedSet = new Set((progressRows ?? []).map((r) => r.sub_component_id));

  // Derive dashboard metrics
  const lessons = level?.lessons ?? [];
  const completedLessons = lessons.filter((l) =>
    (l.sub_components ?? []).every((s) => completedSet.has(s.id))
  );
  const totalLessons = lessons.length;
  const pct =
    totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  const firstIncomplete = lessons.find((l) =>
    (l.sub_components ?? []).some((s) => !completedSet.has(s.id))
  );
  // CRITICAL: lesson URL uses lessonId (UUID), not slug — confirmed from lesson page .eq('id', lessonId)
  const continueHref = firstIncomplete
    ? `/levels/${level?.slug}/lessons/${firstIncomplete.id}`
    : level
    ? `/levels/${level.slug}`
    : null;

  await delayPromise;
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-20">
        {/* Greeting */}
        <h1 className="font-heading text-[28px] font-semibold text-on-surface mb-8">
          Welcome back, {username}.
        </h1>

        {/* Current level card */}
        <div className="rounded-[16px] p-8 bg-surface-container border border-outline-variant mb-6">
          {level ? (
            <p className="font-heading text-[22px] font-semibold text-on-surface">
              {level.name}
            </p>
          ) : (
            <p className="font-body text-on-surface-variant text-sm">
              Your level is being prepared.
            </p>
          )}
        </div>

        {/* Progress bar + label */}
        <div className="mb-6">
          <div
            role="progressbar"
            aria-valuenow={completedLessons.length}
            aria-valuemin={0}
            aria-valuemax={totalLessons}
            aria-label={`${completedLessons.length} of ${totalLessons} lessons complete`}
            className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="font-label text-sm text-on-surface-variant mt-2">
            {completedLessons.length} of {totalLessons} lessons complete
          </p>
        </div>

        {/* Continue CTA */}
        {continueHref && (
          <Link
            href={continueHref}
            className="inline-block px-6 py-3 bg-primary text-on-primary rounded font-label text-sm hover:bg-primary/90 transition-colors"
          >
            {firstIncomplete ? "Continue lesson" : "All done — take the level quiz"}
          </Link>
        )}
      </div>
    </main>
  );
}
