import type { AIGenerationResponse } from "@/types/ai";

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
    home: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | Home</title><meta name="description" content="Financial clarity for freelancers who want premium control without spreadsheet chaos." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>Ledgerlane</h1><p>Home preview</p><img src="/placeholder-home.png" alt="Ledgerlane home preview" /></section></main></body></html>',
    features: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | Features</title><meta name="description" content="Explore Ledgerlane features for modern finance workflows." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>Features</h1><p>Features preview</p><img src="/placeholder-features.png" alt="Ledgerlane features preview" /></section></main></body></html>',
    pricing: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | Pricing</title><meta name="description" content="Review Ledgerlane pricing for freelancers and growing studios." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>Pricing</h1><p>Pricing preview</p><img src="/placeholder-pricing.png" alt="Ledgerlane pricing preview" /></section></main></body></html>',
    about: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | About</title><meta name="description" content="Learn why Ledgerlane was built for modern operators." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>About</h1><p>About preview</p><img src="/placeholder-about.png" alt="Ledgerlane about preview" /></section></main></body></html>',
    contact: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | Contact</title><meta name="description" content="Talk to the Ledgerlane team about onboarding and support." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>Contact</h1><p>Contact preview</p><img src="/placeholder-contact.png" alt="Ledgerlane contact preview" /></section></main></body></html>',
    faq: '<!DOCTYPE html><html lang="en"><head><title>Ledgerlane | FAQ</title><meta name="description" content="Get quick answers about Ledgerlane setup and workflow fit." /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><main><section><h1>FAQ</h1><p>FAQ preview</p><img src="/placeholder-faq.png" alt="Ledgerlane FAQ preview" /></section></main></body></html>',
  },
  domainSuggestions: ["ledgerlane.ai", "useledgerlane.com", "ledgerlanehq.com"],
  notes: [
    "Planning-first generation completed before rendering pages.",
    "Preview rendered safely with reusable React sections.",
  ],
};
