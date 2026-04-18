import { useEffect, useRef } from "react";
import { RefreshCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIGeneratedPage, AIGeneratedSection, AIGenerationResponse } from "@/types/ai";

type SiteRendererProps = {
  site: AIGenerationResponse;
  activePageSlug?: string;
  onRegenerateSection?: (sectionId: string) => void;
  onPageChange?: (slug: string) => void;
  regeneratingSectionId?: string | null;
};

const supportedPageTypes = ["home", "features", "pricing", "about", "contact", "faq"] as const;

function hexToHsl(hex: string): string {
  // Simple hex to HSL numbers conversion (no hsl wrapper)
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getPalette(site: AIGenerationResponse) {
  const [primary = "#000000", secondary = "#475569", surface = "#FFFFFF", accent = "#94A3B8"] =
    site.palette || [];

  return {
    primary,
    secondary,
    surface,
    accent,
    softSurface: `${surface}F2`,
    softAccent: `${accent}1A`,
    softSecondary: `${secondary}12`,
    // HSL versions for Tailwind variable injection
    primaryHsl: hexToHsl(primary),
    secondaryHsl: hexToHsl(secondary),
    accentHsl: hexToHsl(accent),
    backgroundHsl: hexToHsl(surface),
  };
}

function inferPageType(page: AIGeneratedPage) {
  const normalized = page.slug.toLowerCase();

  if (supportedPageTypes.includes(normalized as (typeof supportedPageTypes)[number])) {
    return normalized as (typeof supportedPageTypes)[number];
  }

  const title = page.title.toLowerCase();

  if (title.includes("feature")) return "features";
  if (title.includes("pricing")) return "pricing";
  if (title.includes("about")) return "about";
  if (title.includes("contact")) return "contact";
  if (title.includes("faq")) return "faq";

  return "home";
}

function getPageBySlug(site: AIGenerationResponse, slug?: string) {
  if (!slug) {
    return site.pages[0];
  }

  return site.pages.find((page) => page.slug === slug) ?? site.pages[0];
}

function HeroSection({
  section,
  brand,
  tagline,
  audience,
  palette,
}: {
  section: AIGeneratedSection;
  brand: string;
  tagline: string;
  audience: string;
  palette: ReturnType<typeof getPalette>;
}) {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 px-6 text-center">
      {/* Dynamic Background Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.08] blur-[120px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${palette.accent}, ${palette.secondary})` }}
      />
      
      <div className="relative max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/40 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-800 shadow-sm">
          <Sparkles className="h-3 w-3 text-blue-500" />
          {brand}
        </div>
        
        <h1 className="mt-10 font-display text-5xl leading-[1.1] text-slate-950 sm:text-7xl tracking-[-0.04em]">
          {section.title}
        </h1>
        
        <p className="mt-8 mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
          {section.description}
        </p>
        
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <button className="rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-premium transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: palette.primary }}>
            {section.ctaLabel ?? "Get started now"}
          </button>
          <div className="text-sm font-semibold text-slate-500 border-b border-slate-200 pb-0.5">
            {tagline}
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <div className="h-px w-8 bg-slate-200" />
          Built for {audience.toLowerCase()}
          <div className="h-px w-8 bg-slate-200" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({
  site,
  section,
}: {
  site: AIGenerationResponse;
  section: AIGeneratedSection;
}) {
  const palette = getPalette(site);
  return (
    <section className="py-16 px-6 sm:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="max-w-2xl">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4 flex items-center gap-3">
            <div className="h-px w-4 bg-blue-600/30" />
            Core Capabilities
          </div>
          <h2 className="font-display text-4xl text-slate-950 sm:text-5xl tracking-tight">{section.title}</h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{section.description}</p>
        </div>
      </div>
      
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {site.keyFeatures.map((feature, index) => (
          <div key={feature.title} className="group relative">
            <div className="absolute -inset-4 rounded-[32px] bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100 -z-10" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft border border-slate-100 mb-6 text-xl font-black" style={{ color: palette.primary }}>
              0{index + 1}
            </div>
            <h3 className="text-xl font-bold text-slate-950">{feature.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection({
  section,
  palette,
}: {
  section: AIGeneratedSection;
  palette: ReturnType<typeof getPalette>;
}) {
  const steps = [
    "Design captured.",
    "Structure inferred.",
    "Ready to launch.",
  ];

  return (
    <section className="py-16 px-6 sm:px-8 bg-slate-50/50">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4">Process</div>
        <h2 className="font-display text-4xl text-slate-950 sm:text-5xl tracking-tight">{section.title}</h2>
        <p className="mt-6 text-lg leading-relaxed text-slate-600">{section.description}</p>
      </div>
      
      <div className="grid gap-12 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="text-center relative">
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200 border-t border-dashed border-slate-300" />
            )}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-white shadow-soft text-xl font-bold mb-6" style={{ color: palette.primary }}>
              {index + 1}
            </div>
            <p className="text-base font-semibold text-slate-900 px-4">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection({
  site,
  section,
}: {
  site: AIGenerationResponse;
  section: AIGeneratedSection;
}) {
  const palette = getPalette(site);
  const plans = [
    {
      name: "Simple Start",
      price: "$29",
      features: ["All core components", "Basic export", "Standard support"],
    },
    {
      name: "Professional",
      price: "$79",
      features: ["Custom branding", "Advanced export", "Priority support"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Tailored output", "Team collaboration", "Dedicated success"],
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8">
      <div className="text-center mb-16">
        <h2 className="font-display text-4xl text-slate-950 sm:text-5xl mb-6">{section.title}</h2>
        <p className="mx-auto max-w-2xl text-lg text-slate-500">{site.pricingDirection}</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-[32px] p-8 border transition-all hover:shadow-xl",
              plan.popular ? "bg-slate-950 text-white border-slate-900 scale-105 z-10" : "bg-white border-slate-100"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-glow">
                Most Popular
              </div>
            )}
            <div className="text-sm font-bold uppercase tracking-widest mb-6 opacity-60">
              {plan.name}
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black">{plan.price}</span>
              {plan.price !== "Custom" && <span className="text-sm opacity-50">/mo</span>}
            </div>
            <ul className="space-y-4 mb-10">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={cn(
              "w-full rounded-2xl py-4 text-sm font-bold transition-all",
              plan.popular ? "bg-white text-slate-950 shadow-glow" : "bg-slate-50 text-slate-950 hover:bg-slate-100"
            )}>
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection({
  section,
  palette,
}: {
  section: AIGeneratedSection;
  palette: ReturnType<typeof getPalette>;
}) {
  const items = [
    { text: "We went from rough idea to polished launch page faster than any past project.", author: "Sarah Jenkins", role: "Product Lead" },
    { text: "The structured plan made it much easier to align messaging and design.", author: "Marcus Thorne", role: "CEO" },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-slate-950 text-white rounded-[40px] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,var(--blue-500),transparent_50%)]" />
      
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
          Community Voice
        </div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">{section.title}</h2>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((item) => (
          <blockquote key={item.author} className="relative rounded-[32px] bg-white/5 border border-white/10 p-8 backdrop-blur-sm shadow-xl">
             <div className="text-blue-400 text-5xl font-serif leading-none absolute top-4 left-6 opacity-40">“</div>
            <p className="relative z-10 text-lg leading-relaxed text-slate-300 italic mb-8 pt-4">
              {item.text}
            </p>
            <footer className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10" />
              <div>
                <div className="text-sm font-bold text-white">{item.author}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">{item.role}</div>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ site, section }: { site: AIGenerationResponse; section: AIGeneratedSection }) {
  const palette = getPalette(site);
  return (
    <section className="mx-6 sm:mx-8 mb-12">
      <div 
        className="rounded-[40px] p-10 text-center relative overflow-hidden shadow-2xl" 
        style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20 px-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 blur-[60px] rounded-full -ml-20 -mb-20 px-10" />

        <div className="relative z-10">
          <h2 className="font-display text-4xl text-white sm:text-5xl leading-tight">{section.title}</h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-white/80">{site.ctaDirection}</p>
          <div className="mt-10 inline-flex rounded-2xl bg-white px-10 py-4 text-sm font-bold text-slate-950 shadow-large transition-all hover:scale-105 active:scale-95 cursor-pointer">
            {section.ctaLabel ?? "Get started today"}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection({ site, section }: { site: AIGenerationResponse; section: AIGeneratedSection }) {
  const palette = getPalette(site);
  const faqs = [
    {
      q: `Who is ${site.brand} for?`,
      a: site.audience,
    },
    {
      q: "How should the site be positioned?",
      a: site.productPositioning,
    },
    {
      q: "What does the CTA focus on?",
      a: site.ctaDirection,
    },
  ];

  return (
    <section className="rounded-[28px] border p-6 sm:p-8" style={{ borderColor: `${palette.primary}20`, backgroundColor: palette.surface }}>
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">FAQ</div>
      <h2 className="mt-4 text-3xl text-slate-950">{section.title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{section.description}</p>
      <div className="mt-8 space-y-3">
        {faqs.map((faq) => (
          <div key={faq.q} className="rounded-[22px] px-4 py-4" style={{ backgroundColor: palette.softSecondary }}>
            <div className="font-semibold text-slate-950">{faq.q}</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">{faq.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ site, section }: { site: AIGenerationResponse; section: AIGeneratedSection }) {
  const palette = getPalette(site);
  return (
    <section className="rounded-[28px] border p-6 sm:p-8" style={{ borderColor: `${palette.primary}20`, backgroundColor: palette.surface }}>
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Contact</div>
      <h2 className="mt-4 text-3xl text-slate-950">{section.title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{section.description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[22px] p-5" style={{ backgroundColor: palette.softSecondary }}>
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Email</div>
          <div className="mt-3 text-lg font-semibold text-slate-950">hello@{site.brand.toLowerCase().replace(/\s+/g, "")}.com</div>
        </div>
        <div className="rounded-[22px] p-5" style={{ backgroundColor: palette.softSecondary }}>
          <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Best next step</div>
          <div className="mt-3 text-sm leading-7 text-slate-700">{site.ctaDirection}</div>
        </div>
      </div>
    </section>
  );
}

function FooterSection({ site }: { site: AIGenerationResponse }) {
  const palette = getPalette(site);
  return (
    <footer className="rounded-[28px] border px-6 py-8 sm:px-8" style={{ borderColor: `${palette.primary}20`, backgroundColor: palette.surface }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-950">{site.brand}</div>
          <div className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{site.tagline}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
          {site.siteMap.map((item) => (
            <span key={item} className="rounded-full px-3 py-2" style={{ backgroundColor: palette.softSecondary }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function DefaultSection({
  section,
  palette,
}: {
  section: AIGeneratedSection;
  palette: ReturnType<typeof getPalette>;
}) {
  return (
    <section className="rounded-[28px] border p-6 sm:p-8" style={{ borderColor: `${palette.primary}20`, backgroundColor: palette.surface }}>
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{section.type}</div>
      <h2 className="mt-4 text-3xl text-slate-950">{section.title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{section.description}</p>
    </section>
  );
}

function renderSection(site: AIGenerationResponse, section: AIGeneratedSection, pageType: string) {
  const palette = getPalette(site);
  if (section.type === "hero") {
    return <HeroSection section={section} brand={site.brand} tagline={site.tagline} audience={site.audience} palette={palette} />;
  }

  if (section.type === "features") {
    return <FeaturesSection site={site} section={section} />;
  }

  if (section.type === "how-it-works" || (pageType === "features" && section.type === "problem")) {
    return <HowItWorksSection section={section} palette={palette} />;
  }

  if (section.type === "pricing" || pageType === "pricing") {
    return <PricingSection site={site} section={section} />;
  }

  if (section.type === "social-proof") {
    return <TestimonialsSection section={section} palette={palette} />;
  }

  if (section.type === "faq" || pageType === "faq") {
    return <FaqSection site={site} section={section} />;
  }

  if (section.type === "contact" || pageType === "contact") {
    return <ContactSection site={site} section={section} />;
  }

  if (section.type === "cta") {
    return <CtaSection site={site} section={section} />;
  }

  return <DefaultSection section={section} palette={palette} />;
}

export function SiteRenderer({
  site,
  activePageSlug,
  onRegenerateSection,
  onPageChange,
  regeneratingSectionId,
}: SiteRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const page = getPageBySlug(site, activePageSlug);
  const pageType = inferPageType(page);
  const palette = getPalette(site);

  return (
    <div
      ref={containerRef}
      className="rounded-[40px] p-1 text-slate-950 shadow-soft sm:p-2 bg-slate-100"
    >
      <div className="rounded-[38px] bg-white overflow-hidden shadow-sm">
        <nav className="px-6 sm:px-8 py-6 flex items-center justify-between gap-4 lg:gap-6 border-b border-slate-100">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-premium">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xl font-black tracking-tight text-slate-950 leading-none pt-1 truncate">{site.brand}</div>
          </div>
          <div className="hidden lg:flex shrink-0 items-center gap-5 xl:gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {site.siteMap.slice(0, 4).map(item => {
              const slug = item.toLowerCase().replace(/\s+/g, "");
              return (
                <span 
                  key={item} 
                  className={cn(
                    "hover:text-slate-900 cursor-pointer transition-colors whitespace-nowrap",
                    activePageSlug === slug && "text-slate-900 underline underline-offset-8"
                  )}
                  onClick={() => onPageChange?.(slug)}
                >
                  {item}
                </span>
              );
            })}
          </div>
          <div className="shrink-0 rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-glow transition hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap" style={{ backgroundColor: palette.primary }}>
            Contact Us
          </div>
        </nav>

        <div className="space-y-5">
          {page.sections.map((section, index) => (
            <div
              key={section.id}
              className="animate-reveal group relative"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {renderSection(site, section, pageType)}

              {onRegenerateSection && (
                <div className="absolute inset-0 z-10 flex cursor-default items-center justify-center rounded-[28px] bg-slate-950/20 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={regeneratingSectionId === section.id}
                    onClick={() => onRegenerateSection(section.id)}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCcw className={regeneratingSectionId === section.id ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    {regeneratingSectionId === section.id ? "Regenerating..." : "Regenerate section"}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="animate-reveal" style={{ animationDelay: `${page.sections.length * 120}ms` }}>
            <FooterSection site={site} />
          </div>
        </div>
      </div>
    </div>
  );
}
