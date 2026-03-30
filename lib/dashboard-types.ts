import type {
  DailyBriefingResult,
  EndRankPrediction,
  MomentumScoreResult,
  RivalAnalysisResult,
  StudyPlanResult,
} from "@/lib/claude";
import type { Assignments, Leaderboard, MissedLectures, Problem, Progress, QOTD, Schedule } from "@/lib/newton";

export interface DashboardResponse {
  schedule: Schedule;
  progress: Progress;
  assignments: Assignments;
  qotd: QOTD;
  leaderboard: Leaderboard;
  missedLectures: MissedLectures;
  arenaRecommendations: Problem[];
  insights: {
    briefing: DailyBriefingResult;
    studyPlan: StudyPlanResult;
    rival: RivalAnalysisResult;
    endRank: EndRankPrediction;
    momentum: MomentumScoreResult;
  };
}
