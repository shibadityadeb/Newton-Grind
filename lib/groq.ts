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

export interface DailyTrendPoint {
  day: string;
  attendance: number;
  assignmentRate: number;
  assessmentScore: number;
}

export interface BurnoutDetectorResult {
  risk: "low" | "moderate" | "high";
  slippingDays: number;
  why: string[];
  todayPlan: string[];
}

export interface InterviewReadinessResult {
  score: number;
  verdict: string;
  breakdown: {
    dsaSolveRate: number;
    assessments: number;
    attendance: number;
    consistency: number;
  };
  focus: string[];
}

export interface BatchPulseResult {
  headline: string;
  insights: string[];
  heatmap: Array<{
    topic: string;
    intensity: number;
    status: "weak" | "watch" | "healthy";
  }>;
}

export interface StudyTwinResult {
  matches: Array<{
    name: string;
    compatibility: number;
    yourGap: string;
    theirStrength: string;
    reason: string;
  }>;
}

export interface PlacementSimulatorResult {
  company: string;
  readiness: number;
  summary: string;
  gapAnalysis: string[];
  twoWeekPlan: string[];
}

export interface ComebackModeResult {
  active: boolean;
  trigger: string;
  mission: Array<{
    day: number;
    goal: string;
    actions: string[];
  }>;
}

export interface WeeklyWarReportResult {
  weekLabel: string;
  improved: string[];
  slipped: string[];
  aiInsight: string;
  nextWeek: string[];
}

export interface VoiceBriefResult {
  text: string;
  shouldAutoPlayAt8am: boolean;
}

const MODEL =
  process.env.GROQ_MODEL_NAME ||
  process.env.GROQ_MODEL ||
  process.env.ANTHROPIC_MODEL_NAME ||
  process.env.ANTHROPIC_MODEL ||
  "llama-3.3-70b-versatile";
const MAX_TOKENS = 1024;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const hasApiKey = Boolean(process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY);

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

function extractTextPayload(response: GroqChatResponse): string {
  const text = response.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    const errorMessage = response.error?.message;
    throw new Error(errorMessage || "Groq returned no text content");
  }
  return text;
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

function isBurnout(value: unknown): value is BurnoutDetectorResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { risk?: unknown; slippingDays?: unknown; why?: unknown; todayPlan?: unknown };
  return (
    (v.risk === "low" || v.risk === "moderate" || v.risk === "high") &&
    typeof v.slippingDays === "number" &&
    isStringArray(v.why) &&
    isStringArray(v.todayPlan)
  );
}

function isInterviewReadiness(value: unknown): value is InterviewReadinessResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { score?: unknown; verdict?: unknown; breakdown?: unknown; focus?: unknown };
  if (typeof v.score !== "number" || typeof v.verdict !== "string" || !isStringArray(v.focus)) return false;
  if (!v.breakdown || typeof v.breakdown !== "object") return false;
  const b = v.breakdown as Record<string, unknown>;
  return (
    typeof b.dsaSolveRate === "number" &&
    typeof b.assessments === "number" &&
    typeof b.attendance === "number" &&
    typeof b.consistency === "number"
  );
}

function isBatchPulse(value: unknown): value is BatchPulseResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { headline?: unknown; insights?: unknown; heatmap?: unknown };
  return (
    typeof v.headline === "string" &&
    isStringArray(v.insights) &&
    Array.isArray(v.heatmap) &&
    v.heatmap.every((item) => {
      if (!item || typeof item !== "object") return false;
      const point = item as Record<string, unknown>;
      return (
        typeof point.topic === "string" &&
        typeof point.intensity === "number" &&
        (point.status === "weak" || point.status === "watch" || point.status === "healthy")
      );
    })
  );
}

function isStudyTwin(value: unknown): value is StudyTwinResult {
  if (!value || typeof value !== "object") return false;
  const matches = (value as { matches?: unknown }).matches;
  return (
    Array.isArray(matches) &&
    matches.every((item) => {
      if (!item || typeof item !== "object") return false;
      const m = item as Record<string, unknown>;
      return (
        typeof m.name === "string" &&
        typeof m.compatibility === "number" &&
        typeof m.yourGap === "string" &&
        typeof m.theirStrength === "string" &&
        typeof m.reason === "string"
      );
    })
  );
}

function isPlacement(value: unknown): value is PlacementSimulatorResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { company?: unknown; readiness?: unknown; summary?: unknown; gapAnalysis?: unknown; twoWeekPlan?: unknown };
  return (
    typeof v.company === "string" &&
    typeof v.readiness === "number" &&
    typeof v.summary === "string" &&
    isStringArray(v.gapAnalysis) &&
    isStringArray(v.twoWeekPlan)
  );
}

function isComeback(value: unknown): value is ComebackModeResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { active?: unknown; trigger?: unknown; mission?: unknown };
  return (
    typeof v.active === "boolean" &&
    typeof v.trigger === "string" &&
    Array.isArray(v.mission) &&
    v.mission.every((item) => {
      if (!item || typeof item !== "object") return false;
      const mission = item as Record<string, unknown>;
      return typeof mission.day === "number" && typeof mission.goal === "string" && isStringArray(mission.actions);
    })
  );
}

function isWeeklyReport(value: unknown): value is WeeklyWarReportResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { weekLabel?: unknown; improved?: unknown; slipped?: unknown; aiInsight?: unknown; nextWeek?: unknown };
  return (
    typeof v.weekLabel === "string" &&
    isStringArray(v.improved) &&
    isStringArray(v.slipped) &&
    typeof v.aiInsight === "string" &&
    isStringArray(v.nextWeek)
  );
}

