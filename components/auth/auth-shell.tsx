import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const highlights = [
  "Secure session handling with Clerk",
  "Protected product routes ready for expansion",
  "Brand-consistent auth screens and account controls",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden py-6 sm:py-10">
      <div className="hero-orb left-[-120px] top-12 h-72 w-72 bg-sky-300" />
      <div className="hero-orb right-[-120px] top-24 h-80 w-80 bg-amber-300" />
      <div className="hero-orb left-[28%] top-[62%] h-52 w-52 bg-cyan-200/80" />
      <Container className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.98fr_1.02fr]">
          <section className="surface-dark auth-grid relative overflow-hidden p-8 text-white sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_34%)]" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <h1 className="mt-6 max-w-xl text-5xl leading-[0.95] sm:text-6xl">{title}</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">{description}</p>
              <div className="mt-10 grid gap-4">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-1 sm:px-4">
            <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur-xl sm:p-5">
              {children}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
