import { NextRequest } from 'next/server';
import { fetchProgress, fetchMissedLectures } from '@/lib/newton';
import { generateStudyPlan } from '@/lib/claude';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cacheKey = 'study-plan';
    const cached = cache.get<any>(cacheKey);
    if (cached) return Response.json(cached);

    const [progress, missedLectures] = await Promise.all([
      getCached('progress', fetchProgress, 900),
      getCached('missedLectures', fetchMissedLectures, 900),
    ]);
    // Weak topics: pick from low assessment scores
    const weakTopics = Object.entries(progress?.assessmentScores || {})
      .filter(([_, v]) => typeof v === 'number' && v < 60)
      .map(([k]) => k);
    const plan = await generateStudyPlan({ progress, missedLectures, weakTopics });
    cache.set(cacheKey, plan, 21600); // 6 hours
    return Response.json(plan);
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
