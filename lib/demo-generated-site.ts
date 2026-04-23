import type { AIGenerationResponse } from "@/types/ai";

function buildDemoNav(activeSlug: string) {
  const items = [
    { slug: "home", label: "Home" },
    { slug: "features", label: "How It Works" },
    { slug: "pricing", label: "Pricing" },
    { slug: "about", label: "About" },
    { slug: "contact", label: "Contact" },
    { slug: "faq", label: "FAQ" },
  ];

  return items
    .map((item) => {
      const href = item.slug === "home" ? "/" : `/${item.slug}`;
      const activeClass = item.slug === activeSlug ? "nav-link nav-link-active" : "nav-link";
      const current = item.slug === activeSlug ? ' aria-current="page"' : "";
      return `<a class="${activeClass}" href="${href}"${current}>${item.label}</a>`;
    })
    .join("");
}

function buildDemoHtml({
  slug,
  title,
  description,
  kicker,
  eyebrow,
  ctaLabel,
  ctaHref,
}: {
  slug: string;
  title: string;
  description: string;
  kicker: string;
  eyebrow: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const nav = buildDemoNav(slug);
  const pageTitle = slug === "home" ? "Ledgerlane | Home" : `Ledgerlane | ${title}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${description}" />
    <title>${pageTitle}</title>
    <style>
      :root {
        --ink: #0f172a;
        --muted: #64748b;
        --surface: #f8fafc;
        --card: #ffffff;
        --line: rgba(15, 23, 42, 0.1);
        --primary: #0f172a;
        --secondary: #2563eb;
        --accent: #f59e0b;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34%),
          radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 26%),
          linear-gradient(180deg, #eef4ff 0%, #f8fafc 38%, #ffffff 100%);
        color: var(--ink);
      }
      a { color: inherit; text-decoration: none; }
      .shell {
        max-width: 1260px;
        margin: 28px auto;
        padding: 0 20px 48px;
      }
      .frame {
        overflow: hidden;
        border-radius: 36px;
        border: 1px solid rgba(255,255,255,0.72);
        background: rgba(255,255,255,0.82);
        box-shadow: 0 36px 100px rgba(15, 23, 42, 0.12);
        backdrop-filter: blur(16px);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 28px 32px;
        border-bottom: 1px solid var(--line);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 18px;
        font-weight: 900;
        letter-spacing: -0.05em;
        font-size: 18px;
      }
      .brand-mark {
        width: 62px;
        height: 62px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: white;
        font-size: 28px;
        background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);
      }
      .nav {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .nav-link {
        padding: 10px 14px;
        border-radius: 999px;
        color: #667085;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .nav-link-active {
        color: var(--primary);
        background: rgba(37, 99, 235, 0.1);
        box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.14);
      }
      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 22px;
        border-radius: 999px;
        font-weight: 800;
        background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%);
        color: white;
      }
      .main {
        padding: 28px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
        gap: 22px;
      }
      .card {
        border-radius: 30px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.84));
        box-shadow: 0 20px 48px rgba(15, 23, 42, 0.07);
      }
      .hero-copy {
        padding: 34px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.9);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 22px 0 16px;
        font-size: clamp(3.3rem, 7vw, 6rem);
        line-height: 0.92;
        letter-spacing: -0.07em;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 1.08rem;
        line-height: 1.8;
      }
      .actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 28px;
      }
      .ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 22px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: white;
        color: var(--primary);
        font-weight: 800;
      }
      .spotlight {
        padding: 28px;
        background: linear-gradient(160deg, #0f172a 0%, #1d4ed8 55%, #f59e0b 160%);
        color: white;
      }
      .spotlight .label {
        color: rgba(255,255,255,0.72);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        font-weight: 800;
      }
      .spotlight h2 {
        margin: 14px 0 12px;
        font-size: 2rem;
        line-height: 1;
        letter-spacing: -0.05em;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }
      .metric {
        border-radius: 22px;
        background: rgba(255,255,255,0.12);
        padding: 18px;
      }
      .metric strong {
        display: block;
        font-size: 1.4rem;
      }
      .metric span {
        display: block;
        margin-top: 8px;
        color: rgba(255,255,255,0.75);
        font-size: 0.92rem;
      }
      .section-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }
      .section-card {
        padding: 24px;
      }
      .section-card h3 {
        margin: 0 0 12px;
        font-size: 1.2rem;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }
      .section-kicker {
        display: inline-flex;
        margin-bottom: 14px;
        color: var(--secondary);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      @media (max-width: 980px) {
        .header, .hero {
          grid-template-columns: 1fr;
          flex-direction: column;
          align-items: flex-start;
        }
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="frame">
        <header class="header">
          <div class="brand">
            <div class="brand-mark">✦</div>
            <div>Ledgerlane</div>
          </div>
          <nav class="nav">${nav}</nav>
          <a class="cta" href="${ctaHref}">${ctaLabel}</a>
        </header>
        <main class="main">
          <section class="hero">
            <div class="card hero-copy">
              <span class="eyebrow">${eyebrow}</span>
              <h1>${title}</h1>
              <p>${description}</p>
              <div class="actions">
                <a class="cta" href="${ctaHref}">${ctaLabel}</a>
                <a class="ghost" href="/contact">Talk to the team</a>
              </div>
            </div>
            <aside class="card spotlight">
              <div class="label">${kicker}</div>
              <h2>Default preview sample</h2>
              <p style="color: rgba(255,255,255,0.8);">This is a polished starter preview so the canvas feels alive before generation. Once you generate, this gets replaced with the real site HTML.</p>
              <div class="metrics">
                <div class="metric">
                  <strong>Automated</strong>
                  <span>Bookkeeping flows that feel calmer and faster.</span>
                </div>
                <div class="metric">
                  <strong>Founder-ready</strong>
                  <span>Clear reporting without spreadsheet chaos.</span>
                </div>
              </div>
            </aside>
          </section>
          <section class="section-grid">
            <article class="card section-card">
              <span class="section-kicker">Workflow</span>
              <h3>Capture invoices and payments in one cleaner loop.</h3>
              <p>Keep money movement visible without bouncing between tools.</p>
            </article>
            <article class="card section-card">
              <span class="section-kicker">Reporting</span>
              <h3>Understand cash health at a glance.</h3>
              <p>Make faster calls with founder-friendly summaries and less admin drag.</p>
            </article>
            <article class="card section-card">
              <span class="section-kicker">Trust</span>
              <h3>Present your financial operations with more confidence.</h3>
              <p>The preview sets the tone even before the custom site is generated.</p>
            </article>
          </section>
        </main>
      </div>
    </div>
  </body>
</html>`;
}

export const demoGeneratedSite: AIGenerationResponse = {
  contentPlan: {
    brand: "Ledgerlane",
    tagline: "Financial clarity for freelancers who want premium control without spreadsheet chaos.",
    audience:
      "Freelancers and small creative studios that need trustworthy financial workflows and a polished brand presence.",
    productPositioning:
      "Ledgerlane is positioned as a premium bookkeeping assistant that combines trustworthy financial operations with a modern founder-friendly experience.",
    tone: "Credible, polished, and high-trust",
    keyFeatures: [
      {
        title: "Automated reconciliation",
        description: "Reduce manual bookkeeping effort and keep records current without spreadsheet cleanup.",
      },
      {
        title: "Client cash visibility",
        description: "Track invoices, payments, and overdue revenue in one clearer operating view.",
      },
      {
        title: "Founder-level reporting",
        description: "Give solo operators better clarity on business health without needing a finance team.",
      },
    ],
    ctaDirection: "Drive visitors toward starting a free trial or booking a guided walkthrough.",
    pricingDirection:
      "Use clear tiered pricing with a recommended middle plan and a higher-touch option for growing studios.",
    testimonialsAppropriate: true,
    bestOutputMode: "Multi Page",
    styleDirection: "Editorial typography, premium spacing, and a confident product-forward layout.",
    palette: ["#0F172A", "#2563EB", "#F8FAFC", "#F59E0B"],
    templateType: "SAAS",
    siteMap: ["Home", "Features", "Pricing", "About", "Contact", "FAQ"],
  },
  brand: "Ledgerlane",
  tagline: "Financial clarity for freelancers who want premium control without spreadsheet chaos.",
  audience:
    "Freelancers and small creative studios that need trustworthy financial workflows and a polished brand presence.",
  productPositioning:
    "Ledgerlane is positioned as a premium bookkeeping assistant that combines trustworthy financial operations with a modern founder-friendly experience.",
  tone: "Credible, polished, and high-trust",
  styleDirection: "Editorial typography, premium spacing, and a confident product-forward layout.",
  keyFeatures: [
    {
      title: "Automated reconciliation",
      description: "Reduce manual bookkeeping effort and keep records current without spreadsheet cleanup.",
    },
    {
      title: "Client cash visibility",
      description: "Track invoices, payments, and overdue revenue in one clearer operating view.",
    },
    {
      title: "Founder-level reporting",
      description: "Give solo operators better clarity on business health without needing a finance team.",
    },
  ],
  ctaDirection: "Drive visitors toward starting a free trial or booking a guided walkthrough.",
  pricingDirection:
    "Use clear tiered pricing with a recommended middle plan and a higher-touch option for growing studios.",
  testimonialsAppropriate: true,
  bestOutputMode: "Multi Page",
  palette: ["#0F172A", "#2563EB", "#F8FAFC", "#F59E0B"],
  templateType: "SAAS",
  siteMap: ["Home", "Features", "Pricing", "About", "Contact", "FAQ"],
  pages: [
    {
      slug: "home",
      title: "Home",
      purpose: "Primary conversion page introducing the product, audience fit, and value proposition.",
      sections: [
        {
          id: "hero",
          type: "hero",
          title: "Run your studio finances without spreadsheet chaos.",
          description:
            "Ledgerlane helps freelancers and small studios automate bookkeeping, keep cleaner records, and launch a more credible financial workflow.",
          ctaLabel: "Start free",
        },
        {
          id: "features-home",
          type: "features",
          title: "Everything your finance workflow needs to feel polished and under control.",
          description:
            "Structured automations, clearer reporting, and better day-to-day visibility give you more confidence in every decision.",
        },
        {
          id: "testimonials-home",
          type: "social-proof",
          title: "Proof that the workflow feels calmer, faster, and more trustworthy.",
          description:
            "Customer confidence, reduced admin drag, and clearer reporting make social proof highly relevant here.",
        },
        {
          id: "cta-home",
          type: "cta",
          title: "Start with a better financial operating system.",
          description:
            "Move from scattered admin to one focused workspace built for modern freelancers and lean teams.",
          ctaLabel: "Book a walkthrough",
        },
      ],
    },
    {
      slug: "features",
      title: "Features",
      purpose: "Detailed product page showing workflow, automation, and value delivery.",
      sections: [
        {
          id: "features-hero",
          type: "hero",
          title: "Features built for independent teams who need clarity fast.",
          description:
            "Explore how Ledgerlane streamlines bookkeeping, reporting, invoicing, and decision-making.",
          ctaLabel: "Explore the workflow",
        },
        {
          id: "workflow",
          type: "how-it-works",
          title: "A clearer workflow from invoice to insight.",
          description:
            "The product organizes repetitive finance work into a guided operating system instead of scattered manual tasks.",
        },
        {
          id: "features-list",
          type: "features",
          title: "The core capabilities that reduce overhead and increase confidence.",
          description:
            "Automated reconciliation, cash visibility, and reporting combine into one premium product experience.",
        },
        {
          id: "features-cta",
          type: "cta",
          title: "See how the system fits your operating flow.",
          description:
            "Use a guided walkthrough to evaluate where the most immediate value shows up for your team.",
          ctaLabel: "See it in action",
        },
      ],
    },
    {
      slug: "pricing",
      title: "Pricing",
      purpose: "Plan selection page focused on simple comparison and conversion.",
      sections: [
        {
          id: "pricing-hero",
          type: "hero",
          title: "Simple pricing for freelancers and growing studios.",
          description:
            "Choose a plan that matches your current stage without overbuying complexity too early.",
          ctaLabel: "Compare plans",
        },
        {
          id: "pricing-main",
          type: "pricing",
          title: "Pricing that supports growth without hidden complexity.",
          description:
            "A strong middle plan should be the default recommendation, with room to expand into more advanced support.",
        },
        {
          id: "pricing-faq",
          type: "faq",
          title: "Answer the pricing questions that usually block conversion.",
          description:
            "Clarify billing, onboarding, and upgrade paths so users can make a faster decision.",
        },
      ],
    },
    {
      slug: "about",
      title: "About",
      purpose: "Brand story and trust-building page explaining mission and product philosophy.",
      sections: [
        {
          id: "about-hero",
          type: "hero",
          title: "A bookkeeping product built to feel more modern, calm, and trustworthy.",
          description:
            "Ledgerlane exists to help independent teams build healthier financial habits without losing momentum to admin work.",
          ctaLabel: "Why we built it",
        },
        {
          id: "about-story",
          type: "features",
          title: "A product story grounded in trust, visibility, and modern workflows.",
          description:
            "The brand is positioned to feel premium and capable while still approachable for non-finance experts.",
        },
        {
          id: "about-cta",
          type: "cta",
          title: "Bring calmer financial workflows into your business.",
          description:
            "Use the product to reduce admin burden and create more decision-making confidence.",
          ctaLabel: "Get started",
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      purpose: "High-intent page for demos, support questions, and sales conversations.",
      sections: [
        {
          id: "contact-hero",
          type: "hero",
          title: "Talk to the team behind Ledgerlane.",
          description:
            "Reach out for onboarding support, product questions, or a guided walkthrough of the workflow.",
          ctaLabel: "Contact us",
        },
        {
          id: "contact-main",
          type: "contact",
          title: "Start the conversation with the right next step.",
          description:
            "Whether the need is sales, support, or onboarding, the contact page should route people clearly and quickly.",
        },
      ],
    },
    {
      slug: "faq",
      title: "FAQ",
      purpose: "Support page for objections, setup questions, and trust signals.",
      sections: [
        {
          id: "faq-hero",
          type: "hero",
          title: "Questions people ask before they commit.",
          description:
            "Use this page to remove hesitation around workflow fit, onboarding, and product confidence.",
          ctaLabel: "Get answers",
        },
        {
          id: "faq-main",
          type: "faq",
          title: "The practical details that reduce friction.",
          description:
            "A strong FAQ supports conversion by answering what buyers need before moving forward.",
        },
      ],
    },
  ],
  sections: [],
  htmlByPage: {
    home: buildDemoHtml({
      slug: "home",
      title: "Run your studio finances without spreadsheet chaos.",
      description: "Financial clarity for freelancers who want premium control without spreadsheet chaos.",
      kicker: "Editorial starter preview",
      eyebrow: "Default sample site",
      ctaLabel: "Start free",
      ctaHref: "/pricing",
    }),
    features: buildDemoHtml({
      slug: "features",
      title: "Features built for independent teams who need clarity fast.",
      description: "Explore Ledgerlane features for modern finance workflows.",
      kicker: "Workflow overview",
      eyebrow: "Default sample site",
      ctaLabel: "Explore the workflow",
      ctaHref: "/features",
    }),
    pricing: buildDemoHtml({
      slug: "pricing",
      title: "Simple pricing for freelancers and growing studios.",
      description: "Review Ledgerlane pricing for freelancers and growing studios.",
      kicker: "Pricing starter",
      eyebrow: "Default sample site",
      ctaLabel: "Compare plans",
      ctaHref: "/pricing",
    }),
    about: buildDemoHtml({
      slug: "about",
      title: "A bookkeeping product built to feel modern, calm, and trustworthy.",
      description: "Learn why Ledgerlane was built for modern operators.",
      kicker: "Brand story",
      eyebrow: "Default sample site",
      ctaLabel: "Why we built it",
      ctaHref: "/about",
    }),
    contact: buildDemoHtml({
      slug: "contact",
      title: "Talk to the team behind Ledgerlane.",
      description: "Talk to the Ledgerlane team about onboarding and support.",
      kicker: "High-intent contact",
      eyebrow: "Default sample site",
      ctaLabel: "Contact us",
      ctaHref: "/contact",
    }),
    faq: buildDemoHtml({
      slug: "faq",
      title: "Questions people ask before they commit.",
      description: "Get quick answers about Ledgerlane setup and workflow fit.",
      kicker: "Support preview",
      eyebrow: "Default sample site",
      ctaLabel: "Get answers",
      ctaHref: "/faq",
    }),
  },
  domainSuggestions: ["ledgerlane.ai", "useledgerlane.com", "ledgerlanehq.com"],
  notes: [
    "Planning-first generation completed before rendering pages.",
    "Preview rendered safely with reusable React sections.",
  ],
};
