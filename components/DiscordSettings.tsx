"use client";

import { useEffect, useState } from "react";

export interface DiscordConfig {
  botToken: string;
  channelId: string;
  applicantName: string;
  applicantEmail: string;
}

interface Props {
  onSave: (config: DiscordConfig) => void;
}

const STORAGE_KEY = "discord-config";

export default function DiscordSettings({ onSave }: Props) {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const config: DiscordConfig = JSON.parse(saved);

      setBotToken(config.botToken || "");
      setChannelId(config.channelId || "");
      setApplicantName(config.applicantName || "");
      setApplicantEmail(config.applicantEmail || "");

      onSave(config);
    } catch {}
  }, []);

  function saveConfiguration() {
    const config: DiscordConfig = {
      botToken,
      channelId,
      applicantName,
      applicantEmail,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    onSave(config);

    alert("Discord configuration saved.");
  }

  return (
    <div
      className="rounded-xl border p-6 space-y-5"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <h2
          className="font-display text-xl"
          style={{ color: "var(--text)" }}
        >
          Discord Integration
        </h2>

        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted)" }}
        >
          Configure Discord once. Reports will automatically be sent after
          every successful company research.
        </p>
      </div>

      <div className="grid gap-4">

        <div>
          <label
            className="block text-xs mb-1 font-mono"
            style={{ color: "var(--muted)" }}
          >
            Discord Bot Token
          </label>

          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="Discord Bot Token"
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label
            className="block text-xs mb-1 font-mono"
            style={{ color: "var(--muted)" }}
          >
            Discord Channel ID
          </label>

          <input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Discord Channel ID"
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label
            className="block text-xs mb-1 font-mono"
            style={{ color: "var(--muted)" }}
          >
            Applicant Name
          </label>

          <input
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="Your Name"
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label
            className="block text-xs mb-1 font-mono"
            style={{ color: "var(--muted)" }}
          >
            Applicant Email
          </label>

          <input
            type="email"
            value={applicantEmail}
            onChange={(e) => setApplicantEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

      </div>

      <button
        onClick={saveConfiguration}
        className="w-full rounded-lg py-3 font-medium transition"
        style={{
          background: "var(--accent)",
          color: "var(--ink)",
        }}
      >
        Save Configuration
      </button>
    </div>
  );
}