import type { AppResult } from '../appTypes';

export type DivinationResultType = AppResult['type'];

export type OutcomeMatched = 'matched' | 'partial' | 'missed' | 'unknown';

export type TimingMatched = 'early' | 'on_time' | 'late' | 'not_happened' | 'unknown';

export type FeedbackQuality = 'valid' | 'test' | 'noise' | 'invalid_datetime' | 'meaningless_question' | 'duplicate' | 'unknown';

export type FeedbackPrivacyLevel = 'private_raw' | 'anonymized' | 'public_stats';

export type DivinationRecord = {
  id: string;
  resultType: DivinationResultType;
  modeLabel: string;
  createdAt: string;
  title: string;
  result: AppResult;
};

export type DivinationFeedback = {
  recordId: string;
  resultType: DivinationResultType;
  createdAt: string;
  feedbackAt: string;
  actualOutcome: string;
  outcomeMatched: OutcomeMatched;
  timingMatched?: TimingMatched;
  qualityTag: FeedbackQuality;
  privacyLevel: FeedbackPrivacyLevel;
  usefulParts: string[];
  wrongParts: string[];
  userNote: string;
  adminReviewNote?: string;
  originalResult: AppResult;
};

export type FeedbackStats = {
  total: number;
  byOutcomeMatched: Record<string, number>;
  byTimingMatched: Record<string, number>;
  byResultType: Record<string, number>;
};

export type PrivateRawFeedbackExport = {
  exportType: 'private_raw';
  exportedAt: string;
  privacyWarning: string;
  feedbacks: DivinationFeedback[];
};

export type AnonymizedFeedbackExportItem = {
  resultType: DivinationResultType;
  questionCategory: string;
  outcomeMatched: OutcomeMatched;
  timingMatched: TimingMatched;
  qualityTag: FeedbackQuality;
  ruleVersion: string;
};

export type AnonymizedFeedbackExport = {
  exportType: 'anonymized';
  exportedAt: string;
  feedbacks: AnonymizedFeedbackExportItem[];
};
