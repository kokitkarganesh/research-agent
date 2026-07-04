import type { SerperOrganicResult } from "./types";

const SERPER_URL = "https://google.serper.dev/search";

interface SerperResponse {
  organic?: SerperOrganicResult[];
  knowledgeGraph?: {
    title?: string;
    website?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
}

async function serperRaw(query: string): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SERPER_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
    // Serper results change; never cache at the fetch layer
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Serper request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Basic domain sanity check to avoid picking directories/socials as "official site" */
const BLOCKED_DOMAINS = [
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "crunchbase.com",
  "wikipedia.org",
  "glassdoor.com",
  "indeed.com",
  "bloomberg.com",
  "g2.com",
  "trustpilot.com",
];

function isLikelyOfficialDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return !BLOCKED_DOMAINS.some((blocked) => host.includes(blocked));
  } catch {
    return false;
  }
}

/** Given a company name, find its most likely official website via Serper */
export async function findOfficialWebsite(
  companyName: string
): Promise<{ url: string; source: string } | null> {
  const data = await serperRaw(`${companyName} official website`);

  if (data.knowledgeGraph?.website && isLikelyOfficialDomain(data.knowledgeGraph.website)) {
    return { url: data.knowledgeGraph.website, source: "knowledge_graph" };
  }

  const firstValid = data.organic?.find((r) => isLikelyOfficialDomain(r.link));
  if (firstValid) {
    return { url: firstValid.link, source: firstValid.link };
  }

  return null;
}

/** General-purpose public info search (contact details, news, etc.) */
export async function searchCompanyInfo(
  companyName: string
): Promise<{ results: SerperOrganicResult[]; knowledgeGraph: SerperResponse["knowledgeGraph"] }> {
  const data = await serperRaw(`${companyName} company contact phone address`);
  return { results: data.organic ?? [], knowledgeGraph: data.knowledgeGraph };
}

/** Search for competitors of a company within an industry */
export async function searchCompetitors(
  companyName: string,
  industryHint?: string
): Promise<SerperOrganicResult[]> {
  const query = industryHint
    ? `top competitors of ${companyName} in ${industryHint}`
    : `top competitors of ${companyName}`;
  const data = await serperRaw(query);
  return (data.organic ?? []).filter((r) => isLikelyOfficialDomain(r.link));
}

export { isLikelyOfficialDomain };
