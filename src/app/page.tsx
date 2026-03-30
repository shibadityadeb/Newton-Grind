"use client";

import { Space_Mono, Syne } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
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

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const student = {
  name: "Shiba D.",
  batch: "JEE 2027 Alpha",
  rank: "Lieutenant",
  momentum: 84,
  qotdStreak: 19,
};

const missionItems = [
  { text: "Finish Electrostatics PYQ set (30Q)", priority: "HIGH" },
  { text: "Revise Organic mechanisms notebook", priority: "MED" },
  { text: "Attempt timed Algebra ladder challenge", priority: "HIGH" },
];

const trajectoryData = [
  { checkpoint: "W1", rank: 982, predicted: 982 },
  { checkpoint: "W2", rank: 910, predicted: 905 },
  { checkpoint: "W3", rank: 856, predicted: 840 },
  { checkpoint: "W4", rank: 802, predicted: 780 },
  { checkpoint: "W5", rank: 748, predicted: 725 },
  { checkpoint: "W6", rank: null, predicted: 668 },
  { checkpoint: "W7", rank: null, predicted: 610 },
];

const assignments = [
  { title: "Physics Mock Analysis", dueIn: "2h 15m", urgency: "urgent" },
  { title: "Inorganic NCERT Drill", dueIn: "Today 11:45 PM", urgency: "warn" },
  { title: "Calculus Revision Sheet", dueIn: "Tomorrow 9:00 AM", urgency: "normal" },
];

const missedLectures = [
  { topic: "Capacitance Masterclass", link: "#" },
  { topic: "Complex Numbers Shortcuts", link: "#" },
];

const arenaRecommendations = [
  { title: "JEE Adv: Rotational Dynamics 15Q Sprint", level: "Level: Tactical 7" },
  { title: "Coordinate Geometry Trap Set", level: "Level: Tactical 6" },
  { title: "Modern Physics Mixed Bag", level: "Level: Tactical 7" },
];

const studyPlan = [
  {
    day: "Day 1",
    title: "Kinematics + Trigonometry Core",
    detail: "2 focused blocks on vector breakdown + 1 speed drill. End with 20-minute error-log review.",
  },
  {
    day: "Day 2",
    title: "Chemical Bonding + Mole Concept",
    detail: "Active recall pass in the morning, numericals in the evening. Revisit weak ionization questions.",
  },
  {
    day: "Day 3",
    title: "Quadratic + Sequence/Series",
    detail: "Solve in mixed mode under timer. Tag all mistakes by pattern, not by chapter.",
  },
  {
    day: "Day 4",
    title: "Current Electricity + Thermodynamics",
    detail: "Practice derivation-first, then apply in 25Q timed set to improve transition speed.",
  },
  {
    day: "Day 5",
    title: "Full-Length Simulation + Debrief",
    detail: "Three-hour paper in exam conditions. Post-paper debrief on misses, guesswork, and pacing.",
  },
];

const classSlots = ["08:00", "12:30", "17:30"];

