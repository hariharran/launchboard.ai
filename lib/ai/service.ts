import type {
  AIContentPlan,
  AIInferredFeature,
  AIGenerationResponse,
  AIProjectSnapshot,
  InitialGenerationInput,
  OutputModeSelection,
  PromptEditInput,
  SectionRegenerationInput,
} from "@/types/ai";
import { AIConfigurationError, AIProviderError } from "@/lib/ai/errors";

const OPENAI_RESPONSES_ENDPOINT = "/v1/responses";
const DEFAULT_FALLBACK_MODEL = "demo-structured-generator";
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const SYSTEM_PROMPT = `You generate structured website planning output for an AI website builder.
Return valid JSON only.
Keep the response grounded in the provided startup idea and instructions.
Preserve existing project structure unless the instructions clearly request larger structural changes.
Use concise, polished, high-quality product language.
Generate a distinct brand palette that fits the audience, market category, and tone, UNLESS a specific palette is provided in the input, in which case you must use it exclusively.
Return 4 to 6 valid hex colors in palette, ordered from primary brand colors to supporting neutrals/accent colors.
Do not wrap the JSON in markdown fences.`;

const generationResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "contentPlan",
    "brand",
    "tagline",
    "audience",
    "productPositioning",
    "tone",
    "styleDirection",
    "keyFeatures",
    "ctaDirection",
    "pricingDirection",
    "testimonialsAppropriate",
    "bestOutputMode",
    "palette",
    "templateType",
    "siteMap",
    "pages",
    "sections",
    "htmlByPageEntries",
    "domainSuggestions",
    "notes",
  ],
  properties: {
    contentPlan: {
      type: "object",
      additionalProperties: false,
      required: [
        "brand",
        "tagline",
        "audience",
        "productPositioning",
        "tone",
        "keyFeatures",
        "ctaDirection",
        "pricingDirection",
        "testimonialsAppropriate",
        "bestOutputMode",
        "styleDirection",
        "palette",
        "templateType",
        "siteMap",
      ],
      properties: {
        brand: { type: "string" },
        tagline: { type: "string" },
        audience: { type: "string" },
        productPositioning: { type: "string" },
        tone: { type: "string" },
        keyFeatures: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        ctaDirection: { type: "string" },
        pricingDirection: { type: "string" },
        testimonialsAppropriate: { type: "boolean" },
        bestOutputMode: { type: "string", enum: ["Auto", "Single Page", "Multi Page"] },
        styleDirection: { type: "string" },
        palette: { type: "array", items: { type: "string" } },
        templateType: { type: "string" },
        siteMap: { type: "array", items: { type: "string" } },
      },
    },
    brand: { type: "string" },
    tagline: { type: "string" },
    audience: { type: "string" },
    productPositioning: { type: "string" },
    tone: { type: "string" },
    styleDirection: { type: "string" },
    keyFeatures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    ctaDirection: { type: "string" },
    pricingDirection: { type: "string" },
    testimonialsAppropriate: { type: "boolean" },
    bestOutputMode: { type: "string", enum: ["Auto", "Single Page", "Multi Page"] },
    palette: { type: "array", items: { type: "string" } },
    templateType: { type: "string" },
    siteMap: { type: "array", items: { type: "string" } },
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "title", "purpose", "sections"],
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          purpose: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "type", "title", "description", "ctaLabel"],
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                ctaLabel: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "title", "description", "ctaLabel"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          ctaLabel: { type: ["string", "null"] },
        },
      },
    },
    htmlByPageEntries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "html"],
        properties: {
          slug: { type: "string" },
          html: { type: "string" },
        },
      },
    },
    domainSuggestions: { type: "array", items: { type: "string" } },
    notes: { type: "array", items: { type: "string" } },
  },
} as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inferBrandName(startupIdea: string) {
  const cleaned = startupIdea
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return cleaned.length > 0 ? cleaned.replace(/\b\w/g, (match) => match.toUpperCase()) : "Launchboard";
}

function mapTemplateType(outputMode: string) {
  return outputMode === "Multi Page" ? "STARTUP" : "SAAS";
}

function inferAudience(startupIdea: string) {
  const lower = startupIdea.toLowerCase();

  if (lower.includes("freelancer")) {
    return "Freelancers and solo operators who need professional tools without enterprise complexity.";
  }

  if (lower.includes("agency")) {
    return "Agencies and client-service teams looking for a polished offer and stronger differentiation.";
  }

  if (lower.includes("founder") || lower.includes("startup")) {
    return "Founders and lean startup teams moving quickly toward launch.";
  }

  if (lower.includes("b2b") || lower.includes("saas")) {
    return "B2B teams that need clarity, trust, and conversion-focused positioning.";
  }

  return "Fast-moving teams and independent builders who need a clear, launch-ready web presence.";
}

