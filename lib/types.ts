export interface CrawledPage {
  url: string;
  title: string;
  type: PageType;
  content: string;
}

export type PageType =
  | "home"
  | "about"
  | "products"
  | "services"
  | "solutions"
  | "contact"
  | "pricing"
  | "other";

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
}

export interface CompanyContact {
  phone?: string;
  address?: string;
}

export interface Competitor {
  name: string;
  website: string;
}

export interface CompanyResearchResult {
  companyName: string;
  website: string;
  phone?: string;
  address?: string;
  productsServices: string[];
  painPoints: string[];
  summary: string;
  competitors: Competitor[];
  sources: string[];
  crawledPages: { url: string; type: PageType }[];
}

export interface ResearchRequest {
  input: string; // company name OR url
  model?: string; // OpenRouter model id, optional
}
