import { calculateMomentumScore } from '@/lib/groq';
import type { Progress } from '@/lib/newton';
import { fetchProgress, fetchQOTD } from '@/lib/newton';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/momentum] request start');
    const [progress, qotd] = await Promise.all([fetchProgress(), fetchQOTD()]);

    const score = await calculateMomentumScore({
      attendance: progress.attendance ?? 0,
      qotdStreak: qotd.streak ?? 0,
      assignmentRate: calcAssignmentRate(progress),
      assessmentAvg: calcAssessmentAvg(progress),
    });
    console.log('[api/momentum] success', score);
    return Response.json(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.log(`[api/momentum] error=${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
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