function inferTone(styleSelection: string) {
  if (styleSelection === "Bold") {
    return "Confident, decisive, and high-energy";
  }

  if (styleSelection === "Playful") {
    return "Friendly, expressive, and approachable";
  }

  if (styleSelection === "Minimal") {
    return "Clear, restrained, and modern";
  }

  if (styleSelection === "Premium") {
    return "Credible, polished, and high-trust";
  }

  return "Modern, polished, and conversion-aware";
}

function inferStyleDirection(styleSelection: string) {
  if (styleSelection === "Bold") {
    return "High-contrast composition, assertive headlines, and punchy conversion sections.";
  }

  if (styleSelection === "Playful") {
    return "Expressive color, approachable copy rhythm, and more personality in section transitions.";
  }

  if (styleSelection === "Minimal") {
    return "Quiet spacing, restrained color, clean hierarchy, and simple structure.";
  }

  if (styleSelection === "Premium") {
    return "Editorial typography, elevated whitespace, and high-trust visual framing.";
  }

  return "Modern editorial layout with polished product framing.";
}

function inferPalette(styleSelection: string) {
  switch (styleSelection) {
    case "Premium":
      return ["#0F172A", "#1E293B", "#F8FAFC", "#3B82F6"]; // Deep executive
    case "Playful":
      return ["#7C3AED", "#DB2777", "#FFFFFF", "#FBBF24"]; // Vibrant bubblegum
    case "Bold":
      return ["#000000", "#DC2626", "#FFFFFF", "#FACC15"]; // High contrast
    case "Minimal":
    default:
      return ["#18181B", "#27272A", "#FFFFFF", "#71717A"]; // Clean mono
  }
}

function inferFeatures(startupIdea: string): AIInferredFeature[] {
  const lower = startupIdea.toLowerCase();

  if (lower.includes("bookkeeping") || lower.includes("finance")) {
    return [
      {
        title: "Automated financial workflows",
        description: "Reduce admin overhead with smoother invoicing, reconciliation, and reporting flows.",
      },
      {
        title: "Founder-level visibility",
        description: "Surface the numbers that matter so operators can make faster decisions.",
      },
      {
        title: "Trust-first experience",
        description: "Present the product with credible language and polished onboarding cues.",
      },
    ];
  }

  if (lower.includes("automation") || lower.includes("workflow")) {
    return [
      {
        title: "Process orchestration",
        description: "Connect repetitive tasks into one cleaner operating flow.",
      },
      {
        title: "Team efficiency",
        description: "Help small teams do more with fewer manual handoffs.",
      },
      {
        title: "Fast implementation",
        description: "Lower the barrier to adoption with an easy, well-scoped starting point.",
      },
    ];
  }

  return [
    {
      title: "Faster launch execution",
      description: "Help teams move from idea to a credible first version without losing momentum.",
    },
    {
      title: "Clearer positioning",
      description: "Translate the product into sharper messaging and buyer-facing value.",
    },
    {
      title: "Polished first impression",
      description: "Make the brand feel deliberate, modern, and ready for launch.",
    },
  ];
}

function inferProductPositioning(startupIdea: string, audience: string) {
  return `${startupIdea.trim()} positioned for ${audience.toLowerCase()} with strong clarity, trust, and launch readiness.`;
}

function inferCtaDirection(startupIdea: string) {
  const lower = startupIdea.toLowerCase();

  if (lower.includes("saas") || lower.includes("platform") || lower.includes("tool")) {
    return "Drive visitors toward starting a free trial or booking a product demo.";
  }

  if (lower.includes("agency") || lower.includes("service")) {
    return "Drive visitors toward booking a consultation or requesting a proposal.";
  }

  return "Drive visitors toward starting, joining, or requesting access with low friction.";
}

function inferPricingDirection(startupIdea: string) {
  const lower = startupIdea.toLowerCase();

  if (lower.includes("agency") || lower.includes("service")) {
    return "Lead with tailored plans or consultation-based pricing rather than rigid self-serve tiers.";
  }

  if (lower.includes("b2b") || lower.includes("saas") || lower.includes("platform")) {
    return "Use clear tiered pricing with an enterprise path and a stronger primary middle plan.";
  }

  return "Keep pricing simple, accessible, and easy to scan with one recommended plan.";
}

