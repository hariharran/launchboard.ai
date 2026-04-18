export type SeoCheckKey =
  | "titleTag"
  | "metaDescription"
  | "h1"
  | "imageAlt"
  | "viewportMeta"
  | "lang";

export type SeoCheckResult = {
  key: SeoCheckKey;
  label: string;
  passed: boolean;
  detail: string;
};

export type SeoSummary = {
  pageSlug: string;
  score: number;
  total: number;
  checks: SeoCheckResult[];
  checkedAt: string;
};

function getMatchValue(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseHtmlForSeo(html: string) {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const title = doc.querySelector("title")?.textContent?.trim() ?? "";
    const metaDescription =
      doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    const h1 = doc.querySelector("h1")?.textContent?.trim() ?? "";
    const viewport =
      doc.querySelector('meta[name="viewport"]')?.getAttribute("content")?.trim() ?? "";
    const images = Array.from(doc.querySelectorAll("img")).map((image) => ({
      alt: image.getAttribute("alt")?.trim() ?? "",
    }));

    return {
      title,
      metaDescription,
      h1,
      viewport,
      imageCount: images.length,
      imagesWithoutAlt: images.filter((image) => !image.alt).length,
    };
  }

  const imageMatches = [...html.matchAll(/<img\b[^>]*>/gi)];
  const imagesWithoutAlt = imageMatches.filter(
    (match) => !/\balt\s*=\s*(['"])\s*.+?\1/i.test(match[0]),
  ).length;

  function extractMetaContent(name: string) {
    const pattern = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`,
      "i"
    );
    const match = html.match(pattern);
    return (match?.[1] || match?.[2] || "").trim();
  }

  return {
    title: stripTags(getMatchValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    metaDescription: extractMetaContent("description"),
    h1: stripTags(getMatchValue(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    viewport: extractMetaContent("viewport"),
    lang: getMatchValue(html, /<html[^>]+lang=["']([^"']*)["']/i),
    imageCount: imageMatches.length,
    imagesWithoutAlt,
  };
}

export function runSeoQuickCheck(pageSlug: string, html: string): SeoSummary {
  const {
    title,
    metaDescription,
    h1,
    viewport,
    lang,
    imageCount,
    imagesWithoutAlt,
  } = parseHtmlForSeo(html);

  const checks: SeoCheckResult[] = [
    {
      key: "titleTag",
      label: "Title tag",
      passed: title.length > 0,
      detail: title.length > 0 ? title : "Missing <title> tag.",
    },
    {
      key: "metaDescription",
      label: "Meta description",
      passed: metaDescription.length > 0,
      detail:
        metaDescription.length > 0
          ? metaDescription
          : 'Missing <meta name="description">.',
    },
    {
      key: "h1",
      label: "H1 heading",
      passed: h1.length > 0,
      detail: h1.length > 0 ? h1 : "Missing H1 heading.",
    },
    {
      key: "imageAlt",
      label: "Image alt tags",
      passed: imageCount === 0 || imagesWithoutAlt === 0,
      detail:
        imageCount === 0
          ? "No images found, so alt coverage is clear."
          : imagesWithoutAlt === 0
            ? "All images include alt text."
            : `${imagesWithoutAlt} image(s) are missing alt text.`,
    },
    {
      key: "viewportMeta",
      label: "Responsive viewport meta",
      passed: viewport.length > 0,
      detail:
        viewport.length > 0
          ? viewport
          : 'Missing <meta name="viewport"> for responsive layout.',
    },
    {
      key: "lang",
      label: "HTML language attribute",
      passed: (lang || "").length > 0,
      detail: (lang || "").length > 0 ? `Language set to "${lang}".` : "Missing lang attribute on <html> tag.",
    },
  ];

  return {
    pageSlug,
    score: checks.filter((check) => check.passed).length,
    total: checks.length,
    checks,
    checkedAt: new Date().toISOString(),
  };
}
