"use client";

import { useState, useRef, useEffect } from "react";
import type { CompanyResearchResult, Competitor } from "@/lib/types";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "progress"; stageIndex: number }
  | { id: string; role: "assistant"; kind: "result"; result: CompanyResearchResult }
  | { id: string; role: "assistant"; kind: "error"; message: string };

const STAGE_TIMINGS_MS = [800, 3500, 6000];

const STAGES = [
  { label: "Crawling website", icon: "🔍" },
  { label: "AI analyzing", icon: "🧠" },
  { label: "Generating report", icon: "📄" },
];

const EXAMPLES = ["Stripe", "OpenAI", "Tesla", "Shopify"];

const MODEL_OPTIONS = [
  { value: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (free)" },
  { value: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B (free)" },
  { value: "google/gemini-flash-1.5:free", label: "Gemini Flash 1.5 (free)" },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

// ---------- Inline sub-components ----------

function Sidebar({ onNewResearch }: { onNewResearch: () => void }) {
  const [active, setActive] = useState("new");

  const items = [
    { id: "new", icon: "🏠", label: "New Research", action: onNewResearch },
    { id: "reports", icon: "📄", label: "Previous Reports", action: () => setActive("reports") },
    { id: "settings", icon: "⚙️", label: "Settings", action: () => setActive("settings") },
    { id: "about", icon: "ℹ️", label: "About", action: () => setActive("about") },
  ];

  return (
    <aside
      className="hidden sm:flex flex-col w-56 shrink-0 border-r px-3 py-4 gap-1"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div className="px-2 pb-4">
        <span className="font-display text-sm font-semibold" style={{ color: "var(--text)" }}>
          🕵️ ResearchAI
        </span>
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActive(item.id);
            item.action();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
          style={{
            background: active === item.id ? "var(--accent)" : "transparent",
            color: active === item.id ? "var(--ink)" : "var(--text)",
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <div className="mt-auto px-2 pt-4 text-xs font-mono" style={{ color: "var(--muted)" }}>
        v1.0 · AI Research
      </div>
    </aside>
  );
}

function StatusBadge() {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border shrink-0"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
      OpenRouter Connected
    </div>
  );
}

function ModelSelector({ model, onChange }: { model: string; onChange: (v: string) => void }) {
  return (
    <select
      value={model}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg px-2.5 py-2 border bg-transparent"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {MODEL_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: "var(--ink)" }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ProgressTracker({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      {STAGES.map((stage, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={stage.label} className="flex items-center gap-2 text-sm">
            <span className={active ? "animate-pulse" : ""}>{done ? "✅" : stage.icon}</span>
            <span
              style={{
                color: done || active ? "var(--text)" : "var(--muted)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {stage.label}
              {active ? "…" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (name: string) => void }) {
  return (
    <div className="text-center py-16">
      <p className="font-display text-lg mb-2" style={{ color: "var(--text)" }}>
        Research any company in seconds
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Enter a company name or website URL, or try one below.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {EXAMPLES.map((name) => (
          <button
            key={name}
            onClick={() => onPick(name)}
            className="px-4 py-2 rounded-lg text-sm border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--panel)" }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <span className="shrink-0">{icon}</span>
      <span style={{ color: "var(--muted)" }} className="shrink-0">
        {label}:
      </span>
      <span style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}

// Plain string tags (Products/Services, Pain Points)
function TagList({ icon, label, items }: { icon: string; label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-sm mb-1.5" style={{ color: "var(--muted)" }}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Competitor objects ({name, website}) — rendered as clickable pills, never as raw objects
function CompetitorList({ items }: { items?: Competitor[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-sm mb-1.5" style={{ color: "var(--muted)" }}>
        <span>🏆</span>
        <span>Competitors</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((c, i) => (
          <a
            key={c.website || i}
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-1 rounded-full border hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {c.name}
          </a>
        ))}
      </div>
    </div>
  );
}

function ResearchResultCard({
  result,
  onDownloadPdf,
  downloading,
}: {
  result: CompanyResearchResult;
  onDownloadPdf: () => void;
  downloading: boolean;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-lg font-medium" style={{ color: "var(--text)" }}>
            {result.companyName}
          </h2>
          {result.website && (
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {result.website}
            </a>
          )}
        </div>
        <button
          onClick={onDownloadPdf}
          disabled={downloading}
          className="text-xs px-3 py-1.5 rounded-lg border shrink-0 disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          {downloading ? "Preparing…" : "⬇ PDF"}
        </button>
      </div>

      {result.summary && (
        <p className="text-sm mb-3" style={{ color: "var(--text)" }}>
          {result.summary}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-x-6">
        <InfoRow icon="📞" label="Phone" value={result.phone} />
        <InfoRow icon="📍" label="Address" value={result.address} />
      </div>

      <TagList icon="📦" label="Products" items={result.productsServices} />
      <TagList icon="⚠️" label="Pain Points" items={result.painPoints} />
      <CompetitorList items={result.competitors} />
    </div>
  );
}

// ---------- Main page ----------

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("openai/gpt-oss-20b:free");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resetToNewResearch() {
    setMessages([]);
    setInput("");
  }

  async function runResearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: uid(), role: "user", text: trimmed };
    const progressId = uid();
    setMessages((prev) => [...prev, userMsg, { id: progressId, role: "assistant", kind: "progress", stageIndex: 0 }]);
    setInput("");
    setLoading(true);

    const timers = STAGE_TIMINGS_MS.map((ms, i) =>
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === progressId && m.role === "assistant" && m.kind === "progress" ? { ...m, stageIndex: i + 1 } : m))
        );
      }, ms)
    );

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, model: model || undefined }),
      });
      const data = await res.json();

      timers.forEach(clearTimeout);

      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === progressId ? { id: progressId, role: "assistant", kind: "error", message: data.error || "Something went wrong." } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === progressId ? { id: progressId, role: "assistant", kind: "result", result: data as CompanyResearchResult } : m))
        );
      }
    } catch (err) {
      timers.forEach(clearTimeout);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === progressId
            ? { id: progressId, role: "assistant", kind: "error", message: "Couldn't reach the research pipeline. Check your connection and try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runResearch(input);
  }

  async function handleDownloadPdf(id: string, result: CompanyResearchResult) {
    setDownloadingId(id);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("not implemented");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.companyName.replace(/\s+/g, "_")}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF export isn't wired up yet — coming in the next build step.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex h-screen" style={{ background: "var(--ink)" }}>
      <Sidebar onNewResearch={resetToNewResearch} />

      <main className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="font-display text-base sm:text-lg font-medium" style={{ color: "var(--text)" }}>
              Company Research Agent
            </h1>
            <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
              AI-powered research · competitor analysis · PDF reports
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge />
            <ModelSelector model={model} onChange={setModel} />
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && <EmptyState onPick={(name) => runResearch(name)} />}

            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[80%] rounded-xl rounded-br-sm px-4 py-2.5 text-sm"
                      style={{ background: "var(--accent)", color: "var(--ink)" }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "progress") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className="rounded-xl rounded-bl-sm px-5 py-4 border"
                      style={{ background: "var(--panel)", borderColor: "var(--border)" }}
                    >
                      <ProgressTracker activeIndex={m.stageIndex} />
                    </div>
                  </div>
                );
              }
              if (m.kind === "error") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className="max-w-[85%] rounded-xl rounded-bl-sm px-4 py-3 text-sm border"
                      style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "var(--panel)" }}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="w-full">
                    <ResearchResultCard
                      result={m.result}
                      onDownloadPdf={() => handleDownloadPdf(m.id, m.result)}
                      downloading={downloadingId === m.id}
                    />
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t px-4 sm:px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Company name or website URL…"
              disabled={loading}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm border bg-transparent disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity"
              style={{ background: "var(--accent)", color: "var(--ink)" }}
            >
              {loading ? "Researching…" : "Research"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}