function getNextClass(now: Date) {
  const slots = classSlots
    .map((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const date = new Date(now);
      date.setHours(h, m, 0, 0);
      return date;
    })
    .filter((date) => date.getTime() > now.getTime());

  if (slots.length) {
    return slots[0];
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const [h, m] = classSlots[0].split(":").map(Number);
  tomorrow.setHours(h, m, 0, 0);
  return tomorrow;
}

function formatCountdown(ms: number) {
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

export default function Home() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextClass = useMemo(() => getNextClass(now), [now]);
  const countdown = formatCountdown(nextClass.getTime() - now.getTime());
  const momentumRingStyle = {
    background: `conic-gradient(#00d4aa ${student.momentum * 3.6}deg, #1e2b43 0deg)`,
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
        <section className="mb-5 grid gap-4 rounded-2xl border border-[#1c2a44] bg-[#0d1526]/90 p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)] lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className={`${syne.className} text-xl font-extrabold text-white sm:text-2xl`}>{student.name}</p>
            <p className="mt-1 text-xs tracking-[0.2em] text-[#7f92b8] uppercase">{student.batch}</p>
          </div>
          <div className="flex items-center lg:justify-center">
            <span className="rounded-md border border-[#00d4aa]/50 bg-[#00d4aa]/15 px-3 py-1 text-xs font-bold tracking-[0.18em] text-[#00d4aa] uppercase">
              Rank {student.rank}
            </span>
          </div>
          <div className="flex items-center gap-3 lg:justify-center">
            <div
              className="momentum-ring relative grid h-14 w-14 place-items-center rounded-full p-[4px]"
              style={momentumRingStyle}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#0d1526] text-[11px] font-bold text-[#00d4aa]">
                {student.momentum}
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
                {missionItems.map((item) => (
                  <li key={item.text} className="rounded-xl border border-[#233454] bg-[#0a1221] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-5 text-[#d7deed]">{item.text}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] ${
                          item.priority === "HIGH"
                            ? "bg-[#f43f5e]/20 text-[#f43f5e]"
                            : "bg-[#f59e0b]/20 text-[#f59e0b]"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <p className={`${syne.className} text-base font-bold text-white`}>Next Class Countdown</p>
              <p className="mt-1 text-xs text-[#7f92b8]">Slot: {nextClass.toLocaleString()}</p>
              <p className="countdown mt-3 text-3xl font-bold tracking-[0.08em] text-[#00d4aa]">{countdown}</p>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <p className={`${syne.className} text-base font-bold text-white`}>QOTD Streak</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flame-icon" />
                <p className="text-2xl font-bold text-[#f59e0b]">{student.qotdStreak} days</p>
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
                      domain={["dataMin - 40", "dataMax + 40"]}
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
                <span className="font-bold text-[#d7deed]">Rival:</span> Ananya K.
              </p>
              <p className="mt-2 text-sm text-[#7f92b8]">
                <span className="font-bold text-[#f59e0b]">Beating you in:</span> faster mock-paper review turnaround.
              </p>
              <p className="mt-3 rounded-lg border border-[#00d4aa]/35 bg-[#00d4aa]/10 p-3 text-sm text-[#b7ffe8]">
                Today&apos;s challenge: finish your mock debrief within 35 minutes and close every marked weak node.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Assignments Due</h3>
              <ul className="mt-3 space-y-2">
                {assignments.map((item) => (
                  <li
                    key={item.title}
                    className={`rounded-lg border p-3 ${
                      item.urgency === "urgent"
                        ? "urgent-shake border-[#f43f5e]/60 bg-[#f43f5e]/10"
                        : item.urgency === "warn"
                          ? "border-[#f59e0b]/50 bg-[#f59e0b]/10"
                          : "border-[#2d4369] bg-[#101a30]"
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p
                      className={`mt-1 text-xs ${
                        item.urgency === "urgent"
                          ? "text-[#f43f5e]"
                          : item.urgency === "warn"
                            ? "text-[#f59e0b]"
                            : "text-[#7f92b8]"
                      }`}
                    >
                      Due: {item.dueIn}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Missed Lectures</h3>
              <ul className="mt-3 space-y-2">
                {missedLectures.map((item) => (
                  <li key={item.topic} className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                    <p className="text-sm text-white">{item.topic}</p>
                    <a href={item.link} className="mt-1 inline-block text-xs text-[#00d4aa] underline">
                      Watch recording
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#1c2a44] bg-[#0e1629] p-4">
              <h3 className={`${syne.className} text-lg font-bold text-white`}>Arena Recommendations</h3>
              <ul className="mt-3 space-y-2">
                {arenaRecommendations.map((item) => (
                  <li key={item.title} className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                    <p className="text-sm text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-[#7f92b8]">{item.level}</p>
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
            {studyPlan.map((item) => (
              <details key={item.day} className="group rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
                <summary className="cursor-pointer list-none text-sm font-bold text-[#d7deed]">
                  {item.day}: {item.title}
                  <span className="ml-2 text-[#00d4aa] group-open:hidden">[expand]</span>
                  <span className="ml-2 hidden text-[#00d4aa] group-open:inline">[collapse]</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-[#9eb0d2]">{item.detail}</p>
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
