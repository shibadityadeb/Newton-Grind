// AI engine using @anthropic-ai/sdk to generate insights from Newton MCP data
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

// 1. Daily Briefing
export async function generateDailyBriefing(data: {
  schedule: any;
  assignments: any;
  qotd: any;
  progress: any;
}): Promise<{
  mission: [string, string, string];
}> {
  const prompt = `You are an academic coach. Given the user's schedule, assignments, question of the day, and progress, generate a JSON object with a 3-point 'Today's Mission':
- The most urgent task (from assignments or schedule)
- One focus goal (from progress or schedule)
- A motivational challenge (from qotd or progress)
Respond as: { "mission": ["urgent task", "focus goal", "challenge"] }

Input:
${JSON.stringify(data, null, 2)}
`;
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(res.content[0].text);
}

// 2. Study Plan
export async function generateStudyPlan(data: {
  progress: any;
  missedLectures: any;
  weakTopics: string[];
}): Promise<{
  plan: Array<{ day: number; focus: string; arenaProblems: string[] }>;
}> {
  const prompt = `You are a study planner. Given the user's progress, missed lectures, and weak topics, generate a 5-day catch-up plan. For each day, specify the focus (topic/lecture) and recommend 2-3 Arena problems (by title or id) to practice. Respond as: { "plan": [ { "day": 1, "focus": "...", "arenaProblems": ["..."] }, ... ] }

Input:
${JSON.stringify(data, null, 2)}
`;
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(res.content[0].text);
}

// 3. Rival Analysis
export async function generateRivalAnalysis(data: {
  leaderboard: any;
  myRank: number;
  myStats: any;
}): Promise<{
  rival: string;
  advantage: string;
  challenge: string;
}> {
  const prompt = `You are a competitive coach. Given the leaderboard, user's rank, and stats, pick the person just above the user. Identify what they're doing better, and return a JSON: { "rival": "name", "advantage": "what they're doing better", "challenge": "a daily challenge to defeat them" }

Input:
${JSON.stringify(data, null, 2)}
`;
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(res.content[0].text);
}

// 4. Predict End Rank
export async function predictEndRank(data: {
  progress: any;
  currentRank: number;
  batchSize: number;
}): Promise<{
  predictedRank: number;
  confidence: number;
  reasoning: string;
}> {
  const prompt = `You are a data analyst. Given the user's progress, current rank, and batch size, predict their final batch rank and confidence (0-1). Respond as: { "predictedRank": number, "confidence": number, "reasoning": "..." }

Input:
${JSON.stringify(data, null, 2)}
`;
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(res.content[0].text);
}

// 5. Momentum Score
export async function calculateMomentumScore(data: {
  attendance: number;
  qotdStreak: number;
  assignmentRate: number;
  assessmentAvg: number;
}): Promise<{
  score: number;
  breakdown: {
    attendance: number;
    qotdStreak: number;
    assignmentRate: number;
    assessmentAvg: number;
  };
}> {
  const prompt = `You are a performance analyst. Given attendance, QOTD streak, assignment rate, and assessment average, calculate a 0-100 momentum score. Return a JSON: { "score": number, "breakdown": { "attendance": number, "qotdStreak": number, "assignmentRate": number, "assessmentAvg": number } }

Input:
${JSON.stringify(data, null, 2)}
`;
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(res.content[0].text);
}
