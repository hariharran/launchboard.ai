"use server";

import { Prisma, ChangeType, ProjectStatus } from "@prisma/client";

import { requireCurrentDbUser } from "@/lib/auth";
import {
  generateDomainSuggestions,
  searchCustomDomain,
  type DomainSuggestionResult,
} from "@/lib/domain/service";
import { hasDatabaseEnv } from "@/lib/env";
import {
  buildProjectSnapshot,
  getSeoScore,
  mapDomainCheckEntry,
  mapOutputMode,
  mapProjectDetail,
  mapProjectSummary,
  mapTemplateType,
  serializeGeneratedPage,
} from "@/lib/project-mapper";
import { prisma } from "@/lib/prisma";
import type {
  PersistedProjectDetail,
  PersistedProjectSummary,
  SaveGeneratedProjectInput,
} from "@/types/project";
import type { SeoSummary } from "@/lib/seo/checker";

function toDomainCreateInput(projectId: string, result: DomainSuggestionResult) {
  return {
    projectId,
    domain: result.domain,
    extension: result.extension,
    availability: result.availability,
    price: result.price,
    isPremium: result.isPremium,
    checkedAt: new Date(),
  };
}

function buildDomainCreateInputs(projectId: string, results: DomainSuggestionResult[]) {
  return results.map((result) => toDomainCreateInput(projectId, result));
}

async function requirePersistenceContext() {
  if (!hasDatabaseEnv) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return requireCurrentDbUser();
}

async function getAutoDomainSuggestions(
  startupIdea: string,
  generatedSite: SaveGeneratedProjectInput["generatedSite"],
) {
  try {
    return await generateDomainSuggestions(startupIdea, generatedSite);
  } catch {
    return [];
  }
}

