import { generateRivalAnalysis } from '@/lib/claude';
import { fetchLeaderboard, fetchProgress } from '@/lib/newton';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/rival] request start');
    const [leaderboard, progress] = await Promise.all([fetchLeaderboard(), fetchProgress()]);

    const myName = typeof progress.name === 'string' ? progress.name : typeof progress.user === 'string' ? progress.user : '';
    const overall = leaderboard.overall || [];
    let myRankIndex = overall.findIndex((entry) => entry.name === myName);
    if (myRankIndex === -1) myRankIndex = 0;

    const rival = await generateRivalAnalysis({
      leaderboard,
      myRank: myRankIndex,
      myStats: progress,
    });
    console.log('[api/rival] success', rival);
    return Response.json(rival);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.log(`[api/rival] error=${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