function inferTestimonialsAppropriate(startupIdea: string) {
  const lower = startupIdea.toLowerCase();

  return !lower.includes("stealth") && !lower.includes("pre-launch");
}

function inferBestOutputMode(
  requestedOutputMode: OutputModeSelection,
  startupIdea: string,
): OutputModeSelection {
  if (requestedOutputMode !== "Auto") {
    return requestedOutputMode;
  }

  const lower = startupIdea.toLowerCase();

  if (
    lower.includes("platform") ||
    lower.includes("saas") ||
    lower.includes("marketplace") ||
    lower.includes("b2b")
  ) {
    return "Multi Page";
  }

  return "Single Page";
}

function buildContentPlan(
  startupIdea: string,
  styleSelection: string,
  requestedOutputMode: OutputModeSelection,
  preferredPalette?: string[] | null,
  existingProjectData?: AIProjectSnapshot | null,
): AIContentPlan {
  if (existingProjectData?.contentPlan) {
    return existingProjectData.contentPlan;
  }

  const brand = existingProjectData?.brand ?? inferBrandName(startupIdea);
  const audience = existingProjectData?.audience ?? inferAudience(startupIdea);
  const bestOutputMode =
    existingProjectData?.bestOutputMode ??
    inferBestOutputMode(requestedOutputMode, startupIdea);
  const tone = existingProjectData?.tone ?? inferTone(styleSelection);
  const styleDirection =
    existingProjectData?.styleDirection ?? inferStyleDirection(styleSelection);
  const palette = preferredPalette ?? existingProjectData?.palette ?? inferPalette(styleSelection);
  const keyFeatures = existingProjectData?.keyFeatures ?? inferFeatures(startupIdea);
  const productPositioning =
    existingProjectData?.productPositioning ??
    inferProductPositioning(startupIdea, audience);
  const ctaDirection =
    existingProjectData?.ctaDirection ?? inferCtaDirection(startupIdea);
  const pricingDirection =
    existingProjectData?.pricingDirection ?? inferPricingDirection(startupIdea);
  const testimonialsAppropriate =
    existingProjectData?.testimonialsAppropriate ??
    inferTestimonialsAppropriate(startupIdea);
  const templateType =
    existingProjectData?.templateType ?? mapTemplateType(bestOutputMode);
  const siteMap =
    existingProjectData?.siteMap ??
    (bestOutputMode === "Multi Page"
      ? ["Home", "Features", "Pricing", "FAQ", "Contact"]
      : ["Home"]);

  return {
    brand,
    tagline:
      existingProjectData?.tagline ??
      `${brand} helps teams move from idea to launch-ready presence with more clarity and speed.`,
    audience,
    productPositioning,
    tone,
    keyFeatures,
    ctaDirection,
    pricingDirection,
    testimonialsAppropriate,
    bestOutputMode,
    styleDirection,
    palette,
    templateType,
    siteMap,
  };
}

function buildSectionsFromPlan(plan: AIContentPlan): AIGenerationResponse["sections"] {
  const sections: AIGenerationResponse["sections"] = [
    {
      id: "hero",
      type: "hero",
      title: `${plan.brand} gives ${plan.audience.toLowerCase()} a sharper way to launch.`,
      description: plan.productPositioning,
      ctaLabel: "Start now",
    },
    {
      id: "problem",
      type: "problem",
      title: "Most teams lose momentum before the first polished version goes live.",
      description:
        "Unclear messaging, scattered planning, and weak structure slow down launch quality. The planning-first workflow fixes that.",
    },
    {
      id: "features",
      type: "features",
      title: plan.keyFeatures[0]?.title ?? "Core capabilities",
      description: plan.keyFeatures.map((feature) => feature.description).join(" "),
    },
  ];

  if (plan.testimonialsAppropriate) {
    sections.push({
      id: "testimonials",
      type: "social-proof",
      title: "Social proof reinforces trust at the right moment.",
      description:
        "Testimonials and customer proof points are appropriate for this product story and should be placed before the final CTA.",
    });
  }

  sections.push(
    {
      id: "pricing",
      type: "pricing",
      title: "Pricing should match how the offer is evaluated.",
      description: plan.pricingDirection,
    },
    {
      id: "cta",
      type: "cta",
      title: "Guide the visitor toward the next clear action.",
      description: plan.ctaDirection,
      ctaLabel: "Generate now",
    },
  );

  return sections;
}

