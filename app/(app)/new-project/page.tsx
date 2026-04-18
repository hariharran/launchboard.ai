import { ArrowRight, CheckCircle2, LayoutTemplate, Palette, Sparkles, Target } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";

const inputs = [
  "Startup idea and product category",
  "Audience and buyer intent",
  "Brand tone and style direction",
  "Template preference and output mode",
];

const presets = [
  { label: "Startup", detail: "High-conviction launch messaging with momentum." },
  { label: "Agency", detail: "Bold proof-led structure for service businesses." },
  { label: "SaaS", detail: "Clean product-first sections with clear conversion flow." },
];

export default function NewProjectPage() {
  return (
    <Container className="py-10">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface p-8">
          <div className="eyebrow">New Project</div>
          <h1 className="mt-5 text-4xl text-slate-950">Start a premium website draft from one brief.</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            This shell is ready for the form flow that captures startup idea, audience, tone,
            palette, template, and output mode before calling the generation pipeline.
          </p>

          <div className="mt-8 space-y-3">
            {inputs.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4"
              >
                <span className="font-medium text-slate-900">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>

          <Link
            href="/generator"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open generator workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="surface-dark p-8 text-white">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Project Setup</div>
          <h2 className="mt-4 text-3xl">Guide the AI before the first draft is created.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <Target className="h-5 w-5 text-sky-300" />
              <div className="mt-4 text-lg font-semibold">Audience fit</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Capture who the site is for so messaging and structure are aligned from the start.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <Palette className="h-5 w-5 text-amber-300" />
              <div className="mt-4 text-lg font-semibold">Visual direction</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Shape the tone, palette, and feel before sections and code are rendered.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <LayoutTemplate className="h-5 w-5 text-emerald-300" />
              <div className="mt-4 text-lg font-semibold">Template fit</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Match layout patterns to the product category and conversion style you want.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <Sparkles className="h-5 w-5 text-fuchsia-300" />
              <div className="mt-4 text-lg font-semibold">Structured generation</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Feed the AI enough context to produce pages you can refine instead of rewrite.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {presets.map((preset) => (
              <div key={preset.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="font-semibold text-white">{preset.label}</div>
                <div className="mt-1 text-sm leading-7 text-slate-300">{preset.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
