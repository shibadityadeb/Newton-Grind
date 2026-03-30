# Newton Grind

![Newton Grind Demo](demo.gif)

---

## What is Newton Grind?
Newton Grind is your all-in-one AI-powered dashboard for Newton School students. It brings together your schedule, assignments, progress, and competitive stats, then uses advanced AI to generate actionable insights, study plans, and viral shareable cards. Built to help you win the leaderboard—and show recruiters your edge.

---

## Architecture Diagram
- **Next.js App Router** (UI, API routes)
- **Newton MCP Data Layer** (calls MCP server via JSON-RPC)
- **Claude AI Engine** (insights, plans, rival analysis)
- **In-memory Cache** (fast, low-latency data)
- **Vercel Hosting** (serverless, edge-ready)

```
[User] ⇄ [Next.js UI] ⇄ [API Routes] ⇄ [Newton MCP] ⇄ [Claude AI]
```

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)
![Anthropic Claude](https://img.shields.io/badge/Claude%20AI-fff?logo=anthropic&logoColor=black)
![Newton MCP](https://img.shields.io/badge/Newton%20MCP-0a0?logo=data&logoColor=white)

---

## Key AI Features
- **Daily Briefing:** 3-point mission for the day (urgent task, focus, challenge)
- **Personalized Study Plan:** 5-day catch-up plan with Arena problem picks
- **Rival Analysis:** See who's just above you and get a daily challenge to beat them
- **Momentum Score:** Composite 0–100 score with breakdown
- **End Rank Prediction:** Predicts your final batch rank with confidence

---

## Setup Instructions
1. **Login to Newton MCP:**
	```bash
	npx @newtonschool/newton-mcp@latest login
	```
2. **Install dependencies:**
	```bash
	npm install
	```
3. **Run the app:**
	```bash
	npm run dev
	```
4. **Open** [http://localhost:3000/demo](http://localhost:3000/demo) **for a public demo**

---

## Why I built this
I wanted to create a dashboard that not only tracks your Newton School journey, but also motivates you to push harder, compete smarter, and share your wins. With AI-powered insights and viral share cards, Newton Grind helps you stand out to recruiters and your peers.

---

## Recruiter Demo
- See `/demo` for a full-featured, no-login preview.
- Try the "Share my stats" button to generate a LinkedIn-ready card.

---

*Made with ❤️ by Shibaditya Deb*
