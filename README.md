# 🕵️ ResearchAI — AI Company Research Agent

An AI-powered research assistant with a ChatGPT-style interface. Type a company name or website, and it automatically finds the official site, crawls it, enriches the data with live search, and generates a full AI research report — summary, products/services, pain points, and competitors — downloadable as a polished PDF.

**🔗 Live Demo:** https://research-agent-ly55jlwh7-ganesh-uttam-kokitkar-s-projects.vercel.app/

---

## ✨ Features

- 🔍 **Smart input** — accepts a company name *or* a website URL
- 🌐 **Auto website discovery** — resolves the official site via Serper.dev when only a name is given
- 🕷️ **Intelligent crawler** — discovers Home, About, Products, Services, Solutions, Contact & Pricing pages, skips logins/junk pages, dedupes automatically
- 🧠 **AI-powered analysis** — OpenRouter-generated summary, products/services, and sales-relevant pain points
- 🤖 **Model selection** — pick any OpenRouter model, including free ones
- 🏆 **Competitor analysis** — AI-suggested competitors, each verified to a real official website
- 💬 **ChatGPT-style UI** — clean, responsive, animated progress tracking
- 📄 **One-click PDF report** — professional, downloadable, ready to send
- 🔔 **Discord integration** — auto-delivers the report + applicant info straight to a Discord channel

---

## 🧱 Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · Serper.dev · OpenRouter · Cheerio · @react-pdf/renderer · Discord API

---

## ⚙️ Quick Start

```bash
git clone <your-repo-url>
cd research-agent
npm install
cp .env.example .env.local   # add your API keys
npm run dev
```

## 🔑 Environment Variables

| Variable | Required | Get it from |
|---|---|---|
| `SERPER_API_KEY` | ✅ | [serper.dev](https://serper.dev) |
| `OPENROUTER_API_KEY` | ✅ | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `NEXT_PUBLIC_APP_URL` | Optional | Your deployed URL |
| `DISCORD_BOT_TOKEN` | Optional | Can also be set live in-app |
| `DISCORD_CHANNEL_ID` | Optional | Can also be set live in-app |

> 💡 Tip: always copy API keys using the site's copy button, not manual selection — missing prefixes (like `sk-or-v1-`) cause silent auth failures.

---

## 🔄 How It Works

**Input → Serper resolves official site → Crawler extracts content → Serper enriches with search data → OpenRouter generates insights → Competitors verified → Report displayed → PDF generated → Discord notified**

---

## 🚧 Notes

- Sites with heavy bot protection (e.g. Tesla, Nike) may block crawling — the app gracefully falls back to search-only data instead of failing.
- No database, auth, or history — fully stateless, per the assignment spec.

---

Built as part of a technical hiring assignment 🚀
