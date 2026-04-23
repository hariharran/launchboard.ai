import {
  Prisma,
  OutputMode,
  TemplateType,
  type Project,
  type GeneratedPage,
  type EditHistory,
  type DomainCheck,
} from "@prisma/client";

import type {
  AIGenerationResponse,
  AIGeneratedPage,
  OutputModeSelection,
} from "@/types/ai";
import type {
  PersistedGeneratedPage,
  PersistedEditHistory,
  PersistedDomainCheck,
  PersistedProjectDetail,
  PersistedProjectSummary,
} from "@/types/project";

export function mapOutputMode(selection: OutputModeSelection): OutputMode {
  if (selection === "Multi Page") {
    return OutputMode.MULTI_PAGE;
  }

  if (selection === "Single Page") {
    return OutputMode.LANDING_PAGE;
  }

  return OutputMode.LANDING_PAGE;
}

export function mapTemplateType(templateType: string): TemplateType {
  if (templateType in TemplateType) {
    return TemplateType[templateType as keyof typeof TemplateType];
  }

  return TemplateType.CUSTOM;
}

export function serializeGeneratedPage(page: AIGeneratedPage, htmlByPage: Record<string, string>) {
  return {
    slug: page.slug,
    title: page.title,
    html: htmlByPage[page.slug] ?? "",
    structureJson: page,
    aiMetadata: {
      purpose: page.purpose,
      sections: page.sections,
    },
  };
}

export function mapProjectSummary(project: Project): PersistedProjectSummary {
  return {
    id: project.id,
    startupIdea: project.startupIdea,
    selectedStyle: project.selectedStyle,
    deployedUrl: project.deployedUrl ?? null,
    brandName: project.brandName,
    tagline: project.tagline,
    templateType: project.templateType,
    outputMode: project.outputMode,
    seoScore: project.seoScore,
    updatedAt: project.updatedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
  };
}

export function mapGeneratedPage(page: GeneratedPage): PersistedGeneratedPage {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    html: page.html,
    structureJson: page.structureJson,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function mapEditHistoryEntry(entry: EditHistory): PersistedEditHistory {
  return {
    id: entry.id,
    changeType: entry.changeType,
    prompt: entry.prompt,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function mapDomainCheckEntry(entry: DomainCheck): PersistedDomainCheck {
  return {
    id: entry.id,
    domain: entry.domain,
    extension: entry.extension,
    fullDomain: `${entry.domain}${entry.extension}`,
    availability: entry.availability,
    price: entry.price ?? null,
    isPremium: entry.isPremium,
    checkedAt: entry.checkedAt.toISOString(),
  };
}

export function mapProjectDetail(
  project: Project & {
    generatedPages: GeneratedPage[];
    editHistory?: EditHistory[];
    domainChecks?: DomainCheck[];
  },
): PersistedProjectDetail {
  return {
    ...mapProjectSummary(project),
    audience: project.audience,
    tone: project.tone,
    styleDirection: project.styleDirection,
    preferredDomain: project.preferredDomain ?? null,
    deployedUrl: project.deployedUrl ?? null,
    seoSummary: (project.seoSummary as PersistedProjectDetail["seoSummary"]) ?? null,
    palette: project.palette,
    siteMap: project.siteMap,
    aiMetadata: project.aiMetadata,
    pages: project.generatedPages.map(mapGeneratedPage),
    domainChecks: (project.domainChecks ?? []).map(mapDomainCheckEntry),
    editHistory: (project.editHistory ?? []).map(mapEditHistoryEntry),
  };
}

export function buildProjectSnapshot(
  project: Project & {
    generatedPages: GeneratedPage[];
    editHistory?: EditHistory[];
    domainChecks?: DomainCheck[];
  },
) {
  return {
    project: mapProjectDetail(project),
    savedAt: new Date().toISOString(),
  } as Prisma.InputJsonValue;
}

export function getSeoScore(generatedSite: AIGenerationResponse) {
  const base = 78;
  const featureBonus = Math.min(generatedSite.keyFeatures.length * 4, 12);
  const pageBonus = Math.min(generatedSite.pages.length * 2, 10);

  return base + featureBonus + pageBonus;
}
