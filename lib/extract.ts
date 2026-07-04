const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g;
const ADDRESS_HINT_WORDS = ["street", "st.", "ave", "avenue", "road", "rd.", "suite", "floor", "blvd", "city", "way"];

export function extractPhone(texts: string[]): string | undefined {
  for (const text of texts) {
    const matches = text.match(PHONE_REGEX);
    if (matches) {
      // filter out obvious non-phone numbers (years, short codes)
      const candidate = matches.find((m) => m.replace(/\D/g, "").length >= 8);
      if (candidate) return candidate.trim();
    }
  }
  return undefined;
}

export function extractAddress(texts: string[]): string | undefined {
  for (const text of texts) {
    const lower = text.toLowerCase();
    if (ADDRESS_HINT_WORDS.some((w) => lower.includes(w))) {
      // return the sentence/segment containing the hint, trimmed
      const idx = ADDRESS_HINT_WORDS.findIndex((w) => lower.includes(w));
      return text.trim().slice(0, 200);
    }
  }
  return undefined;
}
