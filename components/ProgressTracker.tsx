"use client";

const STAGES = ["Search", "Crawl", "Analyze", "Report"] as const;
export type Stage = (typeof STAGES)[number];

export function ProgressTracker({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center w-full max-w-md" role="status" aria-live="polite">
      {STAGES.map((stage, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                style={{
                  background: done || active ? "var(--accent)" : "var(--border)",
                  boxShadow: active ? "0 0 0 4px var(--accent-dim)" : "none",
                }}
              />
              <span
                className="text-[11px] font-mono tracking-wide uppercase transition-colors duration-300"
                style={{ color: done || active ? "var(--accent)" : "var(--muted)" }}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="h-px flex-1 mx-2 -mt-4 transition-colors duration-500"
                style={{ background: done ? "var(--accent)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { STAGES };
