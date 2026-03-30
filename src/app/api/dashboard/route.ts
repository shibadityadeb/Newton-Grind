import { NextRequest } from 'next/server';
import { fetchSchedule, fetchProgress, fetchAssignments, fetchQOTD, fetchLeaderboard } from '@/lib/newton';
import { generateDailyBriefing, generateStudyPlan, generateRivalAnalysis, predictEndRank, calculateMomentumScore } from '@/lib/claude';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Parallel fetch Newton MCP data with 15-min cache
    const [schedule, progress, assignments, qotd, leaderboard] = await Promise.all([
      getCached('schedule', fetchSchedule, 900),
      getCached('progress', fetchProgress, 900),
      getCached('assignments', fetchAssignments, 900),
      getCached('qotd', fetchQOTD, 900),
      getCached('leaderboard', fetchLeaderboard, 900),
    ]);

    // Run all Claude functions concurrently
    const [briefing, studyPlan, rival, endRank, momentum] = await Promise.all([
      generateDailyBriefing({ schedule, assignments, qotd, progress }),
      generateStudyPlan({ progress, missedLectures: [], weakTopics: [] }), // TODO: fill missedLectures/weakTopics if needed
      generateRivalAnalysis({ leaderboard, myRank: 0, myStats: progress }), // TODO: fill myRank/myStats
      predictEndRank({ progress, currentRank: 0, batchSize: leaderboard?.overall?.length || 0 }), // TODO: fill currentRank
      calculateMomentumScore({
        attendance: progress?.attendance ?? 0,
        qotdStreak: qotd?.streak ?? 0,
        assignmentRate: calcAssignmentRate(progress),
        assessmentAvg: calcAssessmentAvg(progress),
      }),
    ]);

    return Response.json({
      schedule,
      progress,
      assignments,
      qotd,
      leaderboard,
      insights: {
        briefing,
        studyPlan,
        rival,
        endRank,
        momentum,
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500 });
  }
}

async function getCached<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}

function calcAssignmentRate(progress: any): number {
  if (!progress?.assignmentCompletion) return 0;
  const vals = Object.values(progress.assignmentCompletion);
  return vals.length ? vals.filter(Boolean).length / vals.length : 0;
}

function calcAssessmentAvg(progress: any): number {
  if (!progress?.assessmentScores) return 0;
  const vals = Object.values(progress.assessmentScores);
  return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
}
