import { spawn } from "child_process";

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  [key: string]: unknown;
}
export type Schedule = ScheduleItem[];

export interface Progress {
  attendance: number;
  assessmentScores: Record<string, number>;
  assignmentCompletion: Record<string, boolean>;
  name?: string;
  user?: string;
  [key: string]: unknown;
}

export interface Assignment {
  id: string;
  title: string;
  deadline: string;
  status: "pending" | "completed" | "overdue";
  [key: string]: unknown;
}
export type Assignments = Assignment[];

export interface QOTD {
  question: string;
  streak: number;
  leaderboard: Array<{ name: string; score: number }>;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  name: string;
  rank: number;
  score: number;
  [key: string]: unknown;
}

export interface Leaderboard {
  overall: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
}

export interface MissedLecture {
  id: string;
  title: string;
  date: string;
  recordingAvailable: boolean;
  [key: string]: unknown;
}
export type MissedLectures = MissedLecture[];

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  company?: string;
  [key: string]: unknown;
}
export type Problems = Problem[];

export interface ProblemSearchFilters {
  topic?: string;
  difficulty?: string;
  company?: string;
}

type MCPResponse<T> = {
  id: number;
  result?: T;
  error?: { code?: number; message?: string };
};

interface MCPToolCallResult {
  structuredContent?: unknown;
  content?: Array<{ type?: string; text?: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

function extractToolPayload<T>(method: string, result: unknown): T {
  const toolResult = result as MCPToolCallResult;
  const text = toolResult?.content?.find((item) => item?.type === "text" && typeof item.text === "string")?.text;

  if (toolResult?.isError) {
    throw new Error(text || `MCP tool ${method} returned an error`);
  }

  if (toolResult?.structuredContent !== undefined) {
    return toolResult.structuredContent as T;
  }

  if (text) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  throw new Error(`MCP tools/call returned no parsable payload for ${method}`);
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

let primaryCourseHash: string | undefined;
let primaryCourseHashPromise: Promise<string | undefined> | null = null;
let studentIdentityPromise: Promise<{ name?: string; user?: string }> | null = null;

async function getPrimaryCourseHash(): Promise<string | undefined> {
  if (primaryCourseHash) return primaryCourseHash;
  if (primaryCourseHashPromise) return primaryCourseHashPromise;

  primaryCourseHashPromise = (async () => {
    const courses = asObject(await callMCP<Record<string, unknown>>("list_courses"));
    const resolved = courses.primary_course_hash;
    if (typeof resolved === "string" && resolved.length > 0) {
      primaryCourseHash = resolved;
    }
    return primaryCourseHash;
  })();

  try {
    return await primaryCourseHashPromise;
  } finally {
    primaryCourseHashPromise = null;
  }
}

async function getStudentIdentity(): Promise<{ name?: string; user?: string }> {
  if (studentIdentityPromise) return studentIdentityPromise;
  studentIdentityPromise = (async () => {
    const me = asObject(await callMCP<Record<string, unknown>>("get_me"));
    const name =
      typeof me.name === "string"
        ? me.name
        : typeof me.full_name === "string"
          ? me.full_name
          : typeof me.user_name === "string"
            ? me.user_name
            : undefined;
    const user =
      typeof me.username === "string"
        ? me.username
        : typeof me.user_name === "string"
          ? me.user_name
          : typeof me.email === "string"
            ? me.email
            : undefined;
    return { name, user };
  })();
  return studentIdentityPromise;
}

async function callMCP<T>(method: string, params?: unknown): Promise<T> {
  console.log(`[newton] calling MCP method=${method}`);
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["-y", "@newtonschool/newton-mcp@latest"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      proc.kill();
      reject(new Error(`MCP timeout for method ${method}`));
    }, 20000);
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        clientInfo: {
          name: "newton-grind",
          version: "0.1.0",
        },
        capabilities: {},
      },
    };
    const methodRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: method,
        arguments: (params as Record<string, unknown> | undefined) ?? {},
      },
    };
    const initializedNotification = {
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    };

    let responseBuffer = "";

    proc.stdout.on("data", (data: Buffer) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split("\n");
      responseBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as MCPResponse<T>;
          if (parsed.id === 1) {
            if (parsed.error) {
              clearTimeout(timeout);
              settled = true;
              reject(new Error(parsed.error.message ?? `MCP initialize failed for ${method}`));
              proc.kill();
              return;
            }

            proc.stdin.write(`${JSON.stringify(initializedNotification)}\n`);
            proc.stdin.write(`${JSON.stringify(methodRequest)}\n`);
            continue;
          }
          if (parsed.id !== 2) continue;
          clearTimeout(timeout);
          if (parsed.error) {
            settled = true;
            reject(new Error(parsed.error.message ?? `Unknown MCP error for ${method}`));
          } else {
            settled = true;
            resolve(extractToolPayload<T>(method, parsed.result));
          }
          proc.kill();
          return;
        } catch {
          // Wait for complete line before parse.
        }
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      if (message) console.log(`[newton:mcp:stderr] ${message}`);
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      settled = true;
      reject(err);
    });

    proc.on("exit", (code) => {
      clearTimeout(timeout);
      if (code && code !== 0) {
        console.log(`[newton] MCP process exited with code ${code} for method=${method}`);
      }
      if (!settled) {
        settled = true;
        reject(new Error(`MCP process exited before responding for method ${method}`));
      }
    });

    proc.stdin.write(`${JSON.stringify(initRequest)}\n`);
  });
}