function buildPagesFromPlan(
  plan: AIContentPlan,
  sections: AIGenerationResponse["sections"],
  existingProjectData?: AIProjectSnapshot | null,
) {
  if (existingProjectData?.pages) {
    return existingProjectData.pages;
  }

  return plan.siteMap.map((pageName, index) => ({
    slug: index === 0 ? "home" : slugify(pageName),
    title: pageName,
    purpose:
      index === 0
        ? `Primary conversion page for ${plan.brand} focused on positioning, proof, and action.`
        : `${pageName} page supporting the main decision flow.`,
    sections:
      index === 0
        ? sections
        : sections.filter((section) =>
            ["features", "pricing", "cta"].includes(section.id),
          ),
  }));
}

function normalizeSection(
  section: Partial<AIGenerationResponse["sections"][number]> | undefined,
  index: number,
  fallbackBrand: string,
): AIGenerationResponse["sections"][number] {
  const type = section?.type?.trim() || "content";

  return {
    id: section?.id?.trim() || `${type}-${index + 1}`,
    type,
    title: section?.title?.trim() || `${fallbackBrand} section ${index + 1}`,
    description:
      section?.description?.trim() ||
      "This section was completed with a fallback description to keep the output stable.",
    ctaLabel: section?.ctaLabel?.trim() || undefined,
  };
}

function normalizeResponse(
  response: Partial<AIGenerationResponse>,
  startupIdea: string,
  styleSelection: string,
  outputMode: OutputModeSelection,
  preferredPalette?: string[] | null,
  existingProjectData?: AIProjectSnapshot | null,
): AIGenerationResponse {
  const fallback = buildResponseFromIdea(
    startupIdea,
    styleSelection,
    outputMode,
    preferredPalette,
    existingProjectData,
    "Fallback normalization was applied to stabilize incomplete AI output.",
  );

  const contentPlan = response.contentPlan
    ? {
        ...fallback.contentPlan,
        ...response.contentPlan,
        brand: response.contentPlan.brand?.trim() || fallback.contentPlan.brand,
        tagline: response.contentPlan.tagline?.trim() || fallback.contentPlan.tagline,
        audience: response.contentPlan.audience?.trim() || fallback.contentPlan.audience,
        productPositioning:
          response.contentPlan.productPositioning?.trim() ||
          fallback.contentPlan.productPositioning,
        tone: response.contentPlan.tone?.trim() || fallback.contentPlan.tone,
        ctaDirection:
          response.contentPlan.ctaDirection?.trim() || fallback.contentPlan.ctaDirection,
        pricingDirection:
          response.contentPlan.pricingDirection?.trim() || fallback.contentPlan.pricingDirection,
        styleDirection:
          response.contentPlan.styleDirection?.trim() ||
          fallback.contentPlan.styleDirection,
        keyFeatures:
          response.contentPlan.keyFeatures?.filter(
            (feature) => feature?.title?.trim() && feature?.description?.trim(),
          ) ?? fallback.contentPlan.keyFeatures,
        palette:
          response.contentPlan.palette?.filter((color) => typeof color === "string" && color.trim()) ??
          preferredPalette ?? fallback.contentPlan.palette,
        siteMap:
          response.contentPlan.siteMap?.filter((item) => typeof item === "string" && item.trim()) ??
          fallback.contentPlan.siteMap,
      }
    : fallback.contentPlan;

  const sections =
    response.sections?.map((section, index) =>
      normalizeSection(section, index, contentPlan.brand),
    ) ?? fallback.sections;

  const pages =
    response.pages?.length
      ? response.pages.map((page, pageIndex) => ({
          slug: page.slug?.trim() || (pageIndex === 0 ? "home" : `page-${pageIndex + 1}`),
          title: page.title?.trim() || `Page ${pageIndex + 1}`,
          purpose:
            page.purpose?.trim() ||
            "This page was repaired from partial AI output to keep the project previewable.",
          sections:
            page.sections?.map((section, index) =>
              normalizeSection(section, index, contentPlan.brand),
            ) ?? (pageIndex === 0 ? sections : sections.slice(0, Math.min(sections.length, 3))),
        }))
      : fallback.pages;

  const htmlByPage = Object.fromEntries(
    pages.map((page) => {
      const providerHtml = response.htmlByPage?.[page.slug];
      const fallbackHtml = fallback.htmlByPage[page.slug];

      return [
        page.slug,
        providerHtml?.trim()
          ? providerHtml
          : fallbackHtml ??
              `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${escapeHtml(contentPlan.brand)} | ${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(contentPlan.tagline)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <main>
      <section>
        <h1>${escapeHtml(contentPlan.brand)}</h1>
        <p>${escapeHtml(page.purpose)}</p>
      </section>
    </main>
  </body>
</html>`,
      ];
    }),
  );

  return {
    ...fallback,
    ...response,
    contentPlan,
    brand: response.brand?.trim() || contentPlan.brand,
    tagline: response.tagline?.trim() || contentPlan.tagline,
    audience: response.audience?.trim() || contentPlan.audience,
    productPositioning:
      response.productPositioning?.trim() || contentPlan.productPositioning,
    tone: response.tone?.trim() || contentPlan.tone,
    styleDirection: response.styleDirection?.trim() || contentPlan.styleDirection,
    keyFeatures:
      response.keyFeatures?.filter(
        (feature) => feature?.title?.trim() && feature?.description?.trim(),
      ) ?? contentPlan.keyFeatures,
    ctaDirection: response.ctaDirection?.trim() || contentPlan.ctaDirection,
    pricingDirection:
      response.pricingDirection?.trim() || contentPlan.pricingDirection,
    testimonialsAppropriate:
      response.testimonialsAppropriate ?? contentPlan.testimonialsAppropriate,
    bestOutputMode: response.bestOutputMode ?? contentPlan.bestOutputMode,
    palette:
      response.palette?.filter((color) => typeof color === "string" && color.trim()) ??
      preferredPalette ?? contentPlan.palette,
    templateType: response.templateType?.trim() || contentPlan.templateType,
    siteMap:
      response.siteMap?.filter((item) => typeof item === "string" && item.trim()) ??
      contentPlan.siteMap,
    pages,
    sections,
    htmlByPage,
    domainSuggestions:
      response.domainSuggestions?.filter((item) => typeof item === "string" && item.trim()) ??
      fallback.domainSuggestions,
    notes: [
      ...new Set([
        ...(response.notes ?? []),
        ...fallback.notes,
        "Testimonials are generated sample content unless replaced with real customer proof.",
      ]),
    ],
  };
}

