"use client";

const CURATED_MODELS = [
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (free)" },
  { id: "meta-llama/llama-3.3-70b:free", label: "Llama 3.3 70B (free)" },
  { id: "deepseek/deepseek-r1-distill:free", label: "DeepSeek R1 Distill (free)" },
  { id: "custom", label: "Custom model ID…" },
];

export function ModelSelector({
  model,
  onChange,
}: {
  model: string;
  onChange: (model: string) => void;
}) {
  const isCustom = !CURATED_MODELS.some((m) => m.id === model) || model === "custom";

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
      <select
        value={isCustom ? "custom" : model}
        onChange={(e) => {
          if (e.target.value !== "custom") onChange(e.target.value);
          else onChange("");
        }}
        className="text-xs font-mono rounded-md px-2.5 py-1.5 border bg-transparent"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        {CURATED_MODELS.map((m) => (
          <option key={m.id} value={m.id} style={{ background: "var(--panel)" }}>
            {m.label}
          </option>
        ))}
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder="e.g. anthropic/claude-3.5-haiku"
          value={model === "custom" ? "" : model}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-mono rounded-md px-2.5 py-1.5 border bg-transparent"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
      )}
    </div>
  );
}
