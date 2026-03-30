# Newton Grind

## What is Newton Grind?
Newton Grind is an AI-powered student dashboard built for Newton School learners. It pulls together schedule, assignments, attendance, XP, leaderboard context, and performance data into one place, then turns that data into daily action with AI briefings, study plans, momentum tracking, and shareable progress cards.

## Demo Recording
[Watch the product walkthrough](https://drive.google.com/file/d/1V5OyRtNn2UOMRpLxg2D-90z8a_qae1IN/view?usp=sharing)

---

## Architecture Diagram
- **Next.js App Router** (UI, API routes)
- **Newton MCP Data Layer** (calls MCP server via JSON-RPC)
- **Groq LLM Engine** (insights, plans, rival analysis)
- **In-memory Cache** (fast, low-latency data)
- **Vercel Hosting** (serverless, edge-ready)

```
[User] ⇄ [Next.js UI] ⇄ [API Routes] ⇄ [Newton MCP] ⇄ [Groq LLM]
```

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)
![Groq](https://img.shields.io/badge/Groq%20LLM-f55036?logoColor=white)
![Newton MCP](https://img.shields.io/badge/Newton%20MCP-0a0?logo=data&logoColor=white)

---

## Key AI Features
- **Daily Briefing:** 3-point mission for the day (urgent task, focus, challenge)
- **Personalized Study Plan:** 5-day catch-up plan with Arena problem picks
- **Rival Analysis:** See who's just above you and get a daily challenge to beat them
- **Momentum Score:** Composite 0–100 score with breakdown
- **End Rank Prediction:** Predicts your final batch rank with confidence
- **Share Card:** Generate a downloadable card for sharing stats and progress

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
4. **Set environment variables (`.env` or `.env.local`):**
	```bash
	GROQ_API_KEY=your_key_here
	GROQ_MODEL_NAME=llama-3.3-70b-versatile
	```
5. **Open** [http://localhost:3000/demo](http://localhost:3000/demo) **for a public demo**

---

## Why I built this
I wanted to build something that feels more useful than a plain student portal. Newton Grind helps students quickly understand where they stand, what they should do next, and how to stay motivated with AI-generated guidance and visible progress.

---

## Recruiter Demo
- See `/demo` for a full-featured, no-login preview.
- Try the "Share my stats" button to generate a LinkedIn-ready card.
- Use the recording in [`assets/recording.mp4`](/Users/shibadityadeb/Desktop/Newton-Grind/assets/recording.mp4) for a quick walkthrough.

---

*Made with ❤️ by Shibaditya Deb*
