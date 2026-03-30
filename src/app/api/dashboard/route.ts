import {
  calculateMomentumScore,
  generateDailyBriefing,
  generateRivalAnalysis,
  generateStudyPlan,
  predictEndRank,
} from '@/lib/claude';
import cache from '@/lib/cache';
import type { DashboardResponse } from '@/lib/dashboard-types';
import type { Progress } from '@/lib/newton';
import {
  fetchAssignments,
  fetchLeaderboard,
  fetchMissedLectures,
  fetchProgress,
  fetchQOTD,
  fetchSchedule,
  searchProblems,
} from '@/lib/newton';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/dashboard] request start');
    const cacheKey = 'dashboard';
    const cached = cache.get<DashboardResponse>(cacheKey);
    if (cached) {
      console.log('[api/dashboard] cache hit');
      return Response.json(cached);
    }

    const [schedule, progress, assignments, qotd, leaderboard, missedLectures, arenaRecommendations] = await Promise.all([
      getCached('schedule', fetchSchedule, 900),
      getCached('progress', fetchProgress, 900),
      getCached('assignments', fetchAssignments, 900),
      getCached('qotd', fetchQOTD, 900),
      getCached('leaderboard', fetchLeaderboard, 900),
      getCached('missedLectures', fetchMissedLectures, 900),
      getCached('arenaRecommendations', () => searchProblems({ difficulty: 'medium' }), 900),
    ]);

    const myName = typeof progress.name === 'string' ? progress.name : typeof progress.user === 'string' ? progress.user : '';
    const myRankIndex = Math.max(0, leaderboard.overall.findIndex((entry) => entry.name === myName));

    const [briefing, studyPlan, rival, endRank, momentum] = await Promise.all([
      generateDailyBriefing({ schedule, assignments, qotd, progress }),
      generateStudyPlan({ progress, missedLectures, weakTopics: inferWeakTopics(progress) }),
      generateRivalAnalysis({ leaderboard, myRank: myRankIndex, myStats: progress }),
      predictEndRank({ progress, currentRank: myRankIndex + 1, batchSize: leaderboard.overall.length }),
      calculateMomentumScore({
        attendance: progress.attendance ?? 0,
        qotdStreak: qotd.streak ?? 0,
        assignmentRate: calcAssignmentRate(progress),
        assessmentAvg: calcAssessmentAvg(progress),
      }),
    ]);

    const payload: DashboardResponse = {
      schedule,
      progress,
      assignments,
      qotd,
      leaderboard,
      missedLectures,
      arenaRecommendations,
      insights: {
        briefing,
        studyPlan,
        rival,
        endRank,
        momentum,
      },
    };

    cache.set(cacheKey, payload, 300);
    console.log('[api/dashboard] success', {
      schedule: schedule.length,
      assignments: assignments.length,
      missedLectures: missedLectures.length,
      arenaRecommendations: arenaRecommendations.length,
      missionItems: briefing.mission.length,
      planDays: studyPlan.plan.length,
    });

    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.log(`[api/dashboard] error=${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function getCached<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}

function inferWeakTopics(progress: Progress): string[] {
  return Object.entries(progress.assessmentScores || {})
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] < 60)
    .map(([topic]) => topic);
}

function calcAssignmentRate(progress: Progress): number {
  const values = Object.values(progress.assignmentCompletion || {});
  if (!values.length) return 0;
  return values.filter(Boolean).length / values.length;
}

function calcAssessmentAvg(progress: Progress): number {
  const values = Object.values(progress.assessmentScores || {});
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
