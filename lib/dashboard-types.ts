import type {
  BatchPulseResult,
  BurnoutDetectorResult,
  ComebackModeResult,
  DailyBriefingResult,
  EndRankPrediction,
  InterviewReadinessResult,
  MomentumScoreResult,
  PlacementSimulatorResult,
  RivalAnalysisResult,
  StudyPlanResult,
  StudyTwinResult,
  VoiceBriefResult,
  WeeklyWarReportResult,
} from "@/lib/groq";
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
    burnout: BurnoutDetectorResult;
    interviewReadiness: InterviewReadinessResult;
    batchPulse: BatchPulseResult;
    studyTwins: StudyTwinResult;
    placement: PlacementSimulatorResult;
    comebackMode: ComebackModeResult;
    weeklyReport: WeeklyWarReportResult;
    voiceBrief: VoiceBriefResult;
  };
}
