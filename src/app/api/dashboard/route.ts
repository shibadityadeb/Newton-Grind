import {
  calculateMomentumScore,
  detectBurnout,
  generateBatchPulse,
  generateComebackMode,
  generateDailyBriefing,
  generateRivalAnalysis,
  generateStudyPlan,
  generateVoiceBrief,
  generateWeeklyWarReport,
  predictEndRank,
  scoreInterviewReadiness,
  simulatePlacement,
  findStudyTwins,
} from "@/lib/groq";
import cache from "@/lib/cache";
import type { DashboardResponse } from "@/lib/dashboard-types";
import {
  buildTrend,
  calcAssessmentAvg,
  calcAssignmentRate,
  fallbackBatchPulse,
  fallbackBurnout,
  fallbackComeback,
  fallbackInterviewReadiness,
  fallbackPlacement,
  fallbackStudyTwins,
  fallbackVoiceBrief,
  fallbackWeeklyReport,
  inferStrongTopics,
  inferWeakTopics,
} from "@/lib/feature-engine";
import type { Assignment, Leaderboard, MissedLecture, Problem, Progress, QOTD, ScheduleItem } from "@/lib/newton";
import {
  fetchAssignments,
  fetchLeaderboard,
  fetchMissedLectures,
  fetchProgress,
  fetchQOTD,
  fetchSchedule,
  searchProblems,
} from "@/lib/newton";

export const dynamic = "force-dynamic";

const EMPTY_PROGRESS: Progress = {
  attendance: 0,
  assessmentScores: {},
  assignmentCompletion: {},
  name: "Student",
};

const EMPTY_QOTD: QOTD = {
  question: "No QOTD data available",
  streak: 0,
  leaderboard: [],
};

const EMPTY_LEADERBOARD: Leaderboard = {
  overall: [],
  weekly: [],
  monthly: [],
};

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.log(`[api/dashboard] ${label} failed, using fallback. reason=${message}`);
    return fallback;
  }
}