export function fetchSchedule(): Promise<Schedule> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const raw = asObject(await callMCP<Record<string, unknown>>("get_upcoming_schedule", { course_hash: courseHash }));
    const events =
      asArray<Record<string, unknown>>(raw.schedule) ||
      asArray<Record<string, unknown>>(raw.events) ||
      asArray<Record<string, unknown>>(raw.items);
    const fallbackEvents =
      events.length > 0 ? events : asArray<Record<string, unknown>>(raw.upcoming_lectures);

    return fallbackEvents.map((event, index) => ({
      id: String(event.id ?? event.lecture_hash ?? event.hash ?? `schedule-${index}`),
      title: String(event.title ?? event.topic ?? event.name ?? "Class"),
      startTime: String(event.startTime ?? event.start_time ?? event.starts_at ?? new Date().toISOString()),
      endTime: String(event.endTime ?? event.end_time ?? event.ends_at ?? new Date().toISOString()),
      type: String(event.type ?? "lecture"),
      ...event,
    }));
  });
}

export function fetchProgress(): Promise<Progress> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const [raw, identity] = await Promise.all([
      callMCP<Record<string, unknown>>("get_course_overview", { course_hash: courseHash }),
      getStudentIdentity(),
    ]);
    const rawObj = asObject(raw);
    const attendance = Number(raw.attendance ?? raw.attendance_percentage ?? raw.attendance_percent ?? 0);
    return {
      attendance: Number.isFinite(attendance) ? attendance : 0,
      assessmentScores: asObject(rawObj.assessmentScores) as Record<string, number>,
      assignmentCompletion: asObject(rawObj.assignmentCompletion) as Record<string, boolean>,
      name: identity.name,
      user: identity.user,
      ...rawObj,
    };
  });
}

export function fetchAssignments(): Promise<Assignments> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const raw = asObject(
      await callMCP<Record<string, unknown>>("get_assignments", { course_hash: courseHash, include_contests: true, limit: 20 }),
    );
    const list =
      asArray<Record<string, unknown>>(raw.assignments).concat(
        asArray<Record<string, unknown>>(raw.pending_assignments),
        asArray<Record<string, unknown>>(raw.contests),
      ) || [];
    return list.map((item, index) => ({
      id: String(item.id ?? item.hash ?? `assignment-${index}`),
      title: String(item.title ?? item.name ?? "Assignment"),
      deadline: String(item.deadline ?? item.due_date ?? item.end_time ?? new Date().toISOString()),
      status: (item.status === "completed" || item.status === "overdue" ? item.status : "pending") as
        | "pending"
        | "completed"
        | "overdue",
      ...item,
    }));
  });
}

