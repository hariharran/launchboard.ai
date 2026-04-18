export const styleSelections = [
  "Auto",
  "Minimal",
  "Bold",
  "Premium",
  "Playful",
] as const;

export const outputModes = ["Auto", "Single Page", "Multi Page"] as const;

export type StyleSelection = (typeof styleSelections)[number];
export type OutputModeSelection = (typeof outputModes)[number];

export type AIGeneratedSection = {
  id: string;
  type: string;
  title: string;
  description: string;
  ctaLabel?: string;
};

export type AIInferredFeature = {
  title: string;
  description: string;
};

export type AIContentPlan = {
  brand: string;
  tagline: string;
  audience: string;
  productPositioning: string;
  tone: string;
  keyFeatures: AIInferredFeature[];
  ctaDirection: string;
  pricingDirection: string;
  testimonialsAppropriate: boolean;
  bestOutputMode: OutputModeSelection;
  styleDirection: string;
  palette: string[];
  templateType: string;
  siteMap: string[];
};

export type AIGeneratedPage = {
  slug: string;
  title: string;
  purpose: string;
  sections: AIGeneratedSection[];
};

export type AIProjectSnapshot = {
  contentPlan?: AIContentPlan;
  brand?: string;
  tagline?: string;
  audience?: string;
  productPositioning?: string;
  tone?: string;
  styleDirection?: string;
  keyFeatures?: AIInferredFeature[];
  ctaDirection?: string;
  pricingDirection?: string;
  testimonialsAppropriate?: boolean;
  bestOutputMode?: OutputModeSelection;
  palette?: string[];
  templateType?: string;
  siteMap?: string[];
  pages?: AIGeneratedPage[];
  sections?: AIGeneratedSection[];
  htmlByPage?: Record<string, string>;
  domainSuggestions?: string[];
  notes?: string[];
};

export type InitialGenerationInput = {
  startupIdea: string;
  styleSelection: StyleSelection;
  outputMode: OutputModeSelection;
  palette?: string[] | null;
  existingProjectData?: AIProjectSnapshot | null;
};

export type PromptEditInput = {
  startupIdea: string;
  styleSelection: StyleSelection;
  outputMode: OutputModeSelection;
  palette?: string[] | null;
  existingProjectData: AIProjectSnapshot;
  editInstructions: string;
};

export type SectionRegenerationInput = {
  startupIdea: string;
  styleSelection: StyleSelection;
  outputMode: OutputModeSelection;
  palette?: string[] | null;
  existingProjectData: AIProjectSnapshot;
  sectionId: string;
  editInstructions?: string;
};

export type AIGenerationResponse = {
  contentPlan: AIContentPlan;
  brand: string;
  tagline: string;
  audience: string;
  productPositioning: string;
  tone: string;
  styleDirection: string;
  keyFeatures: AIInferredFeature[];
  ctaDirection: string;
  pricingDirection: string;
  testimonialsAppropriate: boolean;
  bestOutputMode: OutputModeSelection;
  palette: string[];
  templateType: string;
  siteMap: string[];
  pages: AIGeneratedPage[];
  sections: AIGeneratedSection[];
  htmlByPage: Record<string, string>;
  domainSuggestions: string[];
  notes: string[];
};

export type AIActionResult =
  | {
      ok: true;
      data: AIGenerationResponse;
    }
  | {
      ok: false;
      error: string;
      details?: string[];
    };
