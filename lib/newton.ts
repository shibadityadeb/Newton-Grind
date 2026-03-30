// Data fetching layer for Newton School MCP server
// Calls MCP tools via JSON-RPC by spawning the MCP server process

import { spawn } from 'child_process';

// --- TypeScript interfaces for each tool's return type ---

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  [key: string]: any;
}
export type Schedule = ScheduleItem[];

export interface Progress {
  attendance: number;
  assessmentScores: Record<string, number>;
  assignmentCompletion: Record<string, boolean>;
  [key: string]: any;
}

export interface Assignment {
  id: string;
  title: string;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue';
  [key: string]: any;
}
export type Assignments = Assignment[];

export interface QOTD {
  question: string;
  streak: number;
  leaderboard: Array<{ name: string; score: number }>;
  [key: string]: any;
}

export interface LeaderboardEntry {
  name: string;
  rank: number;
  score: number;
  [key: string]: any;
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
  [key: string]: any;
}
export type MissedLectures = MissedLecture[];

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  company?: string;
  [key: string]: any;
}
export type Problems = Problem[];

export interface ProblemSearchFilters {
  topic?: string;
  difficulty?: string;
  company?: string;
}

// --- Helper to call MCP server via JSON-RPC ---

function callMCP<T>(method: string, params?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['@newtonschool/newton-mcp@latest', 'server', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    };
    const reqStr = JSON.stringify(request) + '\n';
    let response = '';

    proc.stdout.on('data', (data) => {
      response += data.toString();
      try {
        const lines = response.split('\n').filter(Boolean);
        for (const line of lines) {
          const res = JSON.parse(line);
          if (res.id === 1) {
            if (res.error) reject(res.error);
            else resolve(res.result);
            proc.kill();
            return;
          }
        }
      } catch (e) {
        // Wait for more data
      }
    });
    proc.stderr.on('data', (data) => {
      // Optionally log errors
    });
    proc.on('error', (err) => reject(err));
    proc.stdin.write(reqStr);
  });
}

// --- Exported typed functions ---

export function fetchSchedule(): Promise<Schedule> {
  return callMCP<Schedule>('get_schedule');
}

export function fetchProgress(): Promise<Progress> {
  return callMCP<Progress>('get_progress');
}

export function fetchAssignments(): Promise<Assignments> {
  return callMCP<Assignments>('get_assignments');
}

export function fetchQOTD(): Promise<QOTD> {
  return callMCP<QOTD>('get_qotd');
}

export function fetchLeaderboard(): Promise<Leaderboard> {
  return callMCP<Leaderboard>('get_leaderboard');
}

export function fetchMissedLectures(): Promise<MissedLectures> {
  return callMCP<MissedLectures>('get_missed_lectures');
}

export function searchProblems(filters: ProblemSearchFilters): Promise<Problems> {
  return callMCP<Problems>('search_problems', filters);
}
