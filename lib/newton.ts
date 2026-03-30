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
    }, 6000);

    const request = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
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
          if (parsed.id !== 1) continue;
          clearTimeout(timeout);
          if (parsed.error) {
            settled = true;
            reject(new Error(parsed.error.message ?? `Unknown MCP error for ${method}`));
          } else {
            settled = true;
            resolve(parsed.result as T);
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

    proc.stdin.write(`${JSON.stringify(request)}\n`);
  });
}

export function fetchSchedule(): Promise<Schedule> {
  return callMCP<Schedule>("get_schedule");
}

export function fetchProgress(): Promise<Progress> {
  return callMCP<Progress>("get_progress");
}

export function fetchAssignments(): Promise<Assignments> {
  return callMCP<Assignments>("get_assignments");
}

export function fetchQOTD(): Promise<QOTD> {
  return callMCP<QOTD>("get_qotd");
}

export function fetchLeaderboard(): Promise<Leaderboard> {
  return callMCP<Leaderboard>("get_leaderboard");
}

export function fetchMissedLectures(): Promise<MissedLectures> {
  return callMCP<MissedLectures>("get_missed_lectures");
}

export function searchProblems(filters: ProblemSearchFilters): Promise<Problems> {
  return callMCP<Problems>("search_problems", filters);
}
