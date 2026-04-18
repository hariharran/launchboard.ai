import "server-only";

import type { AIGenerationResponse } from "@/types/ai";

export const domainExtensions = [".com", ".ai", ".io", ".co", ".app"] as const;

export type DomainAvailabilityState = "AVAILABLE" | "TAKEN" | "UNKNOWN";

export type DomainSuggestionResult = {
  domain: string;
  extension: string;
  fullDomain: string;
  availability: DomainAvailabilityState;
  price: number;
  isPremium: boolean;
  source: "auto" | "manual";
};

export class DomainLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainLookupError";
  }
}

type GoDaddyConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
};

const GODADDY_PRICE_CACHE = new Map<string, number>();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
}

function titleWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreSeed(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function estimatePricing(extension: string, isPremium: boolean, seed: number) {
  const base =
    extension === ".com"
      ? 18
      : extension === ".ai"
        ? 79
        : extension === ".io"
          ? 49
          : extension === ".app"
            ? 22
            : 16;

  if (isPremium) {
    return 180 + (seed % 420);
  }

  return base + (seed % 9);
}

function isPremiumDomain(domain: string, extension: string) {
  return domain.length <= 6 || (extension === ".com" && domain.length <= 8);
}

function inferAvailability(domain: string, extension: string): DomainSuggestionResult["availability"] {
  const seed = scoreSeed(`${domain}${extension}`);

  return seed % 4 === 0 ? "TAKEN" : "AVAILABLE";
}

function buildPatterns(brand: string, startupIdea: string, ai: AIGenerationResponse) {
  const brandSlug = slugify(brand);
  const words = titleWords(`${brand} ${startupIdea}`);
  const topKeyword = words.find((word) => word !== brandSlug) ?? words[1] ?? "hq";
  const shortened = brandSlug.slice(0, Math.max(4, Math.min(brandSlug.length, 8)));
  const joined = `${brandSlug}${topKeyword}`.slice(0, 18);

  return Array.from(
    new Set(
      [
        brandSlug,
        `use${brandSlug}`.slice(0, 18),
        `${brandSlug}hq`.slice(0, 18),
        `${brandSlug}app`.slice(0, 18),
        joined,
        `${shortened}labs`.slice(0, 18),
        slugify(ai.tagline.split(" ").slice(0, 2).join("")),
      ].filter(Boolean),
    ),
  );
}

function getGoDaddyConfig(): GoDaddyConfig | null {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;
  const useOte = process.env.GODADDY_USE_OTE === "true";
  const baseUrl = useOte ? "https://api.ote-godaddy.com" : "https://api.godaddy.com";

  if (!apiKey || !apiSecret) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    baseUrl,
  };
}

function requireGoDaddyConfig() {
  const config = getGoDaddyConfig();

  if (!config) {
    throw new DomainLookupError(
      "Live domain lookup is not configured. Add valid GoDaddy API credentials to use manual domain search.",
    );
  }

  if (process.env.GODADDY_USE_OTE === "true") {
    throw new DomainLookupError(
      "Manual domain search is running in GoDaddy OTE mode. Switch GODADDY_USE_OTE to false for real availability.",
    );
  }

  return config;
}

async function callGoDaddy<T>(config: GoDaddyConfig, path: string) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `sso-key ${config.apiKey}:${config.apiSecret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    try {
      const parsed = JSON.parse(text) as { code?: string; message?: string };

      if (parsed.code === "UNABLE_TO_AUTHENTICATE") {
        throw new DomainLookupError(
          "GoDaddy authentication failed. Check GODADDY_API_KEY, GODADDY_API_SECRET, and whether GODADDY_USE_OTE matches the type of credentials you created.",
        );
      }

      if (parsed.message?.trim()) {
        throw new DomainLookupError(parsed.message.trim());
      }
    } catch (error) {
      if (error instanceof DomainLookupError) {
        throw error;
      }
    }

    throw new DomainLookupError(
      text || `GoDaddy request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

