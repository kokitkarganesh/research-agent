import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findOfficialWebsite,
  searchCompanyInfo,
} from "@/lib/serper";
import { crawlWebsite } from "@/lib/crawler";
import { analyzeCompany, DEFAULT_MODEL } from "@/lib/openrouter";
import { extractPhone, extractAddress } from "@/lib/extract";
import type { CompanyResearchResult, Competitor } from "@/lib/types";

export const maxDuration = 60; // allow the full pipeline time to run on Vercel

const requestSchema = z.object({
  input: z.string().min(1, "Please provide a company name or website URL."),
  model: z.string().optional(),
});

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim()) || /^[\w-]+\.[a-z]{2,}(\/|$)/i.test(input.trim());
}

function normalizeToUrl(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function guessCompanyNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return url;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    const { input, model } = parsed.data;
    const selectedModel = model || DEFAULT_MODEL;

    // Step 1: Resolve official website + working company name
    let website: string;
    let companyName: string;

    if (isUrl(input)) {
      website = normalizeToUrl(input);
      companyName = guessCompanyNameFromUrl(website);
    } else {
      companyName = input.trim();
      const found = await findOfficialWebsite(companyName);
      if (!found) {
        return NextResponse.json(
          {
            error: `Could not confidently determine an official website for "${companyName}". Try providing the URL directly.`,
          },
          { status: 404 }
        );
      }
      website = found.url;
    }

    // Step 2: Crawl the site (home, about, products, services, solutions, contact, pricing)
    const pages = await crawlWebsite(website);

    // Step 3: Public search for contact details + supporting info
    const { results: searchResults, knowledgeGraph } = await searchCompanyInfo(companyName);
    const searchSnippets = searchResults.map((r) => `${r.title}: ${r.snippet}`);
    const contactTexts = [
      ...searchSnippets,
      ...pages.filter((p) => p.type === "contact" || p.type === "home").map((p) => p.content),
    ];

    const phone =
      knowledgeGraph?.attributes?.["Phone"] || extractPhone(contactTexts);
    const address =
      knowledgeGraph?.attributes?.["Address"] || extractAddress(contactTexts);

    // Step 4: AI analysis (summary, products/services, pain points, competitor suggestions)
    const analysis = await analyzeCompany(
      companyName,
      website,
      pages,
      searchSnippets,
      selectedModel
    );

    // Step 5: Competitor analysis — AI suggests real competitor names (from its own
    // knowledge + crawled/search context), then we resolve each to a verified official
    // website via Serper. This avoids picking up "Best X Alternatives" listicle articles
    // as if they were competitor companies.
    const ownDomain = new URL(website).hostname.replace("www.", "");
    const competitors: Competitor[] = [];
    const seenDomains = new Set<string>([ownDomain]);

    const competitorLookups = await Promise.all(
      analysis.competitorNames.slice(0, 6).map(async (name) => {
        try {
          const found = await findOfficialWebsite(name);
          return found ? { name, website: found.url } : null;
        } catch {
          return null;
        }
      })
    );

    for (const result of competitorLookups) {
      if (!result) continue;
      try {
        const domain = new URL(result.website).hostname.replace("www.", "");
        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);
        competitors.push(result);
      } catch {
        continue;
      }
      if (competitors.length >= 5) break;
    }

    const result: CompanyResearchResult = {
      companyName,
      website,
      phone,
      address,
      productsServices: analysis.productsServices,
      painPoints: analysis.painPoints,
      summary: analysis.summary,
      competitors,
      sources: [website, ...searchResults.slice(0, 5).map((r) => r.link)],
      crawledPages: pages.map((p) => ({ url: p.url, type: p.type })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Research pipeline error:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
