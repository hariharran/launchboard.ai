import type { AIGenerationResponse, OutputModeSelection, StyleSelection } from "@/types/ai";
import type { SeoSummary } from "@/lib/seo/checker";

export type PersistedEditHistory = {
  id: string;
  changeType: string;
  prompt: string | null;
  createdAt: string;
};

export type PersistedDomainCheck = {
  id: string;
  domain: string;
  extension: string;
  fullDomain: string;
  availability: string;
  price: number | null;
  isPremium: boolean;
  checkedAt: string;
};

export type SaveGeneratedProjectInput = {
  projectId?: string;
  startupIdea: string;
  styleSelection: StyleSelection;
  outputMode: OutputModeSelection;
  generatedSite: AIGenerationResponse;
  changeType?: string;
  changePrompt?: string;
};

export type PersistedProjectSummary = {
  id: string;
  startupIdea: string;
  selectedStyle: string | null;
  deployedUrl: string | null;
  brandName: string | null;
  tagline: string | null;
  templateType: string;
  outputMode: string;
  seoScore: number | null;
  updatedAt: string;
  createdAt: string;
};

export type PersistedGeneratedPage = {
  id: string;
  slug: string;
  title: string;
  html: string;
  structureJson: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PersistedProjectDetail = PersistedProjectSummary & {
  audience: string | null;
  tone: string | null;
  styleDirection: string | null;
  preferredDomain: string | null;
  deployedUrl: string | null;
  seoSummary: SeoSummary | null;
  palette: unknown;
  siteMap: unknown;
  aiMetadata: unknown;
  pages: PersistedGeneratedPage[];
  domainChecks: PersistedDomainCheck[];
  editHistory: PersistedEditHistory[];
};