function cloneResponse(response: AIGenerationResponse): AIGenerationResponse {
  return JSON.parse(JSON.stringify(response)) as AIGenerationResponse;
}

function removeSectionsByIdOrType(
  response: AIGenerationResponse,
  matchers: string[],
): AIGenerationResponse {
  return {
    ...response,
    sections: response.sections.filter(
      (section) => !matchers.includes(section.id) && !matchers.includes(section.type),
    ),
    pages: response.pages.map((page) => ({
      ...page,
      sections: page.sections.filter(
        (section) => !matchers.includes(section.id) && !matchers.includes(section.type),
      ),
    })),
  };
}

function addFaqSection(response: AIGenerationResponse): AIGenerationResponse {
  const hasFaq = response.sections.some(
    (section) => section.id === "faq" || section.type === "faq",
  );

  if (hasFaq) {
    return response;
  }

  const faqSection = {
    id: "faq",
    type: "faq",
    title: "Answer the questions buyers ask before they commit.",
    description:
      "Clarify setup, pricing, trust, and workflow fit so hesitation is reduced before the final CTA.",
  };

  return {
    ...response,
    sections: [...response.sections, faqSection],
    pages: response.pages.map((page) =>
      page.slug === "home" || page.slug === "faq"
        ? { ...page, sections: [...page.sections, faqSection] }
        : page,
    ),
    siteMap: response.siteMap.includes("FAQ") ? response.siteMap : [...response.siteMap, "FAQ"],
  };
}

