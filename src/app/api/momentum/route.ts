import { NextRequest } from 'next/server';
import { fetchProgress, fetchQOTD } from '@/lib/newton';
import { calculateMomentumScore } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [progress, qotd] = await Promise.all([
      fetchProgress(),
      fetchQOTD(),
    ]);
    const score = await calculateMomentumScore({
      attendance: progress?.attendance ?? 0,
      qotdStreak: qotd?.streak ?? 0,
      assignmentRate: calcAssignmentRate(progress),
      assessmentAvg: calcAssessmentAvg(progress),
    });
    return Response.json(score);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500 });
  }
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
