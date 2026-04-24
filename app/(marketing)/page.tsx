import {
  ArrowRight,
  Bot,
  Code2,
  Globe,
  Layers3,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    icon: Bot,
    title: "Structured AI generation",
    description:
      "Turn a rough startup idea into brand direction, page sections, copy, and launch-ready layout blocks.",
  },
  {
    icon: Globe,
    title: "Domain discovery in flow",
    description:
      "Find ownable domain ideas while the site takes shape, instead of switching across five tools.",
  },
  {
    icon: SearchCheck,
    title: "Instant SEO clarity",
    description:
      "Get a quick quality score for titles, meta copy, headings, and conversion readiness before shipping.",
  },
  {
    icon: Code2,
    title: "Ownable output",
    description:
      "Export clean code and keep momentum after the first draft instead of getting trapped in a black-box builder.",
  },
];

const stats = [
  { label: "Time to first draft", value: "< 3 min" },
  { label: "Sections generated", value: "12+" },
  { label: "Domain ideas surfaced", value: "25" },
];

const workflow = [
  "Describe the product, audience, and tone.",
  "Generate a polished site structure and page copy.",
  "Refine sections, messaging, and visual direction.",
  "Validate domains and SEO before export.",
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="hero-orb left-[-80px] top-20 h-72 w-72 bg-sky-300/80" />
      <div className="hero-orb right-[-120px] top-40 h-80 w-80 bg-amber-300/70" />
      <div className="hero-orb left-[40%] top-[-60px] h-48 w-48 bg-violet-300/40" />
      <SiteHeader />
      <section className="relative pt-8 sm:pt-12">
        <Container className="grid items-center gap-12 pb-24 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-16">
          <div className="animate-reveal">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              AI Website Generator
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[0.92] sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="text-gradient-hero">Launch a premium startup site</span>{" "}
              <span className="text-foreground">from a single idea.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Create a conversion-ready homepage, explore domain options, and
              audit SEO in one focused workspace built for founders and fast-moving teams.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link className={cn(buttonVariants({ size: "lg" }), "animate-pulse-glow")} href="/sign-up">
                Start building
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                href="#features"
              >
                Explore the flow
              </a>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="surface card-hover-lift px-5 py-5 animate-reveal"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <div className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</div>
                  <div className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-reveal [animation-delay:140ms]">
            <div className="surface-elevated relative overflow-hidden p-4 sm:p-6">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
              <div className="grid gap-4">
                <div className="rounded-[24px] bg-slate-950 p-5 text-white shadow-glow">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Project Brief</span>
                    <span>Draft v1</span>
                  </div>
                  <div className="mt-4 text-2xl font-semibold">
                    AI tool for startup teams to launch sites without waiting on design.
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Tone
                      </div>
                      <div className="mt-1 font-medium text-white">Confident, modern</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Audience
                      </div>
                      <div className="mt-1 font-medium text-white">Founders, indie hackers</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Layers3 className="h-4 w-4 text-primary" />
                      Generated Sections
                    </div>
                    <div className="mt-4 space-y-3">
                      {["Hero", "Problem", "How it works", "Testimonials", "Pricing", "FAQ"].map(
                        (section) => (
                          <div
                            key={section}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <span className="font-medium text-slate-900">{section}</span>
                            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              Ready
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-700">
                        SEO Quick Score
                      </div>
                      <div className="mt-2 text-4xl font-bold text-emerald-950">92</div>
                      <p className="mt-3 text-sm leading-6 text-emerald-900/80">
                        Strong heading structure and CTA clarity. Improve meta description length.
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-700">
                        Domain Ideas
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-amber-950">
                        <div>launchboard.ai</div>
                        <div>buildwithlaunch.com</div>
                        <div>shipfaster.studio</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="features" className="pb-24">
        <Container>
          <SectionHeading
            eyebrow="Why this foundation"
            title="Built for speed, clarity, and ownership from the start."
            description="The scaffold is ready for app flows, AI orchestration, project persistence, templates, and exportable renderers without repainting the architecture later."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className="surface card-hover-lift group animate-reveal p-6"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:shadow-lg">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="foundation" className="pb-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="surface gradient-border-top p-8">
              <SectionHeading
                eyebrow="Core workflow"
                title="A product flow that feels crisp before the backend is fully wired."
                description="The homepage shell mirrors the future app journey so the visual language stays consistent from marketing to workspace."
                align="left"
              />
              <div className="mt-8 space-y-4">
                {workflow.map((item, index) => (
                  <div
                    key={item}
                    className="group flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-soft animate-reveal"
                    style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface overflow-hidden p-8">
              <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(6,182,212,0.95),rgba(251,146,60,0.9))] p-[1px]">
                <div className="rounded-[27px] bg-slate-950 px-6 py-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Reusable foundation
                      </div>
                      <div className="mt-2 text-3xl">Production-minded scaffold</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      Next.js + TypeScript
                    </div>
                  </div>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {[
                      "App Router setup",
                      "Premium CSS variable system",
                      "Reusable layout and UI primitives",
                      "Folders for actions, hooks, renderers, templates, and types",
                      "Prisma schema starter",
                      "Homepage shell with responsive sections",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </main>
  );
}
