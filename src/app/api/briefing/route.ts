import { NextRequest } from 'next/server';
import { fetchSchedule, fetchAssignments, fetchQOTD, fetchProgress } from '@/lib/newton';
import { generateDailyBriefing } from '@/lib/claude';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cacheKey = 'briefing';
    const cached = cache.get<any>(cacheKey);
    if (cached) return Response.json(cached);

    const [schedule, assignments, qotd, progress] = await Promise.all([
      getCached('schedule', fetchSchedule, 900),
      getCached('assignments', fetchAssignments, 900),
      getCached('qotd', fetchQOTD, 900),
      getCached('progress', fetchProgress, 900),
    ]);
    const briefing = await generateDailyBriefing({ schedule, assignments, qotd, progress });
    cache.set(cacheKey, briefing, 3600); // 1 hour
    return Response.json(briefing);
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
