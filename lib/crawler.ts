import * as cheerio from "cheerio";
import type { CrawledPage, PageType } from "./types";

/** Minimal concurrency limiter (avoids ESM/webpack issues some npm limiter packages have with Next.js) */
function createLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const task = queue.shift()!;
    task();
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
  };
}

const MAX_PAGES = 6; // home + up to 5 discovered pages
const MAX_CONTENT_CHARS = 3000; // keep AI prompt size sane
const FETCH_TIMEOUT_MS = 8000;

const PAGE_TYPE_KEYWORDS: Record<Exclude<PageType, "home" | "other">, string[]> = {
  about: ["about", "about-us", "who-we-are", "company", "our-story", "team"],
  products: ["product", "products", "platform", "features"],
  services: ["service", "services", "what-we-do"],
  solutions: ["solution", "solutions", "use-case", "use-cases"],
  contact: ["contact", "contact-us", "get-in-touch", "support"],
  pricing: ["pricing", "plans", "plan", "cost"],
};

const IGNORE_KEYWORDS = [
  "login",
  "signin",
  "sign-in",
  "signup",
  "sign-up",
  "register",
  "account",
  "cart",
  "checkout",
  "privacy",
  "terms",
  "cookie",
  "career",
  "jobs",
  "blog", // blogs tend to be noisy/duplicated for this use case
];

function classifyPage(url: string, linkText: string): PageType {
  const haystack = `${url} ${linkText}`.toLowerCase();
  for (const [type, keywords] of Object.entries(PAGE_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) {
      return type as PageType;
    }
  }
  return "other";
}

function shouldIgnore(url: string): boolean {
  const lower = url.toLowerCase();
  return IGNORE_KEYWORDS.some((kw) => lower.includes(kw));
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CompanyResearchBot/1.0; +https://example.com/bot)",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractContent($: cheerio.CheerioAPI): string {
  $("script, style, noscript, svg, iframe, nav, footer").remove();
  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS);
}

function extractTitle($: cheerio.CheerioAPI): string {
  return $("title").first().text().trim() || $("h1").first().text().trim();
}

/** Discover candidate internal links classified by page type, deduped, login pages filtered */
function discoverLinks(html: string, baseUrl: string): { url: string; type: PageType }[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const found: { url: string; type: PageType }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      return;
    }
    const u = new URL(absolute);
    if (u.hostname.replace("www.", "") !== base.hostname.replace("www.", "")) return; // same-domain only

    const normalized = normalizeUrl(absolute);
    if (seen.has(normalized) || shouldIgnore(normalized)) return;

    const linkText = $(el).text();
    const type = classifyPage(normalized, linkText);
    if (type === "other") return; // only keep pages we recognize as relevant

    seen.add(normalized);
    found.push({ url: normalized, type });
  });

  return found;
}

export async function crawlWebsite(startUrl: string): Promise<CrawledPage[]> {
  const homeUrl = normalizeUrl(startUrl);
  const homeHtml = await fetchHtml(homeUrl);
  if (!homeHtml) {
    throw new Error(`Could not fetch website: ${homeUrl}`);
  }

  const $home = cheerio.load(homeHtml);
  const pages: CrawledPage[] = [
    {
      url: homeUrl,
      title: extractTitle($home),
      type: "home",
      content: extractContent($home),
    },
  ];

  const candidates = discoverLinks(homeHtml, homeUrl)
    .filter((c) => c.url !== homeUrl)
    .slice(0, MAX_PAGES - 1);

  // Keep at most one page per type to avoid redundant crawling (e.g. two "about" links)
  const byType = new Map<PageType, { url: string; type: PageType }>();
  for (const c of candidates) {
    if (!byType.has(c.type)) byType.set(c.type, c);
  }

  const limit = createLimiter(3);
  const crawled = await Promise.all(
    Array.from(byType.values()).map((c) =>
      limit(async () => {
        const html = await fetchHtml(c.url);
        if (!html) return null;
        const $page = cheerio.load(html);
        const page: CrawledPage = {
          url: c.url,
          title: extractTitle($page),
          type: c.type,
          content: extractContent($page),
        };
        return page;
      })
    )
  );

  for (const page of crawled) {
    if (page && page.content.length > 0) pages.push(page);
  }

  return pages;
}