async function getGoDaddyPriceEstimate(config: GoDaddyConfig, fullDomain: string) {
  if (GODADDY_PRICE_CACHE.has(fullDomain)) {
    return GODADDY_PRICE_CACHE.get(fullDomain) ?? null;
  }

  try {
    const result = await callGoDaddy<{ price?: number; purchasePrice?: number }>(
      config,
      `/v1/domains/available?domain=${encodeURIComponent(fullDomain)}&checkType=FAST&forTransfer=false`,
    );
    const price = result.price ?? result.purchasePrice ?? null;

    if (price !== null && Number.isFinite(price)) {
      GODADDY_PRICE_CACHE.set(fullDomain, price);
    }

    return price;
  } catch {
    return null;
  }
}

async function getLiveResultsForDomains(
  fullDomains: string[],
  source: "auto" | "manual",
): Promise<DomainSuggestionResult[] | null> {
  const config = source === "manual" ? requireGoDaddyConfig() : getGoDaddyConfig();

  if (!config) {
    return null;
  }

  const results = await Promise.all(
    fullDomains.map(async (fullDomain) => {
      const normalized = fullDomain.toLowerCase();
      const dotIndex = normalized.lastIndexOf(".");
      const domain = dotIndex >= 0 ? normalized.slice(0, dotIndex) : normalized;
      const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : "";
      const result = await callGoDaddy<{
        domain?: string;
        available?: boolean;
        price?: number;
        purchasePrice?: number;
        definitivelyTaken?: boolean;
      }>(
        config,
        `/v1/domains/available?domain=${encodeURIComponent(normalized)}&checkType=FAST&forTransfer=false`,
      );
      const fallbackEstimate = estimatePricing(
        extension,
        isPremiumDomain(domain, extension),
        scoreSeed(normalized),
      );
      const livePrice =
        result.price ??
        result.purchasePrice ??
        (result.available ? await getGoDaddyPriceEstimate(config, normalized) : null);
      const availability =
        result.available === true
          ? "AVAILABLE"
          : result.available === false || result.definitivelyTaken === true
            ? "TAKEN"
            : "UNKNOWN";
      const isPremium =
        availability === "AVAILABLE" &&
        typeof livePrice === "number" &&
        livePrice > fallbackEstimate * 2;

      return {
        domain,
        extension,
        fullDomain: normalized,
        availability,
        price: typeof livePrice === "number" ? livePrice : fallbackEstimate,
        isPremium,
        source,
      } satisfies DomainSuggestionResult;
    }),
  );

  return results;
}

function buildMockResults(fullDomains: string[], source: "auto" | "manual") {
  return fullDomains.map((fullDomain) => {
    const normalized = fullDomain.toLowerCase();
    const dotIndex = normalized.lastIndexOf(".");
    const domain = dotIndex >= 0 ? normalized.slice(0, dotIndex) : normalized;
    const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : "";
    const availability = inferAvailability(domain, extension);
    const seed = scoreSeed(`${domain}${extension}`);
    const isPremium = isPremiumDomain(domain, extension);

    return {
      domain,
      extension,
      fullDomain: normalized,
      availability,
      price: estimatePricing(extension, isPremium, seed),
      isPremium,
      source,
    } satisfies DomainSuggestionResult;
  });
}

export async function generateDomainSuggestions(
  startupIdea: string,
  generatedSite: AIGenerationResponse,
): Promise<DomainSuggestionResult[]> {
  const patterns = buildPatterns(generatedSite.brand, startupIdea, generatedSite);
  const fullDomains = patterns.flatMap((pattern) =>
    domainExtensions.map((extension) => `${pattern}${extension}`),
  );

  return (await getLiveResultsForDomains(fullDomains, "auto")) ?? buildMockResults(fullDomains, "auto");
}

export async function searchCustomDomain(query: string): Promise<DomainSuggestionResult[]> {
  const normalized = query.trim().toLowerCase().replace(/^www\./, "");
  const exactExtension = domainExtensions.find((extension) => normalized.endsWith(extension));
  const fullDomains = exactExtension
    ? [normalized]
    : domainExtensions.map((extension) => `${normalized}${extension}`);

  const liveResults = await getLiveResultsForDomains(fullDomains, "manual");

  if (!liveResults) {
    throw new DomainLookupError(
      "Manual domain search could not reach the live provider. Please verify GoDaddy configuration.",
    );
  }

  return liveResults;
}
