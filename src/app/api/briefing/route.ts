import { fetchAssignments, fetchProgress, fetchQOTD, fetchSchedule } from '@/lib/newton';
import { generateDailyBriefing, type DailyBriefingResult } from '@/lib/claude';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/briefing] request start');
    const cacheKey = 'briefing';
    const cached = cache.get<DailyBriefingResult>(cacheKey);
    if (cached) {
      console.log('[api/briefing] cache hit');
      return Response.json(cached);
    }

    const [schedule, assignments, qotd, progress] = await Promise.all([
      getCached('schedule', fetchSchedule, 900),
      getCached('assignments', fetchAssignments, 900),
      getCached('qotd', fetchQOTD, 900),
      getCached('progress', fetchProgress, 900),
    ]);

    const briefing = await generateDailyBriefing({ schedule, assignments, qotd, progress });
    cache.set(cacheKey, briefing, 3600);
    console.log('[api/briefing] success', briefing);
    return Response.json(briefing);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.log(`[api/briefing] error=${message}`);
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