function applyEditInstructions(
  response: AIGenerationResponse,
  editInstructions: string,
): AIGenerationResponse {
  const next = cloneResponse(response);
  const lower = editInstructions.toLowerCase();

  if (lower.includes("more premium")) {
    next.tone = "More premium, elevated, and high-trust";
    next.styleDirection =
      "Editorial typography, refined spacing, and stronger premium brand framing.";
    next.tagline = `${next.brand} gives ambitious teams a more elevated path from idea to launch.`;
    next.contentPlan.tone = next.tone;
    next.contentPlan.styleDirection = next.styleDirection;
    next.contentPlan.tagline = next.tagline;
  }

  if (lower.includes("remove pricing")) {
    const stripped = removeSectionsByIdOrType(next, ["pricing"]);
    stripped.pricingDirection = "Pricing is intentionally removed from the current structure.";
    stripped.contentPlan.pricingDirection = stripped.pricingDirection;
    return stripped;
  }

  if (lower.includes("add faq")) {
    return addFaqSection(next);
  }

  if (lower.includes("enterprise")) {
    next.audience =
      "Enterprise buyers, operators, and stakeholders evaluating reliability, control, and rollout fit.";
    next.productPositioning =
      "Position the product as a reliable, scalable solution for larger organizations that need trust, governance, and operational clarity.";
    next.tone = "Enterprise-ready, strategic, and credible";
    next.ctaDirection = "Drive visitors toward booking a tailored enterprise demo.";
    next.pricingDirection = "Lead with consultation-based pricing and a sales-assisted buying path.";
    next.contentPlan.audience = next.audience;
    next.contentPlan.productPositioning = next.productPositioning;
    next.contentPlan.tone = next.tone;
    next.contentPlan.ctaDirection = next.ctaDirection;
    next.contentPlan.pricingDirection = next.pricingDirection;
  }

  if (lower.includes("hero stronger")) {
    next.sections = next.sections.map((section) =>
      section.id === "hero"
        ? {
            ...section,
            title: `${next.brand} helps teams launch with more authority and less friction.`,
            description:
              "Sharper positioning, clearer trust signals, and a more decisive call to action make the first impression more compelling.",
          }
        : section,
    );
    next.pages = next.pages.map((page) => ({
      ...page,
      sections: page.sections.map((section) =>
        section.id === "hero"
          ? {
              ...section,
              title: `${next.brand} helps teams launch with more authority and less friction.`,
              description:
                "Sharper positioning, clearer trust signals, and a more decisive call to action make the first impression more compelling.",
            }
          : section,
      ),
    }));
  }

  return next;
}