export async function listProjectsForCurrentUser(): Promise<PersistedProjectSummary[]> {
  const dbUser = await requirePersistenceContext();

  const projects = await prisma.project.findMany({
    where: {
      userId: dbUser.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects.map(mapProjectSummary);
}

export async function getProjectForCurrentUser(
  projectId: string,
): Promise<PersistedProjectDetail | null> {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return mapProjectDetail(project);
}

export async function saveGeneratedProject(
  input: SaveGeneratedProjectInput,
): Promise<PersistedProjectDetail> {
  const dbUser = await requirePersistenceContext();
  const seoScore = getSeoScore(input.generatedSite);
  const generatedDomainSuggestions = await getAutoDomainSuggestions(
    input.startupIdea,
    input.generatedSite,
  );

  const projectData = {
    startupIdea: input.startupIdea,
    selectedStyle: input.styleSelection,
    brandName: input.generatedSite.brand,
    tagline: input.generatedSite.tagline,
    audience: input.generatedSite.audience,
    tone: input.generatedSite.tone,
    styleDirection: input.generatedSite.styleDirection,
    palette: input.generatedSite.palette,
    templateType: mapTemplateType(input.generatedSite.templateType),
    outputMode: mapOutputMode(input.outputMode),
    siteMap: input.generatedSite.siteMap,
    seoScore,
    aiMetadata: input.generatedSite,
    status: ProjectStatus.GENERATED,
  };

  let project = input.projectId
    ? await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: dbUser.id,
        },
        include: {
          domainChecks: true,
          editHistory: true,
          generatedPages: true,
        },
      })
    : null;

  if (!project) {
    const createdProjectId = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          userId: dbUser.id,
          ...projectData,
        },
      });

      await tx.generatedPage.createMany({
        data: input.generatedSite.pages.map((page) => ({
          projectId: createdProject.id,
          ...serializeGeneratedPage(page, input.generatedSite.htmlByPage),
        })),
      });

      const domainInputs = buildDomainCreateInputs(createdProject.id, generatedDomainSuggestions);

      if (domainInputs.length > 0) {
        await tx.domainCheck.createMany({
          data: domainInputs,
        });
      }

      await tx.editHistory.create({
        data: {
          projectId: createdProject.id,
          changeType:
            (input.changeType as ChangeType | undefined) ?? ChangeType.INITIAL_GENERATION,
          prompt: input.changePrompt ?? input.startupIdea,
          snapshot: input.generatedSite,
        },
      });

      return createdProject.id;
    });

    const savedProject = await prisma.project.findUniqueOrThrow({
      where: {
        id: createdProjectId,
      },
      include: {
        domainChecks: {
          orderBy: {
            checkedAt: "desc",
          },
        },
        editHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
        generatedPages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return mapProjectDetail(savedProject);
  }

  await prisma.$transaction(async (tx) => {
    await tx.editHistory.create({
      data: {
        projectId: project.id,
        changeType:
          (input.changeType as ChangeType | undefined) ?? ChangeType.CONTENT_EDIT,
        prompt: input.changePrompt ?? input.startupIdea,
        snapshot: buildProjectSnapshot(project),
      },
    });

    await tx.generatedPage.deleteMany({
      where: {
        projectId: project.id,
      },
    });

    await tx.domainCheck.deleteMany({
      where: {
        projectId: project.id,
      },
    });

    await tx.project.update({
      where: {
        id: project.id,
      },
      data: projectData,
    });

    await tx.generatedPage.createMany({
      data: input.generatedSite.pages.map((page) => ({
        projectId: project.id,
        ...serializeGeneratedPage(page, input.generatedSite.htmlByPage),
      })),
    });

    const domainInputs = buildDomainCreateInputs(project.id, generatedDomainSuggestions);

    if (domainInputs.length > 0) {
      await tx.domainCheck.createMany({
        data: domainInputs,
      });
    }
  });

  const updatedProject = await prisma.project.findUniqueOrThrow({
    where: {
      id: project.id,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(updatedProject);
}

export async function duplicateProjectForCurrentUser(
  projectId: string,
): Promise<PersistedProjectDetail> {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
    include: {
      domainChecks: true,
      editHistory: true,
      generatedPages: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const duplicatedProject = await prisma.project.create({
    data: {
      userId: dbUser.id,
      startupIdea: project.startupIdea,
      selectedStyle: project.selectedStyle,
      preferredDomain: project.preferredDomain,
      brandName: project.brandName ? `${project.brandName} Copy` : "Untitled Copy",
      tagline: project.tagline,
      audience: project.audience,
      tone: project.tone,
      styleDirection: project.styleDirection,
      palette: project.palette,
      templateType: project.templateType,
      outputMode: project.outputMode,
      siteMap: project.siteMap,
      seoScore: project.seoScore,
      aiMetadata: project.aiMetadata,
      status: project.status,
    },
  });

  if (project.generatedPages.length > 0) {
    await prisma.generatedPage.createMany({
      data: project.generatedPages.map((page) => ({
        projectId: duplicatedProject.id,
        slug: page.slug,
        title: page.title,
        html: page.html,
        structureJson: page.structureJson as Prisma.InputJsonValue,
        aiMetadata: (page.aiMetadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      })),
    });
  }

  if (project.domainChecks.length > 0) {
    await prisma.domainCheck.createMany({
      data: project.domainChecks.map((entry) => ({
        projectId: duplicatedProject.id,
        domain: entry.domain,
        extension: entry.extension,
        availability: entry.availability,
        price: entry.price,
        isPremium: entry.isPremium,
        checkedAt: entry.checkedAt,
      })),
    });
  }

  await prisma.editHistory.create({
    data: {
      projectId: duplicatedProject.id,
      changeType: ChangeType.MANUAL_OVERRIDE,
      prompt: `Duplicated from project ${project.id}`,
      snapshot: buildProjectSnapshot(project),
    },
  });

  const savedProject = await prisma.project.findUniqueOrThrow({
    where: {
      id: duplicatedProject.id,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(savedProject);
}

export async function deleteProjectForCurrentUser(projectId: string): Promise<void> {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.domainCheck.deleteMany({
      where: {
        projectId,
      },
    });

    await tx.editHistory.deleteMany({
      where: {
        projectId,
      },
    });

    await tx.generatedPage.deleteMany({
      where: {
        projectId,
      },
    });

    await tx.project.delete({
      where: {
        id: projectId,
      },
    });
  });
}

export async function refreshProjectDomainsForCurrentUser(
  projectId: string,
  customQuery?: string,
) {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const aiMetadata = project.aiMetadata as SaveGeneratedProjectInput["generatedSite"] | null;

  if (!aiMetadata) {
    throw new Error("Project is missing generated site metadata.");
  }

  const results = customQuery?.trim()
    ? await searchCustomDomain(customQuery)
    : await generateDomainSuggestions(project.startupIdea, aiMetadata);

  if (customQuery?.trim()) {
    const domainInputs = buildDomainCreateInputs(project.id, results);

    if (domainInputs.length > 0) {
      await prisma.domainCheck.createMany({
        data: domainInputs,
      });
    }
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.domainCheck.deleteMany({
        where: {
          projectId: project.id,
        },
      });

      const domainInputs = buildDomainCreateInputs(project.id, results);

      if (domainInputs.length > 0) {
        await tx.domainCheck.createMany({
          data: domainInputs,
        });
      }
    });
  }

  const updatedProject = await prisma.project.findUniqueOrThrow({
    where: {
      id: project.id,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(updatedProject);
}

export async function savePreferredDomainForCurrentUser(
  projectId: string,
  fullDomain: string,
) {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
    include: {
      domainChecks: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const match = project.domainChecks.find(
    (entry) => `${entry.domain}${entry.extension}` === fullDomain,
  );

  if (!match) {
    throw new Error("Domain must exist in saved checks before it can be preferred.");
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      preferredDomain: fullDomain,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(updatedProject);
}

export async function saveDeploymentUrlForCurrentUser(
  projectId: string,
  deployedUrl: string,
) {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      deployedUrl,
      status: ProjectStatus.READY_TO_EXPORT,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(updatedProject);
}

export async function saveSeoSummaryForCurrentUser(
  projectId: string,
  summary: SeoSummary,
) {
  const dbUser = await requirePersistenceContext();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUser.id,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      seoScore: Math.round((summary.score / summary.total) * 100),
      seoSummary: summary,
    },
    include: {
      domainChecks: {
        orderBy: {
          checkedAt: "desc",
        },
      },
      editHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
      generatedPages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProjectDetail(updatedProject);
}

export async function getDashboardData() {
  const dbUser = await requirePersistenceContext();

  const [projects, totalCount, projectsThisWeek] = await Promise.all([
    prisma.project.findMany({
      where: { userId: dbUser.id },
      include: {
        domainChecks: {
          orderBy: { checkedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.project.count({
      where: { userId: dbUser.id },
    }),
    prisma.project.count({
      where: {
        userId: dbUser.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const latestProject = projects[0] ? await getProjectForCurrentUser(projects[0].id) : null;

  // Aggregate domains across all recent projects
  const recentDomains = projects.flatMap((p) =>
    (p as any).domainChecks.map((d: any) => ({
      ...mapDomainCheckEntry(d),
      projectName: p.brandName || "Untitled",
    }))
  ).slice(0, 6);

  return {
    projectCount: totalCount,
    projectsThisWeek,
    recentProjects: projects.slice(0, 3).map(mapProjectSummary),
    latestProject,
    recentDomains,
  };
}

