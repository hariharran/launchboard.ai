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

  const htmlByPage = buildHtmlFromPages(contentPlan, pages);
  const projectFiles = buildProjectFilesFromPages(contentPlan, pages, htmlByPage);

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
    projectFiles,
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
    const htmlByPage = buildHtmlFromPages(stripped.contentPlan, stripped.pages);

    return {
      ...stripped,
      htmlByPage,
      projectFiles: buildProjectFilesFromPages(stripped.contentPlan, stripped.pages, htmlByPage),
    };
  }

  if (lower.includes("add faq")) {
    const withFaq = addFaqSection(next);
    const htmlByPage = buildHtmlFromPages(withFaq.contentPlan, withFaq.pages);

    return {
      ...withFaq,
      htmlByPage,
      projectFiles: buildProjectFilesFromPages(withFaq.contentPlan, withFaq.pages, htmlByPage),
    };
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

  const htmlByPage = buildHtmlFromPages(next.contentPlan, next.pages);

  return {
    ...next,
    htmlByPage,
    projectFiles: buildProjectFilesFromPages(next.contentPlan, next.pages, htmlByPage),
  };
}

function buildHtmlFromPages(
  plan: AIContentPlan,
  pages: AIGenerationResponse["pages"],
) {
  const [primary = "#0F172A", secondary = "#2563EB", accent = "#22C55E", surface = "#F8FAFC", muted = "#E2E8F0"] =
    plan.palette;

  const pageHref = (slug: string) => (slug === "home" ? "/" : `/${slug}`);
  const getPageLabel = (slug: string, fallbackTitle: string, index: number) => {
    if (slug === "home") {
      return "Home";
    }

    const siteMapMatch = plan.siteMap[index];
    if (siteMapMatch?.trim()) {
      return siteMapMatch.trim();
    }

    return fallbackTitle.trim() || slug.replace(/-/g, " ").replace(/\w/g, (match) => match.toUpperCase());
  };

  const featureCards = plan.keyFeatures
    .map(
      (feature) => `
        <article class="card feature-card">
          <span class="mini-badge">Feature</span>
          <h3>${escapeHtml(feature.title)}</h3>
          <p>${escapeHtml(feature.description)}</p>
        </article>`,
    )
    .join("");

  const exampleTestimonials = [
    `“${plan.brand} makes consistency feel visible and motivating instead of lonely.”`,
    `“The social accountability loop helped our group actually finish the challenge.”`,
    `“It feels premium, focused, and much easier to stick with every day.”`,
  ];

  const pricingCards = [
    ["Free", "Start with solo tracking, simple streaks, and a clean daily rhythm."],
    ["Pro", "Unlock challenge tools, better reminders, public progress, and deeper accountability."],
    ["Team", "Run community habits, private groups, and leaderboards at scale."],
  ]
    .map(
      ([name, description], index) => `
        <article class="card pricing-card${index === 1 ? " pricing-card-featured" : ""}">
          <span class="mini-badge">${escapeHtml(name)}</span>
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(description)}</p>
        </article>`,
    )
    .join("");

  const renderSection = (
    section: AIGenerationResponse["sections"][number],
    page: AIGenerationResponse["pages"][number],
    index: number,
  ) => {
    const title = escapeHtml(section.title);
    const description = escapeHtml(section.description);
    const ctaLabel = section.ctaLabel ? escapeHtml(section.ctaLabel) : null;
    const pageTitle = escapeHtml(page.title);
    const pagePurpose = escapeHtml(page.purpose);

    if (index === 0 || section.type === "hero") {
      return `
        <section class="hero-grid section-block" id="${escapeHtml(section.id)}">
          <div>
            <span class="eyebrow">${pageTitle}</span>
            <h1>${title}</h1>
            <p class="lede">${description}</p>
            <div class="actions">
              <a class="btn btn-primary" href="${pageHref(page.slug)}">${ctaLabel ?? "Get started"}</a>
              <a class="btn btn-secondary" href="${pages.length > 1 ? pageHref(pages[Math.min(1, pages.length - 1)].slug) : '#details'}">${escapeHtml(plan.tagline)}</a>
            </div>
            <div class="trust-line">${escapeHtml(plan.audience)}</div>
          </div>
          <aside class="hero-panel">
            <div class="hero-panel-card">
              <span class="mini-badge">${escapeHtml(plan.templateType)}</span>
              <h3>${escapeHtml(plan.brand)}</h3>
              <p>${escapeHtml(plan.productPositioning)}</p>
            </div>
            <div class="metric-row">
              <div class="metric-card">
                <strong>${escapeHtml(plan.keyFeatures[0]?.title ?? "Focused value")}</strong>
                <span>${escapeHtml(plan.keyFeatures[0]?.description ?? pagePurpose)}</span>
              </div>
              <div class="metric-card">
                <strong>${escapeHtml(plan.keyFeatures[1]?.title ?? "Clear momentum")}</strong>
                <span>${escapeHtml(plan.keyFeatures[1]?.description ?? description)}</span>
              </div>
            </div>
          </aside>
        </section>`;
    }

    if (["feature-grid", "benefit-grid", "value-grid"].includes(section.type)) {
      return `
        <section class="section-block" id="${escapeHtml(section.id)}">
          <div class="section-heading">
            <span class="eyebrow eyebrow-dark">Highlights</span>
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
          <div class="grid grid-3">
            ${featureCards}
          </div>
        </section>`;
    }

    if (["pricing", "pricing-cards"].includes(section.type)) {
      return `
        <section class="section-block" id="${escapeHtml(section.id)}">
          <div class="section-heading">
            <span class="eyebrow eyebrow-dark">Pricing</span>
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
          <div class="grid grid-3">
            ${pricingCards}
          </div>
        </section>`;
    }

    if (["testimonials", "logos"].includes(section.type)) {
      const cards = exampleTestimonials
        .map(
          (quote, quoteIndex) => `
            <article class="card quote-card">
              <p>${escapeHtml(quote)}</p>
              <span>Sample member ${quoteIndex + 1}</span>
            </article>`,
        )
        .join("");

      return `
        <section class="section-block" id="${escapeHtml(section.id)}">
          <div class="section-heading">
            <span class="eyebrow eyebrow-dark">Community</span>
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
          <div class="grid grid-3">
            ${cards}
          </div>
        </section>`;
    }

    if (["steps", "listing-grid", "cards", "category-cards", "contact-grid", "filter-panel"].includes(section.type)) {
      const entries = (section.type === "steps"
        ? [
          ["Start", "Create your flow, choose your focus, and set the cadence that fits your routine."],
          ["Join", "Bring in a partner, team, or community to add visible accountability."],
          ["Keep going", "Use reminders, streaks, and progress visibility to maintain momentum."],
        ]
        : plan.keyFeatures.slice(0, 3).map((feature) => [feature.title, feature.description]))
        .map(
          ([entryTitle, entryDescription], entryIndex) => `
            <article class="card step-card">
              <span class="step-index">0${entryIndex + 1}</span>
              <h3>${escapeHtml(entryTitle)}</h3>
              <p>${escapeHtml(entryDescription)}</p>
            </article>`,
        )
        .join("");

      return `
        <section class="section-block" id="${escapeHtml(section.id)}">
          <div class="section-heading">
            <span class="eyebrow eyebrow-dark">Details</span>
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
          <div class="grid grid-3">
            ${entries}
          </div>
        </section>`;
    }

    if (section.type === "cta") {
      return `
        <section class="section-block" id="${escapeHtml(section.id)}">
          <div class="cta-band">
            <div>
              <span class="eyebrow">Next step</span>
              <h2>${title}</h2>
              <p>${description}</p>
            </div>
            <a class="btn btn-light" href="${pageHref(page.slug)}">${ctaLabel ?? "Get started"}</a>
          </div>
        </section>`;
    }

    return `
      <section class="section-block" id="${escapeHtml(section.id)}">
        <div class="section-heading">
          <span class="eyebrow eyebrow-dark">Section</span>
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <article class="card content-card">
          <h3>${pageTitle}</h3>
          <p>${pagePurpose}</p>
          ${ctaLabel ? `<a class="text-link" href="${pageHref(page.slug)}">${ctaLabel} →</a>` : ""}
        </article>
      </section>`;
  };

  return Object.fromEntries(
    pages.map((page) => {
      const navItems = pages
        .map((navPage, index) => {
          const isActivePage = navPage.slug === page.slug;

          return `<a class="nav-link${isActivePage ? " nav-link-active" : ""}" href="${pageHref(navPage.slug)}"${isActivePage ? ' aria-current="page"' : ""}>${escapeHtml(getPageLabel(navPage.slug, navPage.title, index))}</a>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(page.purpose || plan.tagline)}" />
    <title>${escapeHtml(page.title)} | ${escapeHtml(plan.brand)}</title>
    <style>
      :root {
        --brand-primary: ${primary};
        --brand-secondary: ${secondary};
        --brand-accent: ${accent};
        --brand-surface: ${surface};
        --brand-muted: ${muted};
        --brand-ink: ${primary};
        --brand-card: #ffffff;
        --brand-line: color-mix(in srgb, ${primary} 12%, white);
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        color: var(--brand-ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, color-mix(in srgb, ${secondary} 14%, transparent) 0, transparent 32%),
          radial-gradient(circle at top right, color-mix(in srgb, ${accent} 10%, transparent) 0, transparent 28%),
          linear-gradient(180deg, var(--brand-surface), #ffffff 70%);
      }
      a { color: inherit; text-decoration: none; }
      .page-shell {
        max-width: 1280px;
        margin: 24px auto;
        padding: 0 24px 48px;
      }
      .frame {
        overflow: hidden;
        border-radius: 32px;
        border: 1px solid var(--brand-line);
        background: rgba(255,255,255,0.78);
        box-shadow: 0 30px 80px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(14px);
      }
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        padding: 22px 28px;
        border-bottom: 1px solid var(--brand-line);
        background: rgba(255,255,255,0.88);
      }
      .brandmark {
        display: inline-flex;
        align-items: center;
        gap: 14px;
        font-weight: 800;
        letter-spacing: -0.04em;
        font-size: 18px;
      }
      .brandmark-badge {
        width: 54px;
        height: 54px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: white;
        background: linear-gradient(145deg, var(--brand-primary), color-mix(in srgb, var(--brand-secondary) 70%, var(--brand-primary)));
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
      }
      .nav {
        display: flex;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
      }
      .nav-link {
        position: relative;
        padding: 10px 14px;
        border-radius: 999px;
        color: color-mix(in srgb, var(--brand-primary) 64%, white);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        font-weight: 700;
        transition: color 180ms ease, opacity 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
      }
      .nav-link-active {
        color: var(--brand-primary);
        font-weight: 900;
        background: color-mix(in srgb, var(--brand-secondary) 14%, white);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-secondary) 18%, white);
      }
      .nav-link:hover {
        color: var(--brand-primary);
        background: color-mix(in srgb, var(--brand-primary) 6%, white);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 14px 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .btn-primary {
        background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
        color: white;
        box-shadow: 0 16px 34px color-mix(in srgb, var(--brand-secondary) 26%, transparent);
      }
      .btn-secondary {
        border: 1px solid var(--brand-line);
        background: rgba(255,255,255,0.78);
        color: var(--brand-primary);
      }
      .btn-light {
        background: white;
        color: var(--brand-primary);
      }
      .main {
        padding: 20px;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
        gap: 28px;
        align-items: stretch;
      }
      .section-block {
        padding: 28px;
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.76));
        border: 1px solid var(--brand-line);
        margin-bottom: 20px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border-radius: 999px;
        padding: 10px 16px;
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(255,255,255,0.76);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        color: var(--brand-primary);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .eyebrow-dark {
        background: color-mix(in srgb, var(--brand-secondary) 10%, white);
        border-color: color-mix(in srgb, var(--brand-secondary) 18%, white);
      }
      h1, h2, h3 {
        margin: 0;
        color: var(--brand-primary);
        letter-spacing: -0.05em;
      }
      h1 {
        margin-top: 24px;
        font-size: clamp(3.4rem, 7vw, 6.6rem);
        line-height: 0.95;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
      }
      h2 {
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
      }
      h3 {
        font-size: 1.3rem;
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: color-mix(in srgb, var(--brand-primary) 72%, white);
        font-size: 1.04rem;
        line-height: 1.8;
      }
      .lede {
        margin-top: 22px;
        max-width: 680px;
        font-size: 1.32rem;
      }
      .actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 30px;
      }
      .trust-line {
        margin-top: 26px;
        padding-top: 18px;
        border-top: 1px solid var(--brand-line);
        color: color-mix(in srgb, var(--brand-primary) 58%, white);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 12px;
        font-weight: 800;
      }
      .hero-panel {
        display: grid;
        gap: 18px;
      }
      .hero-panel-card,
      .metric-card,
      .card {
        border-radius: 24px;
        background: var(--brand-card);
        border: 1px solid var(--brand-line);
        box-shadow: 0 20px 48px rgba(15, 23, 42, 0.06);
      }
      .hero-panel-card {
        padding: 24px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--brand-surface) 82%, white), white);
      }
      .hero-panel-card p {
        margin-top: 14px;
      }
      .metric-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
      }
      .metric-card {
        padding: 20px;
        background: linear-gradient(160deg, color-mix(in srgb, var(--brand-primary) 92%, white), color-mix(in srgb, var(--brand-secondary) 44%, var(--brand-primary)));
      }
      .metric-card strong,
      .metric-card span {
        display: block;
        color: white;
      }
      .metric-card span {
        margin-top: 10px;
        line-height: 1.7;
        color: rgba(255,255,255,0.78);
      }
      .section-heading {
        max-width: 760px;
        margin-bottom: 24px;
      }
      .section-heading p {
        margin-top: 14px;
        font-size: 1.12rem;
      }
      .grid {
        display: grid;
        gap: 18px;
      }
      .grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .feature-card,
      .step-card,
      .quote-card,
      .pricing-card,
      .content-card {
        padding: 24px;
      }
      .feature-card p,
      .step-card p,
      .quote-card p,
      .pricing-card p,
      .content-card p {
        margin-top: 14px;
      }
      .mini-badge {
        display: inline-flex;
        margin-bottom: 14px;
        padding: 7px 11px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--brand-secondary) 12%, white);
        color: var(--brand-secondary);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .step-index {
        display: inline-flex;
        margin-bottom: 14px;
        color: var(--brand-secondary);
        font-weight: 900;
        letter-spacing: -0.04em;
      }
      .pricing-card-featured {
        border-color: color-mix(in srgb, var(--brand-secondary) 42%, white);
        box-shadow: 0 20px 60px color-mix(in srgb, var(--brand-secondary) 18%, transparent);
      }
      .quote-card span {
        display: block;
        margin-top: 18px;
        color: color-mix(in srgb, var(--brand-primary) 52%, white);
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .cta-band {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 34px;
        border-radius: 28px;
        background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary), var(--brand-accent));
      }
      .cta-band h2,
      .cta-band p {
        color: white;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        padding: 24px 28px 30px;
        border-top: 1px solid var(--brand-line);
        color: color-mix(in srgb, var(--brand-primary) 58%, white);
      }
      .footer a {
        margin-left: 16px;
      }
      .text-link {
        display: inline-flex;
        margin-top: 18px;
        color: var(--brand-secondary);
        font-weight: 800;
      }
      @media (max-width: 980px) {
        .topbar,
        .cta-band,
        .hero-grid {
          grid-template-columns: 1fr;
          flex-direction: column;
          align-items: flex-start;
        }
        .nav {
          gap: 14px;
        }
        .grid-3 {
          grid-template-columns: 1fr;
        }
        .page-shell {
          padding: 0 14px 28px;
        }
        .main,
        .topbar,
        .footer {
          padding-left: 18px;
          padding-right: 18px;
        }
        .section-block {
          padding: 22px;
        }
      }
    </style>
  </head>
  <body>
    <div class="page-shell">
      <div class="frame">
        <header class="topbar">
          <div class="brandmark">
            <div class="brandmark-badge">✦</div>
            <div>${escapeHtml(plan.brand)}</div>
          </div>
          <nav class="nav">${navItems}</nav>
          <a class="btn btn-primary" href="${pageHref(page.slug)}">${escapeHtml(page.sections[0]?.ctaLabel ?? "Get started")}</a>
        </header>
        <main class="main">
          ${page.sections.map((section, index) => renderSection(section, page, index)).join("")}
        </main>
        <footer class="footer">
          <div>© ${escapeHtml(plan.brand)}. ${escapeHtml(plan.tagline)}</div>
          <div>
            ${pages
          .slice(0, Math.min(3, pages.length))
          .map(
            (linkedPage, index) =>
              `<a href="${pageHref(linkedPage.slug)}">${escapeHtml(getPageLabel(linkedPage.slug, linkedPage.title, index))}</a>`,
          )
          .join("")}
          </div>
        </footer>
      </div>
    </div>
  </body>
</html>`;

      return [page.slug, html];
    }),
  );
}

function buildProjectFilesFromPages(
  plan: AIContentPlan,
  pages: AIGenerationResponse["pages"],
  htmlByPage: Record<string, string>,
) {
  const projectData = {
    brand: plan.brand,
    tagline: plan.tagline,
    pages: pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      purpose: page.purpose,
    })),
    htmlByPage,
  };

  return {
    "app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(plan.brand)},
  description: ${JSON.stringify(plan.tagline)},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    "app/globals.css": `* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, ${plan.palette[1] ?? "#2563EB"} 16%, transparent) 0, transparent 30%),
    linear-gradient(180deg, ${plan.palette[3] ?? "#F8FAFC"}, #ffffff 70%);
  color: ${plan.palette[0] ?? "#0F172A"};
}
`,
    "generated/site-project.ts": `export const siteProject = ${JSON.stringify(projectData, null, 2)} as const;

export type GeneratedSiteProject = typeof siteProject;
`,
    "components/generated-site-shell.tsx": `"use client";

import { useMemo } from "react";

import type { GeneratedSiteProject } from "@/generated/site-project";

type GeneratedSiteShellProps = {
  site: GeneratedSiteProject;
  slug: string;
};

export function GeneratedSiteShell({ site, slug }: GeneratedSiteShellProps) {
  const html = useMemo(
    () =>
      site.htmlByPage[slug] ??
      site.htmlByPage.home ??
      "<!DOCTYPE html><html lang=\\"en\\"><head><meta charset=\\"UTF-8\\" /><title>Preview unavailable</title></head><body style=\\"font-family:Inter,Arial,sans-serif;padding:24px;\\">Preview unavailable.</body></html>",
    [site, slug],
  );

  return (
    <main style={{ minHeight: "100vh", padding: "24px" }}>
      <iframe
        title={\`\${site.brand} \${slug}\`}
        srcDoc={html}
        style={{
          width: "100%",
          height: "calc(100vh - 48px)",
          border: 0,
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
        }}
      />
    </main>
  );
}
`,
    "app/page.tsx": `import { GeneratedSiteShell } from "@/components/generated-site-shell";
import { siteProject } from "@/generated/site-project";

export default function HomePage() {
  return <GeneratedSiteShell site={siteProject} slug="home" />;
}
`,
    "app/[slug]/page.tsx": `import { notFound } from "next/navigation";

import { GeneratedSiteShell } from "@/components/generated-site-shell";
import { siteProject } from "@/generated/site-project";

type GeneratedPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function GeneratedPage({ params }: GeneratedPageProps) {
  const { slug } = await params;
  const pageExists = siteProject.pages.some((page) => page.slug === slug);

  if (!pageExists) {
    notFound();
  }

  return <GeneratedSiteShell site={siteProject} slug={slug} />;
}
`,
  };
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
  const htmlByPage = buildHtmlFromPages(contentPlan, pages);
  const projectFiles = buildProjectFilesFromPages(contentPlan, pages, htmlByPage);

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
    projectFiles,
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
      "Generated App Router project scaffold included.",
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
          "Keep page structure coherent, renderable, and production-oriented.",
          "The design should feel like a polished modern startup website, not a plain document or wireframe.",
          "Treat the structured pages and sections as the visual source of truth.",
          "htmlByPage must faithfully reflect the same pages, sections, hierarchy, and CTA intent described in the structured output.",
          "Do not output simplified placeholder markup when richer navigation, layout, or sections are defined.",
          "Each htmlByPage page must include a real visible website structure with appropriate layout blocks such as header/navigation, hero, supporting sections, CTA areas, and footer where relevant.",
          "Use semantic, production-quality HTML with clear hierarchy, intentional spacing, and polished content grouping.",
          "Do not output bare text stacked in a document-like layout.",
          "Preserve a premium landing-page feel with strong hero composition, clean section rhythm, and clear conversion flow.",
          "Include realistic htmlByPage strings with title, meta description, viewport meta, and at least one H1.",
          "If a navigation is implied by the site map, include it in htmlByPage.",
          "If multiple sections exist in the structured page definition, htmlByPage must visibly represent those sections rather than collapsing them into one block.",
          "Keep testimonials explicitly sample/generated unless grounded in provided real customer data.",
          "CRITICAL: htmlByPage should look like a client-ready final website, not a fallback export.",
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

  const sections = base.sections.map((section) =>
    section.id === input.sectionId
      ? {
        ...section,
        title: `${section.title} Refined for stronger clarity.`,
        description:
          input.editInstructions?.trim() ??
          `${section.description} This updated version sharpens the message and improves specificity.`,
      }
      : section,
  );
  const pages = base.pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) =>
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
  }));
  const htmlByPage = buildHtmlFromPages(base.contentPlan, pages);

  return {
    ...base,
    sections,
    pages,
    htmlByPage,
    projectFiles: buildProjectFilesFromPages(base.contentPlan, pages, htmlByPage),
  };
}
