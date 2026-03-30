import React from 'react';
import dynamic from 'next/dynamic';

const mockData = {
  // Dynamically import ShareCard to avoid SSR issues with html2canvas
  const ShareCard = dynamic(() => import('@/components/ShareCard'), { ssr: false });
  rank: 7,
  momentum: 88,
  streak: 12,
  briefing: [
    'Finish DSA Assignment by 6pm',
    'Focus: Arrays & Strings',
    'Challenge: Solve 2 extra Arena problems',
  ],
  studyPlan: [
    { day: 1, focus: 'Arrays', arenaProblems: ['Two Sum', 'Max Subarray'] },
    { day: 2, focus: 'Strings', arenaProblems: ['Valid Anagram', 'Longest Substring'] },
    { day: 3, focus: 'Recursion', arenaProblems: ['Fibonacci', 'Climbing Stairs'] },
    { day: 4, focus: 'Sorting', arenaProblems: ['Merge Sort', 'Quick Sort'] },
    { day: 5, focus: 'Graphs', arenaProblems: ['BFS', 'DFS'] },
  ],
  rival: {
    rival: 'Priya S.',
    advantage: 'Higher QOTD streak and more assignments completed',
    challenge: 'Beat Priya’s streak for 3 days',
  },
};

export default function DemoPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Newton Grind Demo</h1>
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Your Stats</h2>
        <div className="flex gap-6 text-center mb-4">
          <div>
            <div className="text-2xl font-bold">{mockData.rank}</div>
            <div className="text-gray-500">Rank</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{mockData.momentum}</div>
            <div className="text-gray-500">Momentum</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{mockData.streak}</div>
            <div className="text-gray-500">QOTD Streak</div>
          </div>
        </div>
        <ShareCard rank={mockData.rank} momentum={mockData.momentum} streak={mockData.streak} />
      </section>
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Today's Mission</h2>
        <ol className="list-decimal ml-6 space-y-1">
          {mockData.briefing.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">5-Day Study Plan</h2>
        <ul className="space-y-2">
          {mockData.studyPlan.map((d) => (
            <li key={d.day}>
              <span className="font-bold">Day {d.day}:</span> {d.focus} — <span className="text-gray-600">{d.arenaProblems.join(', ')}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Rival Challenge</h2>
        <div>
          <div className="font-bold">Rival:</div> {mockData.rival.rival}
        </div>
        <div>
          <div className="font-bold">Advantage:</div> {mockData.rival.advantage}
        </div>
        <div>
          <div className="font-bold">Challenge:</div> {mockData.rival.challenge}
        </div>
      </section>
    </main>
  );
}