function isVoiceBrief(value: unknown): value is VoiceBriefResult {
  if (!value || typeof value !== "object") return false;
  const v = value as { text?: unknown; shouldAutoPlayAt8am?: unknown };
  return typeof v.text === "string" && typeof v.shouldAutoPlayAt8am === "boolean";
}

async function runLLM<T>(
  label: string,
  prompt: string,
  validate: (value: unknown) => value is T,
): Promise<T> {
  if (!hasApiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  try {
    console.log(`[groq] request=${label} model=${MODEL}`);
    const apiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY || "";
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Return valid JSON only. No markdown fences.",
          },
          { role: "user", content: prompt },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Groq HTTP ${response.status}: ${body}`);
    }

    const json = (await response.json()) as GroqChatResponse;
    const text = extractTextPayload(json);
    const parsed = parseJson(label, text, validate);
    console.log(`[groq] request=${label} parsed successfully`);
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`[groq] ${label} failed: ${message}`);
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

  return runLLM("daily-briefing", prompt, isDailyBriefing);
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

  return runLLM("study-plan", prompt, isStudyPlan);
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

  return runLLM("rival-analysis", prompt, isRival);
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

  return runLLM("end-rank", prompt, isEndRank);
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

  return runLLM("momentum-score", prompt, isMomentum);
}

export async function detectBurnout(data: {
  trend: DailyTrendPoint[];
  attendance: number;
  assignmentRate: number;
  assessmentAvg: number;
}): Promise<BurnoutDetectorResult> {
  const prompt = `You are a student performance psychologist. Analyze attendance, assignment completion and assessments together.
Respond as JSON only:
{
  "risk":"low|moderate|high",
  "slippingDays": number,
  "why":["..."],
  "todayPlan":["..."]
}

Input:
${JSON.stringify(data, null, 2)}`;

  return runLLM("burnout-detector", prompt, isBurnout);
}

export async function scoreInterviewReadiness(data: {
  dsaSolveRate: number;
  attendance: number;
  assessmentAvg: number;
  consistency: number;
  profile: unknown;
}): Promise<InterviewReadinessResult> {
  const prompt = `You are an interview coach. Score readiness for a FAANG-style DSA interview.
Respond as JSON only:
{
  "score": number,
  "verdict":"...",
  "breakdown":{"dsaSolveRate":number,"assessments":number,"attendance":number,"consistency":number},
  "focus":["..."]
}

Input:
${JSON.stringify(data, null, 2)}`;

  return runLLM("interview-readiness", prompt, isInterviewReadiness);
}

export async function generateBatchPulse(data: {
  leaderboard: unknown;
  assignments: unknown;
  missedLectures: unknown;
  assessments: Record<string, number>;
}): Promise<BatchPulseResult> {
  const prompt = `You are a batch analytics engine. Return anonymous batch pulse trends.
Respond as JSON only:
{
  "headline":"...",
  "insights":["..."],
  "heatmap":[{"topic":"Trees","intensity":80,"status":"weak"}]
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("batch-pulse", prompt, isBatchPulse);
}

export async function findStudyTwins(data: {
  myWeakTopics: string[];
  myStrongTopics: string[];
  leaderboard: unknown;
}): Promise<StudyTwinResult> {
  const prompt = `You are a study-group matcher. Suggest 2-3 study twins whose strengths cover user's gaps.
Respond as JSON only:
{
  "matches":[
    {"name":"...", "compatibility":85, "yourGap":"Trees", "theirStrength":"Trees", "reason":"..."}
  ]
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("study-twins", prompt, isStudyTwin);
}

export async function simulatePlacement(data: {
  company: string;
  attendance: number;
  dsaSolveRate: number;
  assessmentAvg: number;
  weakTopics: string[];
}): Promise<PlacementSimulatorResult> {
  const prompt = `You are a placement readiness advisor.
Respond as JSON only:
{
  "company":"${data.company}",
  "readiness": number,
  "summary":"...",
  "gapAnalysis":["..."],
  "twoWeekPlan":["..."]
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("placement-simulator", prompt, isPlacement);
}

export async function generateComebackMode(data: {
  missedLectures: number;
  qotdStreak: number;
  weakTopics: string[];
}): Promise<ComebackModeResult> {
  const prompt = `You are a compassionate accountability coach. Trigger comeback mode if slump signs are present.
Respond as JSON only:
{
  "active": boolean,
  "trigger":"...",
  "mission":[
    {"day":1,"goal":"...","actions":["..."]}
  ]
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("comeback-mode", prompt, isComeback);
}

export async function generateWeeklyWarReport(data: {
  trend: DailyTrendPoint[];
  momentum: number;
  missedLectures: number;
  assignmentsDue: number;
}): Promise<WeeklyWarReportResult> {
  const prompt = `You are a weekly performance analyst.
Respond as JSON only:
{
  "weekLabel":"Week 12",
  "improved":["..."],
  "slipped":["..."],
  "aiInsight":"...",
  "nextWeek":["..."]
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("weekly-war-report", prompt, isWeeklyReport);
}

export async function generateVoiceBrief(data: {
  studentName: string;
  nextClassTitle: string;
  nextClassTime: string;
  dueAssignments: number;
  qotdStreak: number;
  rivalName: string;
}): Promise<VoiceBriefResult> {
  const prompt = `Create a concise morning voice briefing for a student dashboard.
Respond as JSON only:
{
  "text":"Good morning ...",
  "shouldAutoPlayAt8am": true
}

Input:
${JSON.stringify(data, null, 2)}`;
  return runLLM("voice-brief", prompt, isVoiceBrief);
}