function buildHtmlFromPages(
  plan: AIContentPlan,
  pages: AIGenerationResponse["pages"],
  existingProjectData?: AIProjectSnapshot | null,
) {
  if (existingProjectData?.htmlByPage) {
    return existingProjectData.htmlByPage;
  }

  return Object.fromEntries(
    pages.map((page) => [
      page.slug,
      (() => {
        const [primary = "#0F172A", secondary = "#2563EB", surface = "#F8FAFC", accent = "#F59E0B", muted = "#CBD5E1"] =
          plan.palette;

        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${plan.brand} | ${page.title}</title>
    <meta name="description" content="${plan.tagline}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --brand-primary: ${primary};
        --brand-secondary: ${secondary};
        --brand-surface: ${surface};
        --brand-accent: ${accent};
        --brand-muted: ${muted};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, ${secondary}20, transparent 28%),
          linear-gradient(180deg, ${surface}, #ffffff);
        color: ${primary};
      }
      main { padding: 40px 20px; }
      .shell {
        max-width: 1120px;
        margin: 0 auto;
        border: 1px solid ${primary}22;
        border-radius: 28px;
        background: #ffffff;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
      }
      .hero {
        padding: 48px 32px;
        background: linear-gradient(135deg, ${primary}, ${secondary}, ${accent});
        color: white;
      }
      .eyebrow {
        display: inline-flex;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        font-size: 12px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }
      h1 {
        margin: 24px 0 0;
        font-size: clamp(42px, 7vw, 72px);
        line-height: 0.95;
      }
      p {
        margin: 18px 0 0;
        max-width: 720px;
        font-size: 18px;
        line-height: 1.8;
      }
      .actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 28px;
      }
      .primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 20px;
        border-radius: 999px;
        background: ${surface};
        color: ${primary};
        font-weight: 700;
      }
      .secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 20px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16);
        color: white;
      }
      .content {
        padding: 32px;
      }
      .card {
        padding: 24px;
        border-radius: 24px;
        background: ${secondary}10;
        border: 1px solid ${primary}18;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="shell">
        <section class="hero">
          <div class="eyebrow">${page.title}</div>
          <h1>${plan.brand}</h1>
          <p>${page.purpose}</p>
          <div class="actions">
            <div class="primary">${plan.ctaDirection}</div>
            <div class="secondary">${plan.tagline}</div>
          </div>
        </section>
        <section class="content">
          <div class="card">
            <h2 style="margin:0;font-size:28px;">${plan.brand} preview</h2>
            <p style="margin-top:12px;color:${primary};">${page.purpose}</p>
            <p style="margin-top:12px;color:${muted};">${plan.audience}</p>
          </div>
        </section>
      </div>
    </main>
  </body>
</html>`;
      })(),
    ]),
  );
}

function buildResponseFromIdea(
  startupIdea: string,
  styleSelection: string,
  outputMode: OutputModeSelection,
  preferredPalette?: string[] | null,
  existingProjectData?: AIProjectSnapshot | null,
  instructionNote?: string,
): AIGenerationResponse {
  const contentPlan = buildContentPlan(
    startupIdea,
    styleSelection,
    outputMode,
    preferredPalette,
    existingProjectData,
  );
  const sections = existingProjectData?.sections ?? buildSectionsFromPlan(contentPlan);
  const pages = buildPagesFromPlan(contentPlan, sections, existingProjectData);
  const htmlByPage = buildHtmlFromPages(contentPlan, pages, existingProjectData);

  return {
    contentPlan,
    brand: contentPlan.brand,
    tagline: contentPlan.tagline,
    audience: contentPlan.audience,
    productPositioning: contentPlan.productPositioning,
    tone: contentPlan.tone,
    styleDirection: contentPlan.styleDirection,
    keyFeatures: contentPlan.keyFeatures,
    ctaDirection: contentPlan.ctaDirection,
    pricingDirection: contentPlan.pricingDirection,
    testimonialsAppropriate: contentPlan.testimonialsAppropriate,
    bestOutputMode: contentPlan.bestOutputMode,
    palette: contentPlan.palette,
    templateType: contentPlan.templateType,
    siteMap: contentPlan.siteMap,
    pages,
    sections,
    htmlByPage,
    domainSuggestions:
      existingProjectData?.domainSuggestions ?? [
        `${slugify(contentPlan.brand)}.ai`,
        `use${slugify(contentPlan.brand)}.com`,
        `${slugify(contentPlan.brand)}hq.com`,
      ],
    notes: [
      `Generated with ${getConfiguredModel()}.`,
      "Planning-first generation completed before rendering pages.",
      `Style selection: ${styleSelection}.`,
      `Requested output mode: ${outputMode}.`,
      `Best inferred output mode: ${contentPlan.bestOutputMode}.`,
      ...(preferredPalette?.length ? [`Palette override applied: ${preferredPalette.join(", ")}.`] : []),
      ...(instructionNote ? [instructionNote] : []),
    ],
  };
}

function isOpenAIResponsesEndpoint(endpoint: string) {
  return endpoint.includes(OPENAI_RESPONSES_ENDPOINT);
}

function getConfiguredModel(endpoint?: string) {
  if (process.env.AI_MODEL?.trim()) {
    return process.env.AI_MODEL.trim();
  }

  if (endpoint && isOpenAIResponsesEndpoint(endpoint)) {
    return DEFAULT_OPENAI_MODEL;
  }

  return DEFAULT_FALLBACK_MODEL;
}

function buildProviderPrompt(
  task: "initial_generation" | "prompt_edit" | "section_regeneration",
  payload: Record<string, unknown>,
) {
  return JSON.stringify(
    {
      task,
      payload,
      instructions: {
        responseRequirements: [
          "Return structured JSON only.",
          "Keep page structure coherent and renderable.",
          "Include realistic htmlByPage strings with title, meta description, viewport meta, and at least one H1.",
          "Keep testimonials explicitly sample/generated unless grounded in provided real customer data.",
          "CRITICAL: If payload.palette is provided, the entire website (palette, sections, and htmlByPage styles) MUST use these exact hex colors. Do not suggest or use alternative colors.",
        ],
      },
    },
    null,
    2,
  );
}

function extractOpenAIText(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const body = responseBody as {
    output_text?: unknown;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text;
  }

  const text = body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  return text?.trim() ? text : null;
}

function normalizeOpenAIResponseShape(response: unknown) {
  if (!response || typeof response !== "object") {
    return response as Partial<AIGenerationResponse>;
  }

  const shaped = response as Partial<AIGenerationResponse> & {
    htmlByPageEntries?: Array<{ slug?: string; html?: string }>;
  };

  const htmlByPage =
    shaped.htmlByPageEntries?.length
      ? Object.fromEntries(
          shaped.htmlByPageEntries
            .filter((entry) => entry.slug?.trim() && entry.html?.trim())
            .map((entry) => [entry.slug!.trim(), entry.html!.trim()]),
        )
      : shaped.htmlByPage;

  return {
    ...shaped,
    htmlByPage,
  } as Partial<AIGenerationResponse>;
}

async function callOpenAIResponsesProvider(
  endpoint: string,
  apiKey: string,
  prompt: string,
) {
  const model = getConfiguredModel(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "site_generation_response",
          schema: generationResponseSchema,
          strict: true,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AIProviderError(
      `AI provider returned ${response.status}.${errorText ? ` ${errorText}` : ""}`,
    );
  }

  const responseBody = (await response.json()) as unknown;
  const outputText = extractOpenAIText(responseBody);

  if (!outputText) {
    throw new AIProviderError("AI provider returned no structured output.");
  }

  try {
    return normalizeOpenAIResponseShape(JSON.parse(outputText));
  } catch (error) {
    throw new AIProviderError(
      `AI provider returned invalid JSON.${error instanceof Error ? ` ${error.message}` : ""}`,
    );
  }
}

async function callConfiguredProvider(prompt: string) {
  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_API_ENDPOINT;
  const model = getConfiguredModel(endpoint);

  if (!apiKey || !endpoint) {
    return null;
  }

  if (isOpenAIResponsesEndpoint(endpoint)) {
    return callOpenAIResponsesProvider(endpoint, apiKey, prompt);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      response_format: "json",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AIProviderError(`AI provider returned ${response.status}.`);
  }

  return (await response.json()) as Partial<AIGenerationResponse>;
}

export async function generateInitialSite(
  input: InitialGenerationInput,
): Promise<AIGenerationResponse> {
  const providerResult = await callConfiguredProvider(
    buildProviderPrompt("initial_generation", {
      startupIdea: input.startupIdea,
      styleSelection: input.styleSelection,
      outputMode: input.outputMode,
      palette: input.palette ?? null,
      existingProjectData: input.existingProjectData ?? null,
    }),
  );

  if (providerResult) {
    return normalizeResponse(
      providerResult,
      input.startupIdea,
      input.styleSelection,
      input.outputMode,
      input.palette,
      input.existingProjectData,
    );
  }

  return buildResponseFromIdea(
    input.startupIdea,
    input.styleSelection,
    input.outputMode,
    input.palette,
    input.existingProjectData,
  );
}

export async function editGeneratedSite(
  input: PromptEditInput,
): Promise<AIGenerationResponse> {
  if (!input.existingProjectData) {
    throw new AIConfigurationError("Existing project data is required for prompt-based editing.");
  }

  const providerResult = await callConfiguredProvider(
    buildProviderPrompt("prompt_edit", {
      startupIdea: input.startupIdea,
      styleSelection: input.styleSelection,
      outputMode: input.outputMode,
      palette: input.palette ?? null,
      existingProjectData: input.existingProjectData,
      editInstructions: input.editInstructions,
    }),
  );

  if (providerResult) {
    return normalizeResponse(
      providerResult,
      input.startupIdea,
      input.styleSelection,
      input.outputMode,
      input.palette,
      input.existingProjectData,
    );
  }

  const base = buildResponseFromIdea(
    input.startupIdea,
    input.styleSelection,
    input.outputMode,
    input.palette,
    input.existingProjectData,
    `Edit instructions applied: ${input.editInstructions}`,
  );

  return applyEditInstructions(base, input.editInstructions);
}

export async function regenerateProjectSection(
  input: SectionRegenerationInput,
): Promise<AIGenerationResponse> {
  if (!input.existingProjectData) {
    throw new AIConfigurationError("Existing project data is required for section regeneration.");
  }

  const providerResult = await callConfiguredProvider(
    buildProviderPrompt("section_regeneration", {
      startupIdea: input.startupIdea,
      styleSelection: input.styleSelection,
      outputMode: input.outputMode,
      palette: input.palette ?? null,
      existingProjectData: input.existingProjectData,
      sectionId: input.sectionId,
      editInstructions: input.editInstructions ?? "",
    }),
  );

  if (providerResult) {
    return normalizeResponse(
      providerResult,
      input.startupIdea,
      input.styleSelection,
      input.outputMode,
      input.palette,
      input.existingProjectData,
    );
  }

  const base = buildResponseFromIdea(
    input.startupIdea,
    input.styleSelection,
    input.outputMode,
    input.palette,
    input.existingProjectData,
    `Section regenerated: ${input.sectionId}`,
  );

  return {
    ...base,
    sections: base.sections.map((section) =>
      section.id === input.sectionId
        ? {
            ...section,
            title: `${section.title} Refined for stronger clarity.`,
            description:
              input.editInstructions?.trim() ??
              `${section.description} This updated version sharpens the message and improves specificity.`,
          }
        : section,
    ),
  };
}
