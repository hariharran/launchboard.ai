export type SiteSection = {
  id: string;
  type: "hero" | "features" | "social-proof" | "pricing" | "faq" | "cta";
  headline: string;
  body: string;
  ctaLabel?: string;
};

export type GeneratedSite = {
  projectName: string;
  description: string;
  theme: "light";
  sections: SiteSection[];
};
