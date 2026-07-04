"use client";

import type { CompanyResearchResult } from "@/lib/types";

export function ResearchResultCard({
  result,
  onDownloadPdf,
  downloading,
}: {
  result: CompanyResearchResult;
  onDownloadPdf: () => void;
  downloading: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-5 sm:p-6 space-y-5"
      style={{ background: "var(--panel)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-medium" style={{ color: "var(--text)" }}>
            {result.companyName}
          </h2>
          <a
            href={result.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            {result.website}
          </a>
        </div>
        <button
          onClick={onDownloadPdf}
          disabled={downloading}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>

      {/* Contact row */}
      {(result.phone || result.address) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono" style={{ color: "var(--muted)" }}>
          {result.phone && <span>{result.phone}</span>}
          {result.address && <span>{result.address}</span>}
        </div>
      )}

      {/* Summary */}
      <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
        {result.summary}
      </p>

      {/* Products / Services */}
      {result.productsServices.length > 0 && (
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
            Products &amp; Services
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.productsServices.map((item) => (
              <span
                key={item}
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pain points */}
      {result.painPoints.length > 0 && (
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: "var(--amber)" }}>
            AI-Identified Pain Points
          </h3>
          <ul className="space-y-1.5">
            {result.painPoints.map((point) => (
              <li key={point} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--amber)" }}>—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitors */}
      {result.competitors.length > 0 && (
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
            Competitors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.competitors.map((c) => (
              <a
                key={c.website}
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:border-[var(--accent)] transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <span style={{ color: "var(--text)" }}>{c.name}</span>
                <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                  {new URL(c.website).hostname.replace("www.", "")}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Crawled pages / sources footer */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        {result.crawledPages.map((p) => (
          <span
            key={p.url}
            className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded mt-2"
            style={{ background: "var(--panel-raised)", color: "var(--muted)" }}
          >
            {p.type}
          </span>
        ))}
      </div>
    </div>
  );
}
