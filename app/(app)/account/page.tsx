import { BadgeCheck, CreditCard, ShieldCheck, UserRound } from "lucide-react";

import { DatabaseUnavailableError, requireCurrentDbUserOrRedirect } from "@/lib/auth";
import { hasClerkServerEnv } from "@/lib/env";
import { Container } from "@/components/ui/container";

const accountCards = [
  {
    title: "Identity",
    description: "Clerk-backed sign-in, session handling, and future account controls.",
    icon: UserRound,
  },
  {
    title: "Security",
    description: "Protected routes and server-side user resolution are already wired.",
    icon: ShieldCheck,
  },
  {
    title: "Plan readiness",
    description: "The schema is prepared for usage tracking and billing expansion.",
    icon: CreditCard,
  },
];

export default async function AccountPage() {
  const dbUser = hasClerkServerEnv
    ? await requireCurrentDbUserOrRedirect().catch((error) => {
        if (error instanceof DatabaseUnavailableError) {
          return null;
        }

        throw error;
      })
    : null;

  return (
    <Container className="py-10">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface p-8">
          <div className="eyebrow">Account</div>
          <h1 className="mt-5 text-4xl text-slate-950">Your account foundation is in place.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            This area is ready for profile details, billing controls, usage visibility, and account
            settings as the product grows.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Display name</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {dbUser?.name ?? "Not set yet"}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Email</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {dbUser?.email ?? "Local demo mode"}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Sync status</div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                {dbUser ? "Synced to application database" : "Awaiting live auth configuration"}
              </div>
            </div>
          </div>
        </section>

        <section className="surface-dark p-8 text-white">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Account Roadmap</div>
          <h2 className="mt-4 text-3xl">Prepared for settings, billing, and usage insights.</h2>
          <div className="mt-8 grid gap-4">
            {accountCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <card.icon className="h-5 w-5 text-sky-300" />
                <div className="mt-4 text-lg font-semibold text-white">{card.title}</div>
                <p className="mt-2 text-sm leading-7 text-slate-300">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
