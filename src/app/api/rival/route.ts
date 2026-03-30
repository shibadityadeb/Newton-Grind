import { NextRequest } from 'next/server';
import { fetchLeaderboard, fetchProgress } from '@/lib/newton';
import { generateRivalAnalysis } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [leaderboard, progress] = await Promise.all([
      fetchLeaderboard(),
      fetchProgress(),
    ]);
    // Find my rank (assume user is in leaderboard.overall, match by name or id if available)
    const myName = progress?.name || progress?.user || '';
    const overall = leaderboard?.overall || [];
    let myRank = overall.findIndex((x: any) => x.name === myName);
    if (myRank === -1) myRank = 0;
    const myStats = progress;
    const rival = await generateRivalAnalysis({ leaderboard, myRank, myStats });
    return Response.json(rival);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500 });
  }
}
