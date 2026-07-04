import { NextResponse } from "next/server";

function inspect(name: string) {
  const raw = process.env[name];
  if (raw === undefined) {
    return { present: false, note: "undefined — variable not set for this environment" };
  }
  const trimmed = raw.trim();
  return {
    present: true,
    length: raw.length,
    trimmedLength: trimmed.length,
    hasLeadingOrTrailingWhitespace: raw !== trimmed,
    startsWithQuote: raw.startsWith('"') || raw.startsWith("'"),
    endsWithQuote: raw.endsWith('"') || raw.endsWith("'"),
    preview: `${raw.slice(0, 4)}...${raw.slice(-4)}`,
  };
}

export async function GET() {
  return NextResponse.json({
    SERPER_API_KEY: inspect("SERPER_API_KEY"),
    OPENROUTER_API_KEY: inspect("OPENROUTER_API_KEY"),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
