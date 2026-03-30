import { fetchMissedLectures, fetchProgress } from '@/lib/newton';
import { generateStudyPlan, type StudyPlanResult } from '@/lib/claude';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/study-plan] request start');
    const cacheKey = 'study-plan';
    const cached = cache.get<StudyPlanResult>(cacheKey);
    if (cached) {
      console.log('[api/study-plan] cache hit');
      return Response.json(cached);
    }

    const [progress, missedLectures] = await Promise.all([
      getCached('progress', fetchProgress, 900),
      getCached('missedLectures', fetchMissedLectures, 900),
    ]);

    const weakTopics = Object.entries(progress.assessmentScores || {})
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] < 60)
      .map(([topic]) => topic);

    const plan = await generateStudyPlan({ progress, missedLectures, weakTopics });
    cache.set(cacheKey, plan, 21600);
    console.log('[api/study-plan] success', plan);
    return Response.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.log(`[api/study-plan] error=${message}`);
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
