"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
// import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Copy,
  RefreshCcw,
  Globe2,
  LayoutTemplate,
  LoaderCircle,
  PencilLine,
  Monitor,
  Smartphone,
  Maximize2,
  X,
  Sparkles,
  WandSparkles,
  ExternalLink,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { demoGeneratedSite } from "@/lib/demo-generated-site";
import { runSeoQuickCheck } from "@/lib/seo/checker";
import { cn } from "@/lib/utils";
import type { AIGenerationResponse, AIActionResult } from "@/types/ai";
import type { PersistedProjectDetail } from "@/types/project";

const styleOptions = ["Auto", "Minimal", "Bold", "Premium", "Playful"] as const;
const outputModes = ["Auto", "Single Page", "Multi Page"] as const;
const promptChips = [
  "AI finance co-pilot for startup founders raising their first round",
  "Premium longevity clinic for busy executives and creators",
  "Developer platform turning internal tools into client-ready portals",
  "Climate accounting software for modern manufacturing teams",
  "Playful travel club helping remote teams plan unforgettable retreats",
];
const loadingSteps = [
  "Understanding the idea",
  "Naming the brand",
  "Planning the site",
  "Writing the copy",
  "Styling the output",
  "Preparing preview",
] as const;

type GeneratorWorkspaceProps = {
  initialProject?: PersistedProjectDetail | null;
};

function mapPersistedProjectToGeneratedSite(project: PersistedProjectDetail): AIGenerationResponse {
  return project.aiMetadata as AIGenerationResponse;
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildPaletteCode(brand: string, palette: string[]) {
  const tokens = palette.map((color, index) => {
    const role =
      index === 0
        ? "brand-primary"
        : index === 1
          ? "brand-secondary"
          : index === 2
            ? "brand-accent"
            : index === 3
              ? "surface-base"
              : index === 4
                ? "surface-muted"
                : `palette-${index + 1}`;

    return `  --${role}: ${color};`;
  });

  return `/* ${brand || "Generated brand"} palette */\n:root {\n${tokens.join("\n")}\n}`;
}

function normalizePreviewSlug(pathname: string) {
  if (!pathname || pathname === "/") {
    return "home";
  }

  return pathname.replace(/^\/+|\/+$/g, "");
}

function getPreviewSlugFromHref(href: string, knownSlugs: string[]) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  try {
    const url = new URL(href, "https://preview.local");
    const slug = normalizePreviewSlug(url.pathname);
    return knownSlugs.includes(slug) ? slug : null;
  } catch {
    return null;
  }
}

