import type { CrawledPage } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL = "openai/gpt-oss-20b:free";

export interface AIAnalysis {
  summary: string;
  productsServices: string[];
  painPoints: string[];
  competitorNames: string[];
  industry: string;
}

async function callOpenRouter(
  model: string,
  messages: { role: "system" | "user"; content: string }[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter uses these for their public leaderboard/attribution — harmless to include
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Company Research Agent",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content.");
  return content;
}

function buildAnalysisPrompt(
  companyName: string,
  website: string,
  pages: CrawledPage[],
  searchSnippets: string[]
): { role: "system" | "user"; content: string }[] {
  const crawledText = pages
    .map((p) => `### ${p.type.toUpperCase()} PAGE (${p.url})\n${p.content}`)
    .join("\n\n")
    .slice(0, 12000); // keep total prompt manageable across models

  const searchText = searchSnippets.join("\n").slice(0, 2000);

  const system = `You are a B2B research analyst. You will be given crawled website content and public search snippets about a company. Respond ONLY with a valid JSON object matching this exact shape, no markdown fences, no commentary:
{
  "summary": string (2-4 sentences, factual, no fluff),
  "productsServices": string[] (concise, 3-8 items),
  "painPoints": string[] (3-6 plausible business pain points this company likely faces, inferred from their market/offerings, phrased as sales-relevant insights),
  "competitorNames": string[] (3-6 real, named competitor companies in the same industry),
  "industry": string (short industry label, e.g. "B2B SaaS - CRM")
}`;

  const user = `Company: ${companyName}
Website: ${website}

CRAWLED WEBSITE CONTENT:
${crawledText || "(no content could be crawled)"}

PUBLIC SEARCH SNIPPETS:
${searchText || "(none found)"}

Analyze this company and return the JSON object described.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function analyzeCompany(
  companyName: string,
  website: string,
  pages: CrawledPage[],
  searchSnippets: string[],
  model: string = DEFAULT_MODEL
): Promise<AIAnalysis> {
  const messages = buildAnalysisPrompt(companyName, website, pages, searchSnippets);
  const raw = await callOpenRouter(model, messages);

  let parsed: Partial<AIAnalysis>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Some models ignore response_format; try to salvage JSON from the text
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response was not valid JSON.");
    parsed = JSON.parse(match[0]);
  }

  return {
    summary: parsed.summary ?? "",
    productsServices: parsed.productsServices ?? [],
    painPoints: parsed.painPoints ?? [],
    competitorNames: parsed.competitorNames ?? [],
    industry: parsed.industry ?? "",
  };
}
