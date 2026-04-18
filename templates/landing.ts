import type { GeneratedSite } from "@/types/site";

export const landingTemplate: GeneratedSite = {
  projectName: "Launchboard AI",
  description: "An AI website generator for fast-moving founders and lean teams.",
  theme: "light",
  sections: [
    {
      id: "hero",
      type: "hero",
      headline: "Build your launch-ready site from a single idea.",
      body: "Generate polished structure, positioning, and copy in minutes.",
      ctaLabel: "Start building",
    },
    {
      id: "features",
      type: "features",
      headline: "Everything needed for the first strong draft.",
      body: "AI generation, editable layouts, domain search, and SEO guidance.",
    },
  ],
};
