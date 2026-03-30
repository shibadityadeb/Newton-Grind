import Anthropic from "@anthropic-ai/sdk";
import type { Leaderboard, Progress } from "@/lib/newton";

export interface DailyBriefingResult {
  mission: [string, string, string];
}

export interface StudyPlanResult {
  plan: Array<{ day: number; focus: string; arenaProblems: string[] }>;
}

export interface RivalAnalysisResult {
  rival: string;
  advantage: string;
  challenge: string;
}

export interface EndRankPrediction {
  predictedRank: number;
  confidence: number;
  reasoning: string;
}

export interface MomentumScoreResult {
  score: number;
  breakdown: {
    attendance: number;
    qotdStreak: number;
    assignmentRate: number;
    assessmentAvg: number;
  };
}

const MODEL = process.env.ANTHROPIC_MODEL_NAME || "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

function extractTextPayload(response: Awaited<ReturnType<typeof anthropic.messages.create>>): string {
  const textChunk = response.content.find((chunk) => chunk.type === "text");
  if (!textChunk || !("text" in textChunk)) {
    throw new Error("Claude returned no text block");
  }
  return textChunk.text;
}

function parseJson<T>(label: string, rawText: string, validate: (value: unknown) => value is T): T {
  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as unknown;
  if (!validate(parsed)) {
    throw new Error(`${label} invalid JSON shape`);
  }
  return parsed;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isDailyBriefing(value: unknown): value is DailyBriefingResult {
  if (!value || typeof value !== "object") return false;
  const mission = (value as { mission?: unknown }).mission;
  return Array.isArray(mission) && mission.length === 3 && mission.every((item) => typeof item === "string");
}

function isStudyPlan(value: unknown): value is StudyPlanResult {
  if (!value || typeof value !== "object") return false;
  const plan = (value as { plan?: unknown }).plan;
  return (
    Array.isArray(plan) &&
    plan.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as { day?: unknown }).day === "number" &&
        typeof (item as { focus?: unknown }).focus === "string" &&
        isStringArray((item as { arenaProblems?: unknown }).arenaProblems),
    )
  );
}

function isRival(value: unknown): value is RivalAnalysisResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { rival?: unknown; advantage?: unknown; challenge?: unknown };
  return typeof v.rival === "string" && typeof v.advantage === "string" && typeof v.challenge === "string";
}

function isEndRank(value: unknown): value is EndRankPrediction {
  if (!value || typeof value !== "object") return false;
  const v = value as { predictedRank?: unknown; confidence?: unknown; reasoning?: unknown };
  return (
    typeof v.predictedRank === "number" &&
    typeof v.confidence === "number" &&
    v.confidence >= 0 &&
    v.confidence <= 1 &&
    typeof v.reasoning === "string"
  );
}

function isMomentum(value: unknown): value is MomentumScoreResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { score?: unknown; breakdown?: unknown };
  if (typeof v.score !== "number" || !v.breakdown || typeof v.breakdown !== "object") return false;
  const b = v.breakdown as Record<string, unknown>;
  return (
    typeof b.attendance === "number" &&
    typeof b.qotdStreak === "number" &&
    typeof b.assignmentRate === "number" &&
    typeof b.assessmentAvg === "number"
  );
}

async function runClaude<T>(
  label: string,
  prompt: string,
  validate: (value: unknown) => value is T,
): Promise<T> {
  if (!hasApiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  try {
    console.log(`[claude] request=${label} model=${MODEL}`);
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });
    const text = extractTextPayload(response);
    const parsed = parseJson(label, text, validate);
    console.log(`[claude] request=${label} parsed successfully`);
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`[claude] ${label} failed: ${message}`);
  }
}

export async function generateDailyBriefing(data: {
  schedule: unknown;
  assignments: unknown;
  qotd: unknown;
  progress: unknown;
}): Promise<DailyBriefingResult> {
  const prompt = `You are an academic coach. Given the user's schedule, assignments, question of the day, and progress, generate a JSON object with a 3-point "Today's Mission".
Respond as JSON only: { "mission": ["urgent task", "focus goal", "challenge"] }

Input:
${JSON.stringify(data, null, 2)}`;

  return runClaude("daily-briefing", prompt, isDailyBriefing);
}

export async function generateStudyPlan(data: {
  progress: unknown;
  missedLectures: unknown;
  weakTopics: string[];
}): Promise<StudyPlanResult> {
  const prompt = `You are a study planner. Given the user's progress, missed lectures, and weak topics, generate a 5-day catch-up plan.
Respond as JSON only: { "plan": [ { "day": 1, "focus": "...", "arenaProblems": ["..."] } ] }

Input:
${JSON.stringify(data, null, 2)}`;

  return runClaude("study-plan", prompt, isStudyPlan);
}

export async function generateRivalAnalysis(data: {
  leaderboard: Leaderboard;
  myRank: number;
  myStats: Progress;
}): Promise<RivalAnalysisResult> {
  const prompt = `You are a competitive coach. Given leaderboard, user rank, and user stats, pick the person just above the user and generate a challenge.
Respond as JSON only: { "rival": "name", "advantage": "...", "challenge": "..." }

Input:
${JSON.stringify(data, null, 2)}`;

  return runClaude("rival-analysis", prompt, isRival);
}

export async function predictEndRank(data: {
  progress: Progress;
  currentRank: number;
  batchSize: number;
}): Promise<EndRankPrediction> {
  const prompt = `You are a data analyst. Given user progress, current rank, and batch size, predict final rank.
Respond as JSON only: { "predictedRank": number, "confidence": number, "reasoning": "..." }

Input:
${JSON.stringify(data, null, 2)}`;

  return runClaude("end-rank", prompt, isEndRank);
}

export async function calculateMomentumScore(data: {
  attendance: number;
  qotdStreak: number;
  assignmentRate: number;
  assessmentAvg: number;
}): Promise<MomentumScoreResult> {
  const prompt = `You are a performance analyst. Given attendance, QOTD streak, assignment rate, and assessment average, calculate a 0-100 momentum score.
Respond as JSON only: { "score": number, "breakdown": { "attendance": number, "qotdStreak": number, "assignmentRate": number, "assessmentAvg": number } }

Input:
${JSON.stringify(data, null, 2)}`;

  return runClaude("momentum-score", prompt, isMomentum);
}