export function fetchQOTD(): Promise<QOTD> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const raw = asObject(await callMCP<Record<string, unknown>>("get_question_of_the_day", { course_hash: courseHash }));
    return {
      question: String(raw.question ?? raw.title ?? "QOTD"),
      streak: Number(raw.streak ?? raw.current_streak ?? 0),
      leaderboard: asArray<{ name: string; score: number }>(raw.leaderboard),
      ...raw,
    };
  });
}

export function fetchLeaderboard(): Promise<Leaderboard> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const [overallRaw, weeklyRaw, monthlyRaw] = await Promise.all([
      callMCP<Record<string, unknown>>("get_leaderboard", { course_hash: courseHash, period: "overall", limit: 500 }),
      callMCP<Record<string, unknown>>("get_leaderboard", { course_hash: courseHash, period: "weekly", limit: 500 }),
      callMCP<Record<string, unknown>>("get_leaderboard", { course_hash: courseHash, period: "monthly", limit: 500 }),
    ]);

    const normalize = (value: Record<string, unknown>) =>
      asArray<Record<string, unknown>>(value.leaderboard).concat(asArray<Record<string, unknown>>(value.entries)).map(
        (entry, index) => ({
          name: String(entry.name ?? entry.user_name ?? `Student ${index + 1}`),
          rank: Number(entry.rank ?? index + 1),
          score: Number(entry.score ?? entry.xp ?? 0),
          ...entry,
        }),
      );

    return {
      overall: normalize(asObject(overallRaw)),
      weekly: normalize(asObject(weeklyRaw)),
      monthly: normalize(asObject(monthlyRaw)),
    };
  });
}

export function fetchMissedLectures(): Promise<MissedLectures> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const raw = asObject(
      await callMCP<Record<string, unknown>>("get_recent_lectures", { course_hash: courseHash, limit: 10 }),
    );
    const lectures = asArray<Record<string, unknown>>(raw.lectures).concat(
      asArray<Record<string, unknown>>(raw.recent_lectures),
    );
    return lectures.map((lecture, index) => ({
      id: String(lecture.id ?? lecture.lecture_hash ?? lecture.hash ?? `lecture-${index}`),
      title: String(lecture.title ?? lecture.topic ?? `Lecture ${index + 1}`),
      date: String(lecture.date ?? lecture.start_time ?? new Date().toISOString()),
      recordingAvailable: Boolean(lecture.recordingAvailable ?? lecture.recording_available ?? lecture.recording_link),
      ...lecture,
    }));
  });
}

export function searchProblems(filters: ProblemSearchFilters): Promise<Problems> {
  return getPrimaryCourseHash().then(async (courseHash) => {
    const raw = asObject(
      await callMCP<Record<string, unknown>>("search_practice_questions", {
        course_hash: courseHash,
        difficulty: filters.difficulty ?? null,
        topics: filters.topic ?? null,
        companies: filters.company ?? null,
        limit: 10,
      }),
    );
    const questions = asArray<Record<string, unknown>>(raw.questions).concat(
      asArray<Record<string, unknown>>(raw.items),
      asArray<Record<string, unknown>>(raw.results),
    );
    return questions.map((question, index) => ({
      id: String(question.id ?? question.hash ?? `problem-${index}`),
      title: String(question.title ?? question.name ?? `Problem ${index + 1}`),
      topic: String(question.topic ?? question.primary_topic ?? filters.topic ?? "General"),
      difficulty: String(question.difficulty ?? filters.difficulty ?? "medium"),
      company: typeof question.company === "string" ? question.company : undefined,
      ...question,
    }));
  });
}
