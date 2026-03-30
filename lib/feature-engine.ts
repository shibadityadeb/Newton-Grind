import type {
  BatchPulseResult,
  BurnoutDetectorResult,
  ComebackModeResult,
  DailyTrendPoint,
  InterviewReadinessResult,
  PlacementSimulatorResult,
  StudyTwinResult,
  VoiceBriefResult,
  WeeklyWarReportResult,
} from "@/lib/groq";
import type { Assignment, Leaderboard, MissedLecture, Progress, QOTD, ScheduleItem } from "@/lib/newton";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calcAssignmentRate(progress: Progress): number {
  const values = Object.values(progress.assignmentCompletion || {});
  if (!values.length) return 0;
  return values.filter(Boolean).length / values.length;
}

export function calcAssessmentAvg(progress: Progress): number {
  const values = Object.values(progress.assessmentScores || {});
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function inferWeakTopics(progress: Progress): string[] {
  const entries = Object.entries(progress.assessmentScores || {});
  return entries.filter((entry): entry is [string, number] => entry[1] < 60).map(([topic]) => topic);
}

export function inferStrongTopics(progress: Progress): string[] {
  const entries = Object.entries(progress.assessmentScores || {});
  const strong = entries.filter((entry): entry is [string, number] => entry[1] >= 75).map(([topic]) => topic);
  return strong.length ? strong : ["Problem Solving"];
}

export function buildTrend(
  attendance: number,
  assignmentRate: number,
  assessmentAvg: number,
  missedLectures: number,
): DailyTrendPoint[] {
  const today = new Date();
  const drift = Math.max(0, Math.min(12, missedLectures * 1.5));
  return Array.from({ length: 7 }, (_, idx) => {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - (6 - idx));
    const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short" });
    const fatigue = Math.max(0, 6 - idx) * 0.8;
    return {
      day: dayLabel,
      attendance: clamp(attendance - drift - fatigue),
      assignmentRate: clamp(assignmentRate * 100 - drift * 1.2 - fatigue * 2),
      assessmentScore: clamp(assessmentAvg - drift * 1.1 - fatigue * 1.5),
    };
  });
}

export function fallbackBurnout(trend: DailyTrendPoint[]): BurnoutDetectorResult {
  const first = trend[0];
  const last = trend[trend.length - 1];
  const combinedDrop =
    (first.attendance - last.attendance) + (first.assignmentRate - last.assignmentRate) + (first.assessmentScore - last.assessmentScore);
  const slippingDays = combinedDrop > 24 ? 6 : combinedDrop > 12 ? 4 : 1;
  return {
    risk: combinedDrop > 24 ? "high" : combinedDrop > 12 ? "moderate" : "low",
    slippingDays,
    why: [
      "Assignment consistency dipped relative to your attendance.",
      "Assessment momentum is flatter than your previous baseline.",
      "Recovery needs smaller daily wins instead of long catch-up blocks.",
    ],
    todayPlan: [
      "Finish one overdue assignment in a 45-minute sprint.",
      "Solve 2 medium DSA problems from your weakest topic.",
      "Watch one missed lecture recording at 1.25x and take quick notes.",
    ],
  };
}

export function fallbackInterviewReadiness(
  dsaSolveRate: number,
  assessmentAvg: number,
  attendance: number,
  consistency: number,
): InterviewReadinessResult {
  const score = clamp(
    Math.round(dsaSolveRate * 0.4 + assessmentAvg * 0.3 + attendance * 0.15 + consistency * 0.15),
  );
  return {
    score,
    verdict:
      score >= 80
        ? "Strong baseline for FAANG-style DSA rounds."
        : score >= 65
          ? "Promising, but needs sharper consistency under time pressure."
          : "Not interview-ready yet, but fixable with a focused 2-week sprint.",
    breakdown: {
      dsaSolveRate: clamp(Math.round(dsaSolveRate)),
      assessments: clamp(Math.round(assessmentAvg)),
      attendance: clamp(Math.round(attendance)),
      consistency: clamp(Math.round(consistency)),
    },
    focus: ["Trees/Graphs timed practice", "2 mock interviews this week", "Daily revision of failed patterns"],
  };
}

export function fallbackBatchPulse(
  weakTopics: string[],
  missedLectures: MissedLecture[],
  leaderboard: Leaderboard,
): BatchPulseResult {
  const weak = weakTopics[0] || "Trees";
  const weeklySize = leaderboard.weekly.length || leaderboard.overall.length || 1;
  const missedRate = clamp(Math.round((missedLectures.length / Math.max(weeklySize, 1)) * 100));
  return {
    headline: `Batch pulse: ${weak} is the biggest struggle this week`,
    insights: [
      `${Math.max(40, missedRate)}% of active learners missed at least one recent lecture.`,
      "Contest participation is concentrated among top ranks.",
      "Assignment completion drops after mid-week classes.",
    ],
    heatmap: [
      { topic: weak, intensity: 82, status: "weak" },
      { topic: "Dynamic Programming", intensity: 66, status: "watch" },
      { topic: "Arrays", intensity: 42, status: "healthy" },
    ],
  };
}