export async function GET() {
  try {
    console.log("[api/dashboard] request start");
    const cacheKey = "dashboard-v2";
    const cached = cache.get<DashboardResponse>(cacheKey);
    if (cached) {
      console.log("[api/dashboard] cache hit");
      return Response.json(cached);
    }

    const [schedule, progress, assignments, qotd, leaderboard, missedLectures, arenaRecommendations] = await Promise.all([
      safe("schedule", fetchSchedule, [] as ScheduleItem[]),
      safe("progress", fetchProgress, EMPTY_PROGRESS),
      safe("assignments", fetchAssignments, [] as Assignment[]),
      safe("qotd", fetchQOTD, EMPTY_QOTD),
      safe("leaderboard", fetchLeaderboard, EMPTY_LEADERBOARD),
      safe("missedLectures", fetchMissedLectures, [] as MissedLecture[]),
      safe("arenaRecommendations", () => searchProblems({ difficulty: "medium" }), [] as Problem[]),
    ]);

    const myName = typeof progress.name === "string" ? progress.name : typeof progress.user === "string" ? progress.user : "";
    const myRankIndex = Math.max(0, leaderboard.overall.findIndex((entry) => entry.name === myName));
    const assignmentRate = calcAssignmentRate(progress);
    const assessmentAvg = calcAssessmentAvg(progress);
    const weakTopics = inferWeakTopics(progress);
    const strongTopics = inferStrongTopics(progress);
    const trend = buildTrend(progress.attendance ?? 0, assignmentRate, assessmentAvg, missedLectures.length);
    const consistency = Math.max(0, 100 - Math.max(0, missedLectures.length - 1) * 12);
    const dsaSolveRate = Math.max(0, Math.min(100, assignmentRate * 100 * 0.7 + assessmentAvg * 0.3));

    const momentum = await safe(
      "momentum",
      () =>
        calculateMomentumScore({
          attendance: progress.attendance ?? 0,
          qotdStreak: qotd.streak ?? 0,
          assignmentRate,
          assessmentAvg,
        }),
      {
        score: Math.round(progress.attendance * 0.4 + assignmentRate * 100 * 0.3 + assessmentAvg * 0.3),
        breakdown: {
          attendance: progress.attendance ?? 0,
          qotdStreak: qotd.streak ?? 0,
          assignmentRate,
          assessmentAvg,
        },
      },
    );

    const rival = await safe(
      "rival",
      () => generateRivalAnalysis({ leaderboard, myRank: myRankIndex, myStats: progress }),
      {
        rival: leaderboard.overall[Math.min(myRankIndex + 1, leaderboard.overall.length - 1)]?.name ?? "Top Cadet",
        advantage: "Higher weekly consistency",
        challenge: "Beat them by completing 3 medium DSA problems today before 9 PM.",
      },
    );

    const [briefing, studyPlan, endRank, burnout, interviewReadiness, batchPulse, studyTwins, placement, comebackMode, weeklyReport, voiceBrief] =
      await Promise.all([
        safe("briefing", () => generateDailyBriefing({ schedule, assignments, qotd, progress }), {
          mission: [
            "Complete one priority assignment before noon.",
            "Attend your next class and summarize 3 key points.",
            "Solve two medium DSA problems to protect momentum.",
          ] as [string, string, string],
        }),
        safe("studyPlan", () => generateStudyPlan({ progress, missedLectures, weakTopics }), {
          plan: Array.from({ length: 5 }, (_, idx) => ({
            day: idx + 1,
            focus: weakTopics[idx % Math.max(weakTopics.length, 1)] || "DSA Fundamentals",
            arenaProblems: ["2 Easy", "2 Medium", "1 Revision"],
          })),
        }),
        safe(
          "endRank",
          () => predictEndRank({ progress, currentRank: myRankIndex + 1, batchSize: leaderboard.overall.length }),
          {
            predictedRank: Math.max(1, myRankIndex + 1),
            confidence: 0.58,
            reasoning: "Prediction held steady due to limited recent volatility in available data.",
          },
        ),
        safe("burnout", () => detectBurnout({ trend, attendance: progress.attendance ?? 0, assignmentRate, assessmentAvg }), fallbackBurnout(trend)),
        safe(
          "interviewReadiness",
          () => scoreInterviewReadiness({ dsaSolveRate, attendance: progress.attendance ?? 0, assessmentAvg, consistency, profile: progress }),
          fallbackInterviewReadiness(dsaSolveRate, assessmentAvg, progress.attendance ?? 0, consistency),
        ),
        safe(
          "batchPulse",
          () => generateBatchPulse({ leaderboard, assignments, missedLectures, assessments: progress.assessmentScores || {} }),
          fallbackBatchPulse(weakTopics, missedLectures, leaderboard),
        ),
        safe(
          "studyTwins",
          () => findStudyTwins({ myWeakTopics: weakTopics, myStrongTopics: strongTopics, leaderboard }),
          fallbackStudyTwins(weakTopics, strongTopics, leaderboard),
        ),
        safe(
          "placement",
          () =>
            simulatePlacement({
              company: "Flipkart",
              attendance: progress.attendance ?? 0,
              dsaSolveRate,
              assessmentAvg,
              weakTopics,
            }),
          fallbackPlacement("Flipkart", progress.attendance ?? 0, dsaSolveRate, assessmentAvg, weakTopics),
        ),
        safe(
          "comebackMode",
          () =>
            generateComebackMode({
              missedLectures: missedLectures.length,
              qotdStreak: qotd.streak ?? 0,
              weakTopics,
            }),
          fallbackComeback(missedLectures.length, qotd.streak ?? 0, weakTopics),
        ),
        safe(
          "weeklyWarReport",
          () =>
            generateWeeklyWarReport({
              trend,
              momentum: momentum.score,
              missedLectures: missedLectures.length,
              assignmentsDue: assignments.filter((item) => item.status !== "completed").length,
            }),
          fallbackWeeklyReport(momentum.score, trend, assignments.filter((item) => item.status !== "completed").length),
        ),
        safe(
          "voiceBrief",
          () =>
            generateVoiceBrief({
              studentName: myName || "Student",
              nextClassTitle: schedule[0]?.title ?? "your next class",
              nextClassTime: schedule[0]?.startTime ?? new Date().toISOString(),
              dueAssignments: assignments.filter((item) => item.status !== "completed").length,
              qotdStreak: qotd.streak ?? 0,
              rivalName: rival.rival,
            }),
          fallbackVoiceBrief(myName || "Student", schedule[0], assignments, qotd, rival.rival),
        ),
      ]);

    const payload: DashboardResponse = {
      schedule,
      progress,
      assignments,
      qotd,
      leaderboard,
      missedLectures,
      arenaRecommendations,
      insights: {
        briefing,
        studyPlan,
        rival,
        endRank,
        momentum,
        burnout,
        interviewReadiness,
        batchPulse,
        studyTwins,
        placement,
        comebackMode,
        weeklyReport,
        voiceBrief,
      },
    };

    cache.set(cacheKey, payload, 300);
    console.log("[api/dashboard] success", {
      schedule: schedule.length,
      assignments: assignments.length,
      missedLectures: missedLectures.length,
      arenaRecommendations: arenaRecommendations.length,
      missionItems: briefing.mission.length,
      planDays: studyPlan.plan.length,
      burnoutRisk: burnout.risk,
      interviewReadiness: interviewReadiness.score,
    });

    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.log(`[api/dashboard] error=${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
