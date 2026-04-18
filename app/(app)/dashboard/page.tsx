import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Flame,
  FolderKanban,
  Globe2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { DatabaseUnavailableError, requireCurrentDbUserOrRedirect } from "@/lib/auth";
import { hasAuthPersistenceEnv } from "@/lib/env";
import { Container } from "@/components/ui/container";
import { getDashboardData } from "@/actions/projects";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (date.getTime() - now.getTime()) / 1000;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffInSeconds) < 60) return rtf.format(Math.round(diffInSeconds), "second");
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.round(diffInSeconds / 60), "minute");
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.round(diffInSeconds / 3600), "hour");
  if (Math.abs(diffInSeconds) < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), "day");

  return date.toLocaleDateString();
}

export default async function DashboardPage() {
  const dbUser = hasAuthPersistenceEnv
    ? await requireCurrentDbUserOrRedirect().catch((error) => {
      if (error instanceof DatabaseUnavailableError) {
        return null;
      }

      throw error;
    })
    : null;

  const dashboardData = dbUser ? await getDashboardData() : null;
  const displayName = dbUser?.name ?? dbUser?.email ?? "local demo mode";

  const cards = [
    {
      title: "Projects this week",
      value: String(dashboardData?.projectsThisWeek ?? 0).padStart(2, "0"),
      description: "Sites you've conceptualized and generated this week.",
      icon: Wand2,
    },
    {
      title: "Total projects",
      value: String(dashboardData?.projectCount ?? 0).padStart(2, "0"),
      description: "Jump back into past experiments and keep refining.",
      icon: FolderKanban,
    },
    {
      title: "Launch readiness",
      value: `${dashboardData?.latestProject?.seoScore ?? 0}%`,
      description: dashboardData?.latestProject
        ? `"${dashboardData.latestProject.brandName}" is in strong shape for launch.`
        : "Generate your first project to see SEO insights.",
      icon: Sparkles,
    },
  ];

  const recentProjects = dashboardData?.recentProjects ?? [];
  const savedDomains = dashboardData?.recentDomains ?? [];
  const seoSummary = dashboardData?.latestProject?.seoSummary;

  const recentSeoScores = seoSummary?.checks.slice(0, 3).map(check => ({
    label: check.label,
    value: check.passed ? "Passed" : "Action needed",
    detail: check.detail
  })) ?? [
      { label: "Meta clarity", value: "---", detail: "Generate a project to see structured SEO signals." },
      { label: "Heading structure", value: "---", detail: "We check hierarchy across hero and proof blocks." },
      { label: "CTA focus", value: "---", detail: "Ensuring primary actions are visible and aligned." },
    ];

  return (
    <Container className="py-12 animate-reveal">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface relative overflow-hidden p-8 sm:p-12">
          <div className="glass-line absolute inset-x-0 top-0 h-px opacity-50" />
          <div className="flex-1 min-w-0">
            <div className="eyebrow shadow-sm">Dashboard Home</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Welcome back, <span className="text-glow text-primary">{displayName}</span>
            </h1>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-base text-slate-600 max-w-xl">
                Manage your sites, discover domains, and review SEO signals.
              </p>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/generator"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-premium transition-all hover:scale-105 hover:bg-slate-800 active:scale-95 whitespace-nowrap"
                >
                  Create new project
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-soft transition-all hover:bg-slate-50 active:scale-95 whitespace-nowrap"
                >
                  View projects
                </Link>
              </div>
            </div>
          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {cards.map((card, idx) => (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/50 p-8 transition-all duration-300 hover:border-primary/20 hover:bg-white hover:shadow-premium"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:scale-150 group-hover:bg-primary/10" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-soft transition-transform group-hover:scale-110 group-hover:shadow-glow">
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-8 text-5xl font-black tracking-tighter text-slate-950">{card.value}</div>
                  <h2 className="mt-4 text-xl font-bold text-slate-950">{card.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 opacity-80">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-dark relative overflow-hidden p-10 text-white shadow-premium">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.1)$,transparent_40%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              <Compass className="h-4 w-4 text-primary" />
              Workspace Snapshot
            </div>
            <h2 className="mt-6 text-4xl leading-tight">A polished launch pipeline in one view.</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 opacity-90">
              Review your most recent brand metrics and domain findings across your entire history.
            </p>
            <div className="mt-10 grid gap-5">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/[0.08]">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Sync Status</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-300">
                  {dbUser
                    ? "Clerk identity linked and ready for production-grade server actions."
                    : "Running in local demo mode until variables are configured."}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/[0.08]">
                <div className="text-xs font-black uppercase tracking-widest text-secondary">Active Session</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-300">
                  {dashboardData?.latestProject
                    ? `Currently analyzing "${dashboardData.latestProject.brandName}".`
                    : "No active projects found yet."}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">Recent Projects</div>
              <h2 className="mt-6 text-4xl text-slate-950">Jump back into your best work.</h2>
            </div>
            <Link href="/projects" className="group text-sm font-bold text-slate-950">
              See all <ArrowRight className="inline h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 space-y-5">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/generator?projectId=${project.id}`}
                  className="group block rounded-[32px] border border-slate-100 bg-slate-50/50 p-7 transition-all hover:scale-[1.01] hover:border-primary/20 hover:bg-white hover:shadow-premium"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-slate-950 group-hover:text-primary transition-colors">{project.brandName || "Untitled"}</div>
                      <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 line-clamp-2 italic">
                        &quot;{project.tagline || (project as any).startupIdea}&quot;
                      </p>
                      <div className="mt-5 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-2">
                          <FolderKanban className="h-3.5 w-3.5" />
                          Updated {formatRelativeTime(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-white shadow-soft transition-all group-hover:shadow-glow group-hover:scale-110">
                      <div className="text-2xl font-black text-slate-950">{project.seoScore ?? 0}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO</div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[32px] border border-dashed border-slate-200 py-16 text-center">
                <p className="text-lg text-slate-400">Start your first project to populate this feed.</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8">
          <section className="surface p-10">
            <div className="flex items-center gap-3 text-slate-950">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Recent Domains</h2>
            </div>
            <div className="mt-8 space-y-4">
              {savedDomains.length > 0 ? (
                savedDomains.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-soft"
                  >
                    <div>
                      <div className="text-lg font-bold text-slate-950 group-hover:text-primary transition-colors">{item.fullDomain}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{item.projectName}</div>
                    </div>
                    <div className={cn(
                      "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                      item.availability === "AVAILABLE" ? "bg-emerald-500 text-white" : "bg-white text-slate-500 border border-slate-100"
                    )}>
                      {item.availability}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">No domain history available.</p>
                </div>
              )}
            </div>
          </section>

          <section className="surface p-10">
            <div className="flex items-center gap-3 text-slate-950">
              <Sparkles className="h-5 w-5 text-secondary" />
              <h2 className="text-2xl font-bold">Latest SEO Signals</h2>
            </div>
            <div className="mt-8 space-y-4">
              {recentSeoScores.map((item) => (
                <div key={item.label} className="group rounded-[28px] border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-soft">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-lg font-bold text-slate-950 group-hover:text-primary transition-colors">{item.label}</div>
                    <div className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      item.value === "Passed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>{item.value}</div>
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-slate-600 opacity-90">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 surface group relative flex flex-col items-start justify-between gap-8 overflow-hidden p-10 md:flex-row md:items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative">
          <div className="eyebrow">Ready To Create</div>
          <h2 className="mt-4 text-4xl text-slate-950 leading-tight">Start your next high-performance project.</h2>
        </div>
        <Link
          href="/generator"
          className="relative inline-flex items-center gap-2 rounded-full bg-slate-950 px-8 py-4 text-base font-bold text-white shadow-premium transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
        >
          New project
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </Container>
  );
}


function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