export function fallbackStudyTwins(weakTopics: string[], strongTopics: string[], leaderboard: Leaderboard): StudyTwinResult {
  const names = leaderboard.weekly.slice(0, 6).map((entry) => entry.name).filter(Boolean);
  const pick = (i: number) => names[i] || `Cadet ${i + 1}`;
  return {
    matches: [
      {
        name: pick(1),
        compatibility: 91,
        yourGap: weakTopics[0] || "Trees",
        theirStrength: "Trees",
        reason: `${pick(1)} is consistently scoring well in graph-heavy sets.`,
      },
      {
        name: pick(2),
        compatibility: 84,
        yourGap: weakTopics[1] || "Dynamic Programming",
        theirStrength: "Dynamic Programming",
        reason: `${pick(2)} complements your ${strongTopics[0] || "Arrays"} strengths for pair sessions.`,
      },
      {
        name: pick(3),
        compatibility: 79,
        yourGap: "Timed coding rounds",
        theirStrength: "Contest speed",
        reason: `${pick(3)} has strong weekly consistency and can help pace practice.`,
      },
    ],
  };
}

export function fallbackPlacement(
  company: string,
  attendance: number,
  dsaSolveRate: number,
  assessmentAvg: number,
  weakTopics: string[],
): PlacementSimulatorResult {
  const readiness = clamp(Math.round(dsaSolveRate * 0.45 + assessmentAvg * 0.35 + attendance * 0.2));
  return {
    company,
    readiness,
    summary:
      readiness >= 78
        ? `You are close to ${company}-tier readiness; tighten consistency to cross the bar.`
        : `You are building toward ${company}, but core DSA depth needs a stronger two-week push.`,
    gapAnalysis: [
      `Weakest area: ${weakTopics[0] || "Trees"} pattern recognition under pressure.`,
      "Inconsistent problem completion in 35-minute windows.",
      "Revision cadence after assessments is irregular.",
    ],
    twoWeekPlan: [
      "Day 1-4: 3 medium DSA problems/day + 1 review log.",
      "Day 5-10: alternate graph/DP mock sets with timed constraints.",
      "Day 11-14: two full interview simulations + post-mortem notes.",
    ],
  };
}

export function fallbackComeback(missedLecturesCount: number, qotdStreak: number, weakTopics: string[]): ComebackModeResult {
  const active = missedLecturesCount >= 2 || qotdStreak <= 2;
  return {
    active,
    trigger: active
      ? "Detected slump from lecture misses and reduced consistency."
      : "Momentum stable; comeback mode currently idle.",
    mission: [
      {
        day: 1,
        goal: "Reset routine",
        actions: ["Attend next live class", "Solve 1 easy + 1 medium problem", "Submit one pending task"],
      },
      {
        day: 2,
        goal: `Fix ${weakTopics[0] || "core DSA"} gap`,
        actions: ["Watch one missed recording", "Practice 2 topic-focused problems", "Write a mistake log"],
      },
      {
        day: 3,
        goal: "Rebuild confidence",
        actions: ["Take one mini mock", "Review weak attempts", "Plan next 4 days with realistic load"],
      },
    ],
  };
}

export function fallbackWeeklyReport(momentum: number, trend: DailyTrendPoint[], assignmentsDue: number): WeeklyWarReportResult {
  const start = trend[0];
  const end = trend[trend.length - 1];
  return {
    weekLabel: `Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    improved: [
      `Momentum reached ${momentum}/100`,
      `Attendance trend ${Math.round(start.attendance)} -> ${Math.round(end.attendance)}`,
      "Mission completion consistency improved mid-week.",
    ],
    slipped: [
      `${assignmentsDue} assignments still pending`,
      "Assessment focus dropped on high-difficulty sets",
      "Revision blocks were shorter than target duration",
    ],
    aiInsight: "You perform best in short, high-focus blocks. Keep workload compact to prevent burnout drift.",
    nextWeek: ["Clear top 3 overdue tasks by Tuesday", "Two timed DSA sets on weak topics", "One accountability check-in with study twin"],
  };
}

export function fallbackVoiceBrief(
  studentName: string,
  nextClass: ScheduleItem | undefined,
  assignments: Assignment[],
  qotd: QOTD,
  rivalName: string,
): VoiceBriefResult {
  const nextClassTitle = nextClass?.title || "your next class";
  const nextClassTime = nextClass ? new Date(nextClass.startTime).toLocaleTimeString() : "later today";
  const due = assignments.filter((item) => new Date(item.deadline).getTime() > Date.now()).length;
  const streak = qotd.streak ?? 0;
  return {
    text: `Good morning ${studentName}. You have ${nextClassTitle} at ${nextClassTime}, ${due} assignments due soon, your QOTD streak is ${streak}, and rival ${rivalName} is pushing hard. Stay sharp.`,
    shouldAutoPlayAt8am: true,
  };
}