function getPreviewHtml(site: AIGenerationResponse, activePageSlug: string) {
  const html = site.htmlByPage?.[activePageSlug] ?? site.htmlByPage?.home;

  if (!html?.trim()) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${site.brand}</title></head><body style="margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;display:grid;place-items:center;min-height:100vh;"><div style="padding:24px 28px;border-radius:20px;background:white;border:1px solid #e2e8f0;box-shadow:0 12px 32px rgba(15,23,42,0.08);">Preview is not available for this page yet.</div></body></html>`;
  }

  const previewEnhancer = `
    <style>
      .nav-link {
        border-radius: 999px !important;
        padding: 10px 14px !important;
        transition: color 180ms ease, opacity 180ms ease, background-color 180ms ease, box-shadow 180ms ease !important;
      }
      .nav-link-active {
        color: var(--brand-primary, #111827) !important;
        font-weight: 900 !important;
        background: color-mix(in srgb, var(--brand-secondary, #8B5CF6) 14%, white) !important;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-secondary, #8B5CF6) 18%, white) !important;
      }
    </style>
  `;

  if (html.includes("</head>")) {
    return html.replace("</head>", `${previewEnhancer}</head>`);
  }

  return `${previewEnhancer}${html}`;
}

function applyActivePreviewNav(frameDocument: Document, activePageSlug: string) {
  const expectedPath = activePageSlug === "home" ? "/" : `/${activePageSlug}`;
  const links = Array.from(frameDocument.querySelectorAll("a[href]"));

  links.forEach((link) => {
    if (!(link instanceof HTMLElement)) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href) {
      return;
    }

    try {
      const url = new URL(href, "https://preview.local");
      const isActive = url.pathname === expectedPath;

      if (isActive) {
        link.classList.add("nav-link-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("nav-link-active");
        link.removeAttribute("aria-current");
      }
    } catch {
      // Ignore invalid preview links.
    }
  });
}

function HtmlPreviewFrame({
  site,
  activePageSlug,
  onNavigateSlug,
  className,
}: {
  site: AIGenerationResponse;
  activePageSlug: string;
  onNavigateSlug: (slug: string) => void;
  className?: string;
}) {
  const srcDoc = useMemo(() => getPreviewHtml(site, activePageSlug), [site, activePageSlug]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const knownSlugs = useMemo(() => site.pages.map((page) => page.slug), [site.pages]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    const attachPreviewNavigation = () => {
      const frameWindow = iframe.contentWindow;
      const frameDocument = iframe.contentDocument;

      if (!frameWindow || !frameDocument) {
        return;
      }

      applyActivePreviewNav(frameDocument, activePageSlug);

      const clickHandler = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const targetElement =
          target.nodeType === Node.ELEMENT_NODE ? (target as Element) : target.parentElement;
        if (!targetElement) {
          return;
        }

        const anchor = targetElement.closest("a[href]");
        if (!(anchor instanceof HTMLElement)) {
          return;
        }

        const slug = getPreviewSlugFromHref(anchor.getAttribute("href") || "", knownSlugs);
        if (!slug) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onNavigateSlug(slug);
      };

      frameDocument.addEventListener("click", clickHandler, true);

      return () => {
        frameDocument.removeEventListener("click", clickHandler, true);
      };
    };

    let detach = attachPreviewNavigation();

    const loadHandler = () => {
      detach?.();
      detach = attachPreviewNavigation();
    };

    iframe.addEventListener("load", loadHandler);

    return () => {
      iframe.removeEventListener("load", loadHandler);
      detach?.();
    };
  }, [activePageSlug, knownSlugs, onNavigateSlug, srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      key={`${site.brand}-${activePageSlug}`}
      title={`${site.brand} preview`}
      srcDoc={srcDoc}
      className={cn("h-full w-full rounded-[32px] bg-white", className)}
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
    />
  );
}


function getStyleExplanation(style: (typeof styleOptions)[number], site: AIGenerationResponse) {
  const brand = site.brand || "the brand";

  switch (style) {
    case "Minimal":
      return `${brand} uses a restrained system with tighter copy, cleaner spacing, and fewer visual moves so the product feels focused and credible.`;
    case "Bold":
      return `${brand} leans into stronger contrast, sharper claims, and higher-energy sections to create momentum quickly for a demo or launch push.`;
    case "Premium":
      return `${brand} is framed with elevated typography, confident spacing, and richer brand cues so the experience feels high-trust and investment-ready.`;
    case "Playful":
      return `${brand} gets a brighter, friendlier presentation with more expressive language and lighter visual rhythm to feel approachable and memorable.`;
    case "Auto":
    default:
      return `The system matched ${brand} to a ${site.styleDirection.toLowerCase()} direction based on the audience, positioning, and conversion goals in your prompt.`;
  }
}

function getIdeaValidationMessage(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Add a startup idea before generating.";
  }

  if (trimmed.length < 12) {
    return "Add a bit more detail so the AI can infer a stronger brand and structure.";
  }

  if (trimmed.split(/\s+/).filter(Boolean).length < 3) {
    return "Include what the startup does and who it is for.";
  }

  return null;
}

function formatPaletteInput(palette: string[]) {
  return palette.join(", ");
}

function parsePaletteInput(value: string) {
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.toUpperCase())
    .filter((token) => /^#[0-9A-F]{6}$/.test(token));
}

function getPaletteValidationMessage(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const rawTokens = trimmed
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const parsedTokens = parsePaletteInput(trimmed);

  if (rawTokens.length !== parsedTokens.length) {
    return "Use comma-separated hex colors like #0B1020, #243B6B, #5B7CFF.";
  }

  if (parsedTokens.length < 4) {
    return "Add at least 4 colors so the site can derive surfaces, accents, and text balance.";
  }

  if (parsedTokens.length > 6) {
    return "Keep the palette to 6 colors or fewer.";
  }

  return null;
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function GeneratorWorkspace({ initialProject = null }: GeneratorWorkspaceProps) {
  const initialGeneratedSite =
    initialProject?.aiMetadata ? mapPersistedProjectToGeneratedSite(initialProject) : demoGeneratedSite;
  const initialPaletteInput = formatPaletteInput(initialGeneratedSite.palette);
  const [idea, setIdea] = useState(
    initialProject?.startupIdea ??
    "",
  );
  const [customPaletteInput, setCustomPaletteInput] = useState(
    initialProject ? initialPaletteInput : ""
  );
  const [selectedStyle, setSelectedStyle] =
    useState<(typeof styleOptions)[number]>(
      ((initialProject?.selectedStyle as (typeof styleOptions)[number] | null) ?? "Premium"),
    );
  const [selectedOutputMode, setSelectedOutputMode] =
    useState<(typeof outputModes)[number]>(
      initialProject?.outputMode === "MULTI_PAGE" ? "Multi Page" : "Single Page",
    );
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [hasCompletedGeneration, setHasCompletedGeneration] = useState(Boolean(initialProject));
  const [activePreviewPage, setActivePreviewPage] = useState("home");
  const [previewMode, setPreviewMode] = useState<"single" | "all">("single");
  const [previewDevice, setPreviewDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  // const [presentationMode, setPresentationMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<AIGenerationResponse>(initialGeneratedSite);
  const [savedProject, setSavedProject] = useState<PersistedProjectDetail | null>(initialProject);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(
    initialProject ? "Loaded saved project." : null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editPrompt, setEditPrompt] = useState("Make it more premium and add FAQ.");
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isRegeneratingVariation, setIsRegeneratingVariation] = useState(false);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [copiedView, setCopiedView] = useState<"code" | "structure" | null>(null);
  const [domainQuery, setDomainQuery] = useState("");
  const [isRefreshingDomains, setIsRefreshingDomains] = useState(false);
  const [savingPreferredDomain, setSavingPreferredDomain] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [vercelUrl, setVercelUrl] = useState<string | null>(initialProject?.deployedUrl ?? null);
  const [hasUndeployedChanges, setHasUndeployedChanges] = useState(false);
  const [suggestedDomains, setSuggestedDomains] = useState<{ name: string; price: string }[]>([]);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [deployStep, setDeployStep] = useState<"deploying" | "domains" | "configuration">("deploying");
  const [retryAction, setRetryAction] = useState<null | (() => void)>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployStep("deploying");
    setShowDeploySuccess(true);

    try {
      // Step 1: Real Deploy to Vercel
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site: generatedSite,
          brandName: generatedSite.brand,
          projectId: savedProject?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Deployment failed");
      }

      const { url, project } = await response.json();
      setVercelUrl(url);
      setHasUndeployedChanges(false);
      setCopiedUrl(false);
      if (project) {
        setSavedProject(project);
      }
      setWorkspaceMessage("Deployment URL saved to the project.");

      // Step 2: Check Domain Availability (Simulated)
      setDeployStep("domains");
      const brandSlug = generatedSite.brand.toLowerCase().replace(/\s+/g, "-");
      setSuggestedDomains([
        { name: `${brandSlug}.com`, price: "$12.99" },
        { name: `${brandSlug}.io`, price: "$49.00" },
        { name: `${brandSlug}.ai`, price: "$69.00" },
      ]);
    } catch (error) {
      console.error("Pipeline failed:", error);
      // Fallback url for safety in demo if API fails but show error
      setWorkspaceMessage(error instanceof Error ? error.message : "Deployment failed.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyDeployedUrl = async () => {
    if (!vercelUrl) return;
    try {
      await navigator.clipboard.writeText(vercelUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  useEffect(() => {
    if (savedProject?.deployedUrl) {
      setVercelUrl(savedProject.deployedUrl);
    }
  }, [savedProject?.deployedUrl]);
  const persistedSeoKeyRef = useRef<string | null>(null);
  const inferredPlan = generatedSite.contentPlan;
  const recommendedSections = Array.from(
    new Set(
      generatedSite.sections.length > 0
        ? generatedSite.sections.map((section) => section.type)
        : generatedSite.pages.flatMap((page) => page.sections.map((section) => section.type)),
    ),
  );
  const activePage = generatedSite.pages.find((page) => page.slug === activePreviewPage) ?? {
    slug: "home",
    title: "Home",
    purpose: "Preview placeholder",
    sections: [],
  };
  const orderedPreviewPages = generatedSite.pages.length > 0 ? generatedSite.pages : [activePage];
  const paletteCode = buildPaletteCode(generatedSite.brand, generatedSite.palette);
  const codeView = JSON.stringify(
    {
      brand: generatedSite.brand,
      tagline: generatedSite.tagline,
      palette: generatedSite.palette,
      paletteCss: paletteCode,
      templateType: generatedSite.templateType,
      siteMap: generatedSite.siteMap,
      pages: generatedSite.pages,
      htmlByPage: generatedSite.htmlByPage,
      projectFiles: generatedSite.projectFiles ?? {},
      notes: generatedSite.notes,
    },
    null,
    2,
  );
  const structureView = JSON.stringify(
    {
      siteMap: generatedSite.siteMap,
      templateType: generatedSite.templateType,
      pageList: generatedSite.pages.map((page) => ({
        slug: page.slug,
        title: page.title,
        purpose: page.purpose,
      })),
      sectionList: recommendedSections,
      metadata: {
        brand: generatedSite.brand,
        tagline: generatedSite.tagline,
        audience: generatedSite.audience,
        tone: generatedSite.tone,
        styleDirection: generatedSite.styleDirection,
        palette: generatedSite.palette,
        paletteCss: paletteCode,
        bestOutputMode: generatedSite.bestOutputMode,
        domainSuggestions: generatedSite.domainSuggestions,
        generatedProjectFiles: Object.keys(generatedSite.projectFiles ?? {}),
      },
    },
    null,
    2,
  );
  const domainChecks = savedProject?.domainChecks ?? [];
  const availableDomains = domainChecks.filter((item) => item.availability === "AVAILABLE");
  const takenDomains = domainChecks.filter((item) => item.availability === "TAKEN");
  const premiumDomains = domainChecks.filter((item) => item.isPremium || item.availability === "PREMIUM");
  const activePageHtml = generatedSite.htmlByPage[activePage.slug] ?? "<main></main>";


  const seoSummary = useMemo(
    () => runSeoQuickCheck(activePage.slug, activePageHtml),
    [activePage.slug, activePageHtml],
  );
  const exportBaseName = slugifyFileName(generatedSite.brand || "launchboard-site");
  const styleExplanation = getStyleExplanation(selectedStyle, generatedSite);
  const ideaValidationMessage = getIdeaValidationMessage(idea);
  const parsedCustomPalette = useMemo(
    () => parsePaletteInput(customPaletteInput),
    [customPaletteInput],
  );
  const paletteValidationMessage = getPaletteValidationMessage(customPaletteInput);
  const aiRequestPalette =
    customPaletteInput.trim().length > 0
      ? (!paletteValidationMessage && parsedCustomPalette.length ? parsedCustomPalette : undefined)
      : undefined;
  const previewFrameClassName =
    previewDevice === "Mobile"
      ? "mx-auto w-full max-w-sm"
      : previewDevice === "Tablet"
        ? "mx-auto w-full max-w-3xl"
        : "mx-auto w-full max-w-none";

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    if (activeStepIndex >= loadingSteps.length - 1) {
      const timeout = window.setTimeout(() => {
        setIsGenerating(false);
        setActiveStepIndex(loadingSteps.length - 1);
      }, 700);

      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      setActiveStepIndex((current) => current + 1);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [activeStepIndex, isGenerating]);

  useEffect(() => {
    if (!isGenerating || activeStepIndex < loadingSteps.length - 1) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const generationResponse = await fetch("/api/ai/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startupIdea: idea,
            styleSelection: selectedStyle,
            outputMode: selectedOutputMode,
            palette: aiRequestPalette,
          }),
        });

        const generationResult = await parseJsonSafely<AIActionResult>(generationResponse);

        if (!generationResponse.ok || !generationResult?.ok) {
          throw new Error(
            generationResult && !generationResult.ok
              ? generationResult.details?.[0] ?? generationResult.error
              : "The AI response could not be completed. Please try again.",
          );
        }

        setGeneratedSite(generationResult.data);
        setHasCompletedGeneration(true);
        setIsSaving(true);

        const saveResponse = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: savedProject?.id,
            startupIdea: idea,
            styleSelection: selectedStyle,
            outputMode: selectedOutputMode,
            generatedSite: generationResult.data,
          }),
        });

        const saveResult = await parseJsonSafely<{
          ok: boolean;
          data?: PersistedProjectDetail;
          error?: string;
        }>(saveResponse);

        if (!saveResponse.ok || !saveResult?.ok || !saveResult.data) {
          throw new Error(saveResult?.error ?? "Generated the site, but saving failed. Please retry.");
        }

        setSavedProject(saveResult.data);
        setRetryAction(null);
        setWorkspaceMessage("Generation complete and project saved successfully.");
      } catch (error) {
        setRetryAction(() => () => {
          startTransition(() => {
            setWorkspaceMessage(null);
            setRetryAction(null);
            setHasCompletedGeneration(false);
            setIsGenerating(true);
            setActiveStepIndex(0);
            setActivePreviewPage("home");
          });
        });
        setWorkspaceMessage(
          error instanceof Error
            ? error.message
            : "Generation failed unexpectedly. Please retry.",
        );
      } finally {
        setIsSaving(false);
        setIsGenerating(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    activeStepIndex,
    idea,
    isGenerating,
    savedProject?.id,
    selectedOutputMode,
    selectedStyle,
    aiRequestPalette,
  ]);

  function handleGenerate() {
    if (ideaValidationMessage) {
      setWorkspaceMessage(ideaValidationMessage);
      setRetryAction(null);
      return;
    }

    if (paletteValidationMessage) {
      setWorkspaceMessage(paletteValidationMessage);
      setRetryAction(null);
      return;
    }

    startTransition(() => {
      setWorkspaceMessage(null);
      setRetryAction(null);
      setHasCompletedGeneration(false);
      setIsGenerating(true);
      setActiveStepIndex(0);
      setActivePreviewPage("home");
      setHasUndeployedChanges(true);
      setCopiedUrl(false);
    });
  }

  function handleChipClick(value: string) {
    setIdea(value);
  }

  async function persistGeneratedSite(
    nextSite: AIGenerationResponse,
    changeType: string,
    changePrompt: string,
  ) {
    setIsSaving(true);

    try {
      const saveResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: savedProject?.id,
          startupIdea: idea,
          styleSelection: selectedStyle,
          outputMode: selectedOutputMode,
          generatedSite: nextSite,
          changeType,
          changePrompt,
        }),
      });

      const saveResult = await parseJsonSafely<{
        ok: boolean;
        data?: PersistedProjectDetail;
        error?: string;
      }>(saveResponse);

      if (!saveResponse.ok || !saveResult?.ok || !saveResult.data) {
        throw new Error(saveResult?.error ?? "Unable to save generated project.");
      }

      setSavedProject(saveResult.data);
      return saveResult.data;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApplyEdit() {
    if (!editPrompt.trim()) {
      setWorkspaceMessage("Add an edit instruction first.");
      setRetryAction(null);
      return;
    }

    setIsApplyingEdit(true);
    setWorkspaceMessage(null);

    try {
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupIdea: idea,
          styleSelection: selectedStyle,
          outputMode: selectedOutputMode,
          palette: aiRequestPalette,
          existingProjectData: generatedSite,
          editInstructions: editPrompt,
        }),
      });

      const result = await parseJsonSafely<AIActionResult>(response);

      if (!response.ok || !result?.ok) {
        throw new Error(
          result && !result.ok
            ? result.details?.[0] ?? result.error
            : "Unable to edit content right now. Please retry.",
        );
      }

      setGeneratedSite(result.data);
      setHasUndeployedChanges(true);
      setCopiedUrl(false);
      await persistGeneratedSite(result.data, "CONTENT_EDIT", editPrompt);
      setRetryAction(null);
      setWorkspaceMessage("Edit applied, preview updated, and history saved.");
    } catch (error) {
      setRetryAction(() => handleApplyEdit);
      setWorkspaceMessage(error instanceof Error ? error.message : "Unable to apply edit.");
    } finally {
      setIsApplyingEdit(false);
    }
  }

  async function handleRegenerateVariation() {
    setIsRegeneratingVariation(true);
    setWorkspaceMessage(null);

    try {
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupIdea: idea,
          styleSelection: selectedStyle,
          outputMode: selectedOutputMode,
          palette: aiRequestPalette,
          existingProjectData: generatedSite,
          editInstructions:
            "Create a fresh variation of this site. Keep the product strategy and overall structure stable, but introduce a new creative angle, stronger copy choices, and a distinct presentation within the selected style.",
        }),
      });

      const result = await parseJsonSafely<AIActionResult>(response);

      if (!response.ok || !result?.ok) {
        throw new Error(
          result && !result.ok
            ? result.details?.[0] ?? result.error
            : "Unable to regenerate variation right now. Please retry.",
        );
      }

      setGeneratedSite(result.data);
      setHasUndeployedChanges(true);
      setCopiedUrl(false);
      await persistGeneratedSite(
        result.data,
        "CONTENT_EDIT",
        "Regenerated a fresh variation while preserving the core structure.",
      );
      setRetryAction(null);
      setWorkspaceMessage("Fresh variation generated and saved.");
    } catch (error) {
      setRetryAction(() => handleRegenerateVariation);
      setWorkspaceMessage(
        error instanceof Error ? error.message : "Unable to regenerate variation.",
      );
    } finally {
      setIsRegeneratingVariation(false);
    }
  }

  async function handleRegenerateSection(sectionId: string) {
    setRegeneratingSectionId(sectionId);
    setWorkspaceMessage(null);

    try {
      const response = await fetch("/api/ai/regenerate-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupIdea: idea,
          styleSelection: selectedStyle,
          outputMode: selectedOutputMode,
          palette: aiRequestPalette,
          existingProjectData: generatedSite,
          sectionId,
          editInstructions: editPrompt,
        }),
      });

      const result = await parseJsonSafely<AIActionResult>(response);

      if (!response.ok || !result?.ok) {
        throw new Error(
          result && !result.ok
            ? result.details?.[0] ?? result.error
            : "Unable to regenerate the section right now. Please retry.",
        );
      }

      setGeneratedSite(result.data);
      setHasUndeployedChanges(true);
      setCopiedUrl(false);
      await persistGeneratedSite(
        result.data,
        "REGENERATE_SECTION",
        `Section regenerated: ${sectionId}${editPrompt ? ` | ${editPrompt}` : ""}`,
      );
      setRetryAction(null);
      setWorkspaceMessage("Section regenerated and history saved.");
    } catch (error) {
      setRetryAction(() => handleRegenerateSection(sectionId));
      setWorkspaceMessage(
        error instanceof Error ? error.message : "Unable to regenerate section.",
      );
    } finally {
      setRegeneratingSectionId(null);
    }
  }

  async function handleCopyView(view: "code" | "structure", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedView(view);
      window.setTimeout(() => {
        setCopiedView((current) => (current === view ? null : current));
      }, 1600);
    } catch {
      setWorkspaceMessage("Copy failed. Please try again.");
    }
  }

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportCurrentHtml() {
    downloadFile(
      `${exportBaseName}-${activePage.slug}.html`,
      activePageHtml,
      "text/html;charset=utf-8",
    );
    setWorkspaceMessage(`Downloaded ${activePage.slug}.html`);
  }

  function handleExportBundle() {
    const bundle = {
      project: {
        brand: generatedSite.brand,
        tagline: generatedSite.tagline,
        outputMode: generatedSite.bestOutputMode,
        templateType: generatedSite.templateType,
      },
      files: generatedSite.pages.map((page, index) => ({
        path: index === 0 ? "index.html" : `${page.slug}/index.html`,
        route: index === 0 ? "/" : `/${page.slug}`,
        title: page.title,
        content: generatedSite.htmlByPage[page.slug] ?? "<main></main>",
      })),
      projectFiles: Object.entries(generatedSite.projectFiles ?? {}).map(([path, content]) => ({
        path,
        content,
      })),
      metadata: {
        siteMap: generatedSite.siteMap,
        audience: generatedSite.audience,
        tone: generatedSite.tone,
        styleDirection: generatedSite.styleDirection,
        palette: generatedSite.palette,
        notes: generatedSite.notes,
      },
    };

    downloadFile(
      `${exportBaseName}-export.json`,
      JSON.stringify(bundle, null, 2),
      "application/json;charset=utf-8",
    );
    setWorkspaceMessage("Downloaded structured multi-page export bundle.");
  }

  function handleExportMetadata() {
    const metadata = {
      brand: generatedSite.brand,
      tagline: generatedSite.tagline,
      audience: generatedSite.audience,
      productPositioning: generatedSite.productPositioning,
      tone: generatedSite.tone,
      styleDirection: generatedSite.styleDirection,
      templateType: generatedSite.templateType,
      bestOutputMode: generatedSite.bestOutputMode,
      palette: generatedSite.palette,
      siteMap: generatedSite.siteMap,
      generatedProjectFiles: Object.keys(generatedSite.projectFiles ?? {}),
      domainSuggestions: generatedSite.domainSuggestions,
      seoSummary: savedProject?.seoSummary ?? null,
      deployedUrl: savedProject?.deployedUrl ?? null,
    };

    downloadFile(
      `${exportBaseName}-metadata.json`,
      JSON.stringify(metadata, null, 2),
      "application/json;charset=utf-8",
    );
    setWorkspaceMessage("Downloaded metadata JSON.");
  }

  async function handleDomainSearch(customQuery?: string) {
    if (!savedProject?.id) {
      setWorkspaceMessage("Generate and save a project before searching domains.");
      return;
    }

    setIsRefreshingDomains(true);
    setWorkspaceMessage(null);

    try {
      const response = await fetch(`/api/projects/${savedProject.id}/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: customQuery?.trim() ? customQuery.trim() : undefined,
        }),
      });

      const result = await parseJsonSafely<{
        ok: boolean;
        data?: PersistedProjectDetail;
        error?: string;
      }>(response);

      if (!response.ok || !result?.ok || !result.data) {
        throw new Error(result?.error ?? "Unable to refresh domains.");
      }

      setSavedProject(result.data);
      setRetryAction(null);
      setWorkspaceMessage(
        customQuery?.trim()
          ? `Searched domain variations for "${customQuery.trim()}".`
          : "Auto-generated domain suggestions refreshed.",
      );
    } catch (error) {
      setRetryAction(() => {
        void handleDomainSearch(customQuery);
      });
      setWorkspaceMessage(error instanceof Error ? error.message : "Unable to refresh domains.");
    } finally {
      setIsRefreshingDomains(false);
    }
  }

  async function handleSavePreferredDomain(fullDomain: string) {
    if (!savedProject?.id) {
      setWorkspaceMessage("Generate and save a project before choosing a preferred domain.");
      return;
    }

    setSavingPreferredDomain(fullDomain);
    setWorkspaceMessage(null);

    try {
      const response = await fetch(`/api/projects/${savedProject.id}/preferred-domain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullDomain }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        data?: PersistedProjectDetail;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error ?? "Unable to save preferred domain.");
      }

      setSavedProject(result.data);
      setWorkspaceMessage(`Preferred domain saved: ${fullDomain}`);
    } catch (error) {
      setWorkspaceMessage(
        error instanceof Error ? error.message : "Unable to save preferred domain.",
      );
    } finally {
      setSavingPreferredDomain(null);
    }
  }

  useEffect(() => {
    if (!savedProject?.id) {
      return;
    }

    const summaryKey = JSON.stringify({
      projectId: savedProject.id,
      pageSlug: seoSummary.pageSlug,
      score: seoSummary.score,
      checks: seoSummary.checks.map((check) => check.passed),
    });

    if (persistedSeoKeyRef.current === summaryKey) {
      return;
    }

    persistedSeoKeyRef.current = summaryKey;

    void fetch(`/api/projects/${savedProject.id}/seo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: seoSummary,
      }),
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok: boolean;
          data?: PersistedProjectDetail;
        };

        if (response.ok && result.ok && result.data) {
          setSavedProject(result.data);
        }
      })
      .catch(() => {
        persistedSeoKeyRef.current = null;
      });
  }, [savedProject?.id, seoSummary]);

  return (
    <div className="grid items-stretch gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="surface h-full p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Generator Workspace</div>
            <h1 className="mt-5 text-4xl text-slate-950">Generate a polished site from one sharp prompt.</h1>
          </div>
          <div className="hidden whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 md:block">
            Demo-ready UX
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Shape the business idea, choose a visual direction, and generate a premium first draft
          with preview, code, structure, domains, and SEO all in one workspace.
        </p>

        <div className="mt-8">
          <label className="text-sm font-semibold text-slate-900">Startup idea</label>
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            className="mt-3 min-h-36 w-full rounded-[24px] border border-slate-300 bg-white px-5 py-4 text-base text-slate-900 shadow-none outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Describe the startup, the audience, and the kind of brand feel you want."
          />
          <div className="mt-2 text-xs leading-6 text-slate-500">
            Strong prompts mention the product, the audience, and the desired brand feel.
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Style selector</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {styleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedStyle(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    selectedStyle === option
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-primary" />
                Why this style?
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{styleExplanation}</p>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">Output mode</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {outputModes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOutputMode(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    selectedOutputMode === option
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-white/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Brand Palette</div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                The AI generates custom colors, but you can override them with customer palettes here.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setCustomPaletteInput("")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                  !customPaletteInput.trim()
                    ? "bg-slate-950 text-white border-slate-950 shadow-premium"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <WandSparkles className="h-3 w-3" />
                AI Branded
              </button>
              <button
                type="button"
                onClick={() => setCustomPaletteInput(formatPaletteInput(generatedSite.palette))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                  customPaletteInput.trim() === formatPaletteInput(generatedSite.palette)
                    ? "bg-slate-950 text-white border-slate-950 shadow-premium"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <Palette className="h-3 w-3" />
                Custom Branded
              </button>
            </div>
          </div>
          {customPaletteInput.trim() ? (
            <div className="mt-6 flex flex-wrap gap-4">
              {(paletteValidationMessage ? [] : parsedCustomPalette).map((color, index) => (
                <label
                  key={index}
                  className="group relative flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white p-2 pr-5 shadow-sm transition-all hover:scale-105 hover:border-blue-400 hover:shadow-md"
                >
                  <input
                    type="color"
                    value={color.length === 7 ? color : "#000000"}
                    onChange={(e) => {
                      const newPalette = [...parsedCustomPalette];
                      newPalette[index] = e.target.value.toUpperCase();
                      setCustomPaletteInput(newPalette.join(", "));
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="h-8 w-8 rounded-full border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-active:scale-95"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {["Primary", "Secondary", "Surface", "Accent"][index] || `Color ${index + 1}`}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700">{color}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <WandSparkles className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-emerald-900">AI Palette Active</strong>
                The AI will generate unique, industry-appropriate colors for you.
              </div>
            </div>
          )}
          <div className={cn("mt-3 text-xs leading-6", paletteValidationMessage ? "text-rose-600" : "text-slate-500")}>
            {paletteValidationMessage
              ? paletteValidationMessage
              : customPaletteInput.trim()
                ? "Locked: The generator will use these exact colors for your brand."
                : "Dynamic: The AI will generate a distinct palette that fits your audience and market category."}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-900">Example prompts</div>
          <div className="mt-3 flex flex-wrap gap-3">
            {promptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-t border-slate-100 pt-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-slate-400 font-medium">Style:</span>
              <span className="font-bold text-slate-900">{selectedStyle}</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="text-slate-400 font-medium">Output:</span>
              <span className="font-bold text-slate-900">{selectedOutputMode}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full shadow-soft hover:shadow-premium transition-all"
              onClick={handleRegenerateVariation}
              disabled={isGenerating || isApplyingEdit || isRegeneratingVariation}
            >
              {isRegeneratingVariation ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  New variation
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Regenerate variation
                </>
              )}
            </Button>
            <Button
              size="lg"
              className="rounded-full bg-slate-950 text-white shadow-premium hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              onClick={handleGenerate}
              disabled={isGenerating || Boolean(ideaValidationMessage) || Boolean(paletteValidationMessage)}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <WandSparkles className="h-4 w-4 text-glow" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {workspaceMessage ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>{workspaceMessage}</div>
            {retryAction ? (
              <button
                type="button"
                onClick={retryAction}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PencilLine className="h-4 w-4 text-primary" />
            Prompt-driven editing
          </div>
          <textarea
            value={editPrompt}
            onChange={(event) => setEditPrompt(event.target.value)}
            className="mt-4 min-h-28 w-full rounded-[22px] border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Try: make it more premium, remove pricing, add FAQ, rewrite for enterprise buyers, make the hero stronger"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              "make it more premium",
              "remove pricing",
              "add FAQ",
              "rewrite for enterprise buyers",
              "make the hero stronger",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setEditPrompt(suggestion)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={handleApplyEdit} disabled={isApplyingEdit}>
              {isApplyingEdit ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Applying edit
                </>
              ) : (
                <>
                  <PencilLine className="h-4 w-4" />
                  Apply edit
                </>
              )}
            </Button>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Structure stays stable unless the instruction asks for a larger change.
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            Loading steps
          </div>
          <div className="mt-5 grid gap-3">
            {loadingSteps.map((step, index) => {
              const isComplete =
                hasCompletedGeneration && !isGenerating
                  ? index <= activeStepIndex
                  : !isGenerating && activeStepIndex > index;
              const isActive = isGenerating && activeStepIndex === index;
              const isQueued = isGenerating ? index > activeStepIndex : activeStepIndex < index;

              return (
                <div
                  key={step}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 transition",
                    isActive && "bg-white ring-1 ring-blue-200",
                    isComplete && "bg-emerald-50",
                    !isActive && !isComplete && "bg-white/80",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isActive ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    )}
                    <span className="font-medium text-slate-900">{step}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {isComplete ? "Done" : isActive ? "In progress" : isQueued ? "Queued" : "Ready"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative flex h-full min-h-[1280px] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] xl:min-h-0">
        <div className="flex h-full w-full flex-col p-4">
          {/* Floating Command Center & Site Navigator Stack */}
          <div className="mb-12 flex flex-col items-center gap-4">
            {/* Primary Editor Dock */}
            <div className="flex h-12 w-full justify-between items-center gap-6 rounded-full border border-white/10 bg-white/[0.03] pl-2 pr-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all hover:border-white/20">
              <button
                type="button"
                onClick={vercelUrl && !hasUndeployedChanges ? handleCopyDeployedUrl : handleDeploy}
                disabled={isDeploying || (vercelUrl ? false : false)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-full px-4 py-1.5 transition-all active:scale-95 disabled:opacity-50",
                  vercelUrl && !hasUndeployedChanges
                    ? "bg-sky-400/10 hover:bg-sky-400/20"
                    : "bg-emerald-400/10 hover:bg-emerald-400/20",
                )}
              >
                <div className="relative flex h-2 w-2 items-center justify-center">
                  <div className={cn("h-1.5 w-1.5 rounded-full", vercelUrl && !hasUndeployedChanges ? "bg-sky-400" : "bg-emerald-400")} />
                  {isDeploying ? (
                    <div className="absolute inset-x-0 h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                  ) : !(vercelUrl && !hasUndeployedChanges) ? (
                    <div className="absolute inset-x-0 h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em]",
                    vercelUrl && !hasUndeployedChanges ? "text-sky-400" : "text-emerald-400",
                  )}
                >
                  {isDeploying ? "Deploying..." : vercelUrl && !hasUndeployedChanges ? (copiedUrl ? "Copied URL" : "Copy URL") : "Ready for deploy"}
                </span>
              </button>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-1">
                {(["Desktop", "Tablet", "Mobile"] as const).map((device) => (
                  <button
                    key={device}
                    onClick={() => setPreviewDevice(device)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
                      previewDevice === device
                        ? "bg-white text-slate-950 shadow-glow"
                        : "text-slate-500 hover:text-white"
                    )}
                    title={device}
                  >
                    {device === "Desktop" && <Monitor className="h-3.5 w-3.5" />}
                    {device === "Tablet" && <Smartphone className="h-3.5 w-3.5 rotate-90" />}
                    {device === "Mobile" && <Smartphone className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                {([
                  { key: "single", label: "Page" },
                  { key: "all", label: "All" },
                ] as const).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPreviewMode(option.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                      previewMode === option.key
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateVariation}
                  disabled={isRegeneratingVariation}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-950 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm disabled:opacity-50"
                  title="Regenerate variation"
                >
                  {isRegeneratingVariation ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-slate-800"
                  title="Full-screen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className={cn("flex-1 transition-all duration-700 ease-in-out", previewFrameClassName)}>
            {previewMode === "single" ? (
              <div className="group relative h-full min-h-[1280px] overflow-hidden rounded-[32px] border border-white/15 bg-white shadow-[0_48px_120px_rgba(0,0,0,0.6)] transition-all hover:border-white/20 xl:min-h-[720px]">
                <HtmlPreviewFrame
                  site={generatedSite}
                  activePageSlug={activePreviewPage}
                  onNavigateSlug={setActivePreviewPage}
                />
              </div>
            ) : (
              <div className="space-y-10">
                {orderedPreviewPages.map((page) => (
                  <section key={page.slug} className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-sm">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                          {page.slug}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">{page.title}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreviewPage(page.slug);
                          setPreviewMode("single");
                        }}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
                      >
                        Focus Page
                      </button>
                    </div>
                    <div className="group relative h-[720px] overflow-hidden rounded-[32px] border border-white/15 bg-white shadow-[0_48px_120px_rgba(0,0,0,0.6)] transition-all hover:border-white/20">
                      <HtmlPreviewFrame
                        site={generatedSite}
                        activePageSlug={page.slug}
                        onNavigateSlug={setActivePreviewPage}
                      />
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          {/* <div className="mt-12 flex flex-wrap items-center justify-between gap-8 border-t border-white/5 pt-8">
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleExportCurrentHtml}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Export HTML
              </button>
              <button
                type="button"
                onClick={handleExportBundle}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FileCode className="h-4 w-4" />
                Download Bundle
              </button>
              <button
                type="button"
                onClick={() => handleCopyView("code", JSON.stringify(generatedSite, null, 2))}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copiedView === "code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                Copy JSON
              </button>
            </div>

            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "primary" }),
                "h-12 rounded-full bg-white px-8 text-slate-950 hover:bg-slate-100 font-semibold"
              )}
            >
              Save to my projects
            </Link>
          </div> */}
        </div>
      </section>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-xl">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-950 px-8">
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-white tracking-tighter">{generatedSite.brand}</div>
              </div>

              {/* Floating Command Center (Full Preview) */}
              <div className="flex h-10 items-center gap-6 rounded-full border border-white/10 bg-white/[0.03] pl-1.5 pr-5 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={vercelUrl && !hasUndeployedChanges ? handleCopyDeployedUrl : handleDeploy}
                  disabled={isDeploying}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-3 py-1 transition-all active:scale-95 disabled:opacity-50",
                    vercelUrl && !hasUndeployedChanges
                      ? "bg-sky-400/10 hover:bg-sky-400/20"
                      : "bg-emerald-400/10 hover:bg-emerald-400/20",
                  )}
                >
                  <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                    <div className={cn("h-1.5 w-1.5 rounded-full", vercelUrl && !hasUndeployedChanges ? "bg-sky-400" : "bg-emerald-400")} />
                    {isDeploying ? (
                      <div className="absolute inset-x-0 h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                    ) : !(vercelUrl && !hasUndeployedChanges) ? (
                      <div className="absolute inset-x-0 h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "text-[8px] font-black uppercase tracking-[0.2em]",
                      vercelUrl && !hasUndeployedChanges ? "text-sky-400" : "text-emerald-400",
                    )}
                  >
                    {isDeploying ? "Deploying..." : vercelUrl && !hasUndeployedChanges ? (copiedUrl ? "Copied URL" : "Copy URL") : "Ready for deploy"}
                  </span>
                </button>

                <div className="h-3 w-px bg-white/10" />

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                  {([
                    { key: "single", label: "Page" },
                    { key: "all", label: "All" },
                  ] as const).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPreviewMode(option.key)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                        previewMode === option.key
                          ? "bg-white text-slate-950"
                          : "text-slate-400 hover:text-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {(["Desktop", "Tablet", "Mobile"] as const).map((device) => (
                    <button
                      key={device}
                      onClick={() => setPreviewDevice(device)}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95",
                        previewDevice === device
                          ? "bg-white text-slate-950 shadow-glow"
                          : "text-slate-500 hover:text-white"
                      )}
                      title={device}
                    >
                      {device === "Desktop" && <Monitor className="h-3 w-3" />}
                      {device === "Tablet" && <Smartphone className="h-3 w-3 rotate-90" />}
                      {device === "Mobile" && <Smartphone className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:scale-110 active:scale-95 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#020617] p-4 lg:p-8">
              <div className={cn("mx-auto h-full transition-all duration-700", previewFrameClassName)}>
                {previewMode === "single" ? (
                  <div className="relative h-full min-h-[760px] overflow-hidden rounded-[40px] border border-white/10 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <HtmlPreviewFrame
                      site={generatedSite}
                      activePageSlug={activePreviewPage}
                      onNavigateSlug={setActivePreviewPage}
                    />
                  </div>
                ) : (
                  <div className="space-y-10">
                    {orderedPreviewPages.map((page) => (
                      <section key={page.slug} className="space-y-3">
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-sm">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                              {page.slug}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">{page.title}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePreviewPage(page.slug);
                              setPreviewMode("single");
                            }}
                            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
                          >
                            Focus Page
                          </button>
                        </div>
                        <div className="relative h-[760px] overflow-hidden rounded-[40px] border border-white/10 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                          <HtmlPreviewFrame
                            site={generatedSite}
                            activePageSlug={page.slug}
                            onNavigateSlug={setActivePreviewPage}
                          />
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Deployment & Domain Wizard */}
      {showDeploySuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !isDeploying && setShowDeploySuccess(false)}
          />
          <div className="relative w-full max-w-xl overflow-hidden rounded-[40px] border border-white/10 bg-slate-900 shadow-2xl transition-all animate-in fade-in zoom-in duration-500">
            {/* Animated Gradient Header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />

            <div className="p-10">
              {deployStep === "deploying" ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="relative mb-10">
                    <div className="h-24 w-24 animate-spin rounded-full border-4 border-white/5 border-t-emerald-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Deploying to Vercel</h3>
                  <p className="max-w-[320px] text-slate-400 text-sm leading-relaxed">
                    Preparing production build, optimizing assets, and pushing to Vercel Global Edge Network...
                  </p>
                </div>
              ) : deployStep === "domains" ? (
                <div className="flex flex-col">
                  <div className="mb-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Vercel Deployment Live</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-slate-500 text-sm">Accessible at <span className="text-emerald-400 font-mono text-xs">{vercelUrl}</span></p>
                        {/* <button
                          onClick={handleCopyDeployedUrl}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                          title="Copy URL"
                        >
                          {copiedUrl ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button> */}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyDeployedUrl}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-all hover:scale-110 active:scale-95 hover:bg-emerald-500/20 group"
                      title="Copy deployment URL"
                    >
                      {copiedUrl ? (
                        <Check className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <Copy className="h-6 w-6 text-emerald-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Step 2: Secure your Brand Domain</h4>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400">Live Availability</span>
                    </div>

                    <div className="grid gap-3">
                      {suggestedDomains.map((domain) => (
                        <div key={domain.name} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                              <Globe2 className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white tracking-tight">{domain.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium">{domain.price}/year</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              window.open(`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${domain.name}`, '_blank');
                              setDeployStep("configuration");
                            }}
                            className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            Buy on GoDaddy
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setDeployStep("configuration")}
                      className="w-full text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
                    >
                      I already have a domain
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="mb-10 flex items-center gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-blue-500/10 ring-1 ring-blue-500/20">
                      <Globe2 className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white leading-tight">Connect your Custom Domain</h3>
                      <p className="text-slate-500 text-sm mt-1">Point your GoDaddy domain to your Vercel project</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-black/50 p-6 space-y-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">A Record</div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 font-mono text-xs">
                          <span className="text-emerald-400">76.76.21.21</span>
                          <button onClick={() => navigator.clipboard.writeText("76.76.21.21")} className="text-slate-500 hover:text-white"><Copy className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">CNAME Record (www)</div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 font-mono text-xs">
                          <span className="text-emerald-400">cname.vercel-dns.com</span>
                          <button onClick={() => navigator.clipboard.writeText("cname.vercel-dns.com")} className="text-slate-500 hover:text-white"><Copy className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowDeploySuccess(false)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                      >
                        Complete Setup
                      </button>
                      <a
                        href={vercelUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-xs font-bold text-slate-950 transition-all hover:shadow-glow active:scale-95"
                      >
                        Preview Deployment
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
