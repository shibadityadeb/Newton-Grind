"use client";

import dynamic from "next/dynamic";
import { Space_Mono, Syne } from "next/font/google";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardResponse } from "@/lib/dashboard-types";

const ShareCard = dynamic(() => import("@/components/ShareCard"), { ssr: false });

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

function getPriority(index: number): "HIGH" | "MED" {
  return index === 0 || index === 2 ? "HIGH" : "MED";
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`[ui] fetching ${url}`);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${url} failed with ${response.status}: ${message}`);
  }
  return (await response.json()) as T;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(total / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function formatDeadline(iso: string): string {
  const due = new Date(iso);
  const ms = due.getTime() - Date.now();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.max(0, Math.floor((ms % 3600000) / 60000));
  if (ms <= 0) return "Overdue";
  if (hours < 1) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  return due.toLocaleString();
}

function urgencyForDeadline(iso: string): "urgent" | "warn" | "normal" {
  const dueMs = new Date(iso).getTime() - Date.now();
  if (dueMs <= 4 * 3600000) return "urgent";
  if (dueMs <= 12 * 3600000) return "warn";
  return "normal";
}

function computeTrajectory(currentRank: number, predictedRank: number) {
  const start = currentRank + 280;
  const mid = currentRank + 180;
  return [
    { checkpoint: "W1", rank: start, predicted: start },
    { checkpoint: "W2", rank: start - 60, predicted: start - 75 },
    { checkpoint: "W3", rank: start - 120, predicted: start - 145 },
    { checkpoint: "W4", rank: mid, predicted: mid - 30 },
    { checkpoint: "W5", rank: currentRank, predicted: Math.max(1, currentRank - 25) },
    { checkpoint: "W6", rank: null, predicted: Math.max(1, predictedRank) },
  ];
}

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      console.log("[ui] dashboard load start");
      const [dashboardRes, briefingRes, studyPlanRes, rivalRes, momentumRes] = await Promise.allSettled([
        fetchJson<DashboardResponse>("/api/dashboard"),
        fetchJson<DashboardResponse["insights"]["briefing"]>("/api/briefing"),
        fetchJson<DashboardResponse["insights"]["studyPlan"]>("/api/study-plan"),
        fetchJson<DashboardResponse["insights"]["rival"]>("/api/rival"),
        fetchJson<DashboardResponse["insights"]["momentum"]>("/api/momentum"),
      ]);

      if (dashboardRes.status !== "fulfilled") {
        throw dashboardRes.reason;
      }

      const base = dashboardRes.value;
      const merged: DashboardResponse = {
        ...base,
        insights: {
          briefing: briefingRes.status === "fulfilled" ? briefingRes.value : base.insights.briefing,
          studyPlan: studyPlanRes.status === "fulfilled" ? studyPlanRes.value : base.insights.studyPlan,
          rival: rivalRes.status === "fulfilled" ? rivalRes.value : base.insights.rival,
          endRank: base.insights.endRank,
          momentum: momentumRes.status === "fulfilled" ? momentumRes.value : base.insights.momentum,
        },
      };

      if (!mounted) return;
      setDashboard(merged);
      console.log("[ui] dashboard load complete", {
        assignments: merged.assignments.length,
        missionItems: merged.insights.briefing.mission.length,
        studyDays: merged.insights.studyPlan.plan.length,
      });
    }

    loadData().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "unknown error";
      console.log(`[ui] dashboard load failed. reason=${message}`);
      if (mounted) setLoadError(message);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loadError) {
    return (
      <div className={`${spaceMono.className} min-h-screen bg-[#0a0e1a] p-8 text-[#d7deed]`}>
        <h1 className={`${syne.className} text-2xl font-bold text-[#f43f5e]`}>Dashboard Load Failed</h1>
        <p className="mt-3 text-sm">{loadError}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={`${spaceMono.className} min-h-screen bg-[#0a0e1a] p-8 text-[#d7deed]`}>
        <h1 className={`${syne.className} text-2xl font-bold text-white`}>Loading War Room...</h1>
      </div>
    );
  }

  const studentName =
    typeof dashboard.progress.name === "string"
      ? dashboard.progress.name
      : typeof dashboard.progress.user === "string"
        ? dashboard.progress.user
        : "Cadet";
  const rankEntry = dashboard.leaderboard.overall.find((entry) => entry.name === studentName);
  const rankNumber = rankEntry?.rank ?? dashboard.insights.endRank.predictedRank;
  const momentum = dashboard.insights.momentum.score;
  const qotdStreak = dashboard.qotd.streak ?? 0;

  const nextClass = [...dashboard.schedule]
    .map((slot) => ({ ...slot, startDate: new Date(slot.startTime) }))
    .filter((slot) => slot.startDate.getTime() > now.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

  const countdown = nextClass ? formatCountdown(nextClass.startDate.getTime() - now.getTime()) : "00:00:00";
  const assignments = [...dashboard.assignments].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  );
  const trajectoryData = computeTrajectory(rankNumber, dashboard.insights.endRank.predictedRank);
  const momentumRingStyle = {
    background: `conic-gradient(#00d4aa ${Math.min(Math.max(momentum, 0), 100) * 3.6}deg, #1e2b43 0deg)`,
  };

  return (
    <div
      className={`${spaceMono.className} min-h-screen bg-[#0a0e1a] text-[#d7deed]`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 8% 12%, rgba(0,212,170,0.18), transparent 30%), radial-gradient(circle at 85% 8%, rgba(244,63,94,0.12), transparent 28%), linear-gradient(180deg, #0a0e1a 0%, #080c16 100%)",
      }}
    >
      <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center">
          <ShareCard rank={rankNumber} momentum={momentum} streak={qotdStreak} />
        </div>

        <section className="mb-5 grid gap-4 rounded-2xl border border-[#1c2a44] bg-[#0d1526]/90 p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)] lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className={`${syne.className} text-xl font-extrabold text-white sm:text-2xl`}>{studentName}</p>
            <p className="mt-1 text-xs tracking-[0.2em] text-[#7f92b8] uppercase">JEE 2027 Alpha</p>
          </div>
          <div className="flex items-center lg:justify-center">
            <span className="rounded-md border border-[#00d4aa]/50 bg-[#00d4aa]/15 px-3 py-1 text-xs font-bold tracking-[0.18em] text-[#00d4aa] uppercase">
              Rank #{rankNumber}
            </span>
          </div>
          <div className="flex items-center gap-3 lg:justify-center">
            <div
              className="momentum-ring relative grid h-14 w-14 place-items-center rounded-full p-[4px]"
              style={momentumRingStyle}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#0d1526] text-[11px] font-bold text-[#00d4aa]">
                {momentum}
              </div>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-[#7f92b8] uppercase">Momentum</p>
              <p className="text-sm font-bold text-white">Score / 100</p>
            </div>
          </div>
          <div className="flex items-center justify-start lg:justify-end">
            <div>
              <p className="text-xs tracking-[0.2em] text-[#7f92b8] uppercase">Live Clock</p>
              <p className="text-lg font-bold text-[#00d4aa]">{now.toLocaleTimeString()}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h2 className={`${syne.className} text-lg font-bold text-white`}>Today&apos;s Mission</h2>
              <p className="mt-1 text-xs text-[#7f92b8]">AI BRIEFING: Execute in order for max rank gain.</p>
              <ul className="mt-4 space-y-3">
                {dashboard.insights.briefing.mission.map((text, index) => {
                  const priority = getPriority(index);
                  return (
                    <li key={`${text}-${index}`} className="rounded-xl border border-[#233454] bg-[#0a1221] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-5 text-[#d7deed]">{text}</p>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] ${
                            priority === "HIGH" ? "bg-[#f43f5e]/20 text-[#f43f5e]" : "bg-[#f59e0b]/20 text-[#f59e0b]"
                          }`}
                        >
                          {priority}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <p className={`${syne.className} text-base font-bold text-white`}>Next Class Countdown</p>
              <p className="mt-1 text-xs text-[#7f92b8]">
                Slot: {nextClass ? `${nextClass.title} • ${nextClass.startDate.toLocaleString()}` : "No classes scheduled"}
              </p>
              <p className="countdown mt-3 text-3xl font-bold tracking-[0.08em] text-[#00d4aa]">{countdown}</p>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <p className={`${syne.className} text-base font-bold text-white`}>QOTD Streak</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flame-icon" />
                <p className="text-2xl font-bold text-[#f59e0b]">{qotdStreak} days</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-1">
            <div className="h-[390px] rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h2 className={`${syne.className} text-lg font-bold text-white`}>Rank Trajectory</h2>
              <p className="mt-1 text-xs text-[#7f92b8]">Current rank vs predicted end-rank projection.</p>
              <div className="mt-3 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData}>
                    <CartesianGrid stroke="#243757" strokeDasharray="4 4" />
                    <XAxis dataKey="checkpoint" stroke="#8aa0c8" tick={{ fill: "#8aa0c8", fontSize: 12 }} />
                    <YAxis
                      domain={["dataMin - 30", "dataMax + 30"]}
                      reversed
                      stroke="#8aa0c8"
                      tick={{ fill: "#8aa0c8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0b1322",
                        border: "1px solid #28416a",
                        color: "#d7deed",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#d7deed" }} />
                    <Line
                      type="monotone"
                      dataKey="rank"
                      name="Current Rank"
                      stroke="#00d4aa"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#00d4aa" }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted End Rank"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="7 6"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Rival Tracker</h3>
              <p className="mt-3 text-sm text-[#7f92b8]">
                <span className="font-bold text-[#d7deed]">Rival:</span> {dashboard.insights.rival.rival}
              </p>
              <p className="mt-2 text-sm text-[#7f92b8]">
                <span className="font-bold text-[#f59e0b]">Beating you in:</span> {dashboard.insights.rival.advantage}
              </p>
              <p className="mt-3 rounded-lg border border-[#00d4aa]/35 bg-[#00d4aa]/10 p-3 text-sm text-[#b7ffe8]">
                Today&apos;s challenge: {dashboard.insights.rival.challenge}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Assignments Due</h3>
              <ul className="mt-3 space-y-2">
                {assignments.map((item) => {
                  const urgency = urgencyForDeadline(item.deadline);
                  return (
                    <li
                      key={item.id}
                      className={`rounded-lg border p-3 ${
                        urgency === "urgent"
                          ? "urgent-shake border-[#f43f5e]/60 bg-[#f43f5e]/10"
                          : urgency === "warn"
                            ? "border-[#f59e0b]/50 bg-[#f59e0b]/10"
                            : "border-[#2d4369] bg-[#101a30]"
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p
                        className={`mt-1 text-xs ${
                          urgency === "urgent"
                            ? "text-[#f43f5e]"
                            : urgency === "warn"
                              ? "text-[#f59e0b]"
                              : "text-[#7f92b8]"
                        }`}
                      >
                        Due: {formatDeadline(item.deadline)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Missed Lectures</h3>
              <ul className="mt-3 space-y-2">
                {dashboard.missedLectures.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                    <p className="text-sm text-white">{item.title}</p>
                    <a href={`/recordings/${item.id}`} className="mt-1 inline-block text-xs text-[#00d4aa] underline">
                      Watch recording
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Arena Recommendations</h3>
              <ul className="mt-3 space-y-2">
                {dashboard.arenaRecommendations.slice(0, 3).map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                    <p className="text-sm text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-[#7f92b8]">
                      {item.topic} • {item.difficulty}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
          <h3 className={`${syne.className} text-lg font-bold text-white`}>5-Day Study Plan</h3>
          <p className="mt-1 text-xs text-[#7f92b8]">AI-generated and adaptable after every mock test.</p>
          <div className="mt-3 space-y-2">
            {dashboard.insights.studyPlan.plan.map((item) => (
              <details key={item.day} className="group rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                <summary className="cursor-pointer list-none text-sm font-bold text-[#d7deed]">
                  Day {item.day}: {item.focus}
                  <span className="ml-2 text-[#00d4aa] group-open:hidden">[expand]</span>
                  <span className="ml-2 hidden text-[#00d4aa] group-open:inline">[collapse]</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-[#9eb0d2]">
                  Arena set: {item.arenaProblems.join(", ")}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes ringPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(0, 212, 170, 0.25);
          }
          50% {
            box-shadow: 0 0 18px rgba(0, 212, 170, 0.45);
          }
        }
        @keyframes tickFade {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes flameFlicker {
          0%,
          100% {
            transform: scale(1) translateY(0);
            filter: brightness(1);
          }
          45% {
            transform: scale(1.06) translateY(-1px);
            filter: brightness(1.15);
          }
        }
        @keyframes urgentShake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-1.4px);
          }
          75% {
            transform: translateX(1.4px);
          }
        }
        .momentum-ring {
          animation: ringPulse 2.4s ease-in-out infinite;
        }
        .countdown {
          animation: tickFade 1s linear infinite;
        }
        .flame-icon {
          width: 18px;
          height: 24px;
          border-radius: 55% 55% 45% 45%;
          background: radial-gradient(circle at 40% 30%, #ffd89a 10%, #f59e0b 55%, #fb5d20 95%);
          box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
          animation: flameFlicker 0.85s ease-in-out infinite;
        }
        .urgent-shake {
          animation: urgentShake 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
