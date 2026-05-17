import type { AppResult } from '../appTypes';
import type {
  AnonymizedFeedbackExport,
  DivinationFeedback,
  DivinationRecord,
  DivinationResultType,
  FeedbackPrivacyLevel,
  FeedbackQuality,
  FeedbackStats,
  OutcomeMatched,
  PrivateRawFeedbackExport,
  TimingMatched,
} from './types';

export const RECORD_STORAGE_KEY = 'divination_records';
export const FEEDBACK_STORAGE_KEY = 'divination_feedbacks';
export const LEGACY_RECORD_STORAGE_KEY = 'paipan-mvp.divination-records.v1';
export const MAX_RECORDS = 12;

const OUTCOME_KEYS: OutcomeMatched[] = ['matched', 'partial', 'missed', 'unknown'];
const TIMING_KEYS: TimingMatched[] = ['early', 'on_time', 'late', 'not_happened', 'unknown'];
const RESULT_TYPE_KEYS: DivinationResultType[] = ['da_liuren', 'xiao_liuren', 'liu_yao'];
const QUALITY_KEYS: FeedbackQuality[] = ['valid', 'test', 'noise', 'invalid_datetime', 'meaningless_question', 'duplicate', 'unknown'];
const PRIVACY_KEYS: FeedbackPrivacyLevel[] = ['private_raw', 'anonymized', 'public_stats'];
const PRIVATE_RAW_WARNING = '该文件包含问题原文、出生时间和反馈数据，请勿上传 GitHub。';

function hasLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function parseStoredArray<T>(key: string): T[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]) {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isAppResult(value: unknown): value is AppResult {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return type === 'da_liuren' || type === 'xiao_liuren' || type === 'liu_yao';
}

function resultTypeLabel(type: DivinationResultType) {
  if (type === 'da_liuren') return '大六壬';
  if (type === 'liu_yao') return '六爻';
  return '小六壬';
}

function normalizeRecord(value: Partial<DivinationRecord>): DivinationRecord | null {
  if (!value || !value.id || !value.createdAt || !isAppResult(value.result)) return null;
  return {
    id: String(value.id),
    resultType: value.result.type,
    modeLabel: value.modeLabel || resultTypeLabel(value.result.type),
    createdAt: String(value.createdAt),
    title: value.title || resultTypeLabel(value.result.type),
    result: value.result,
  };
}

function normalizeFeedback(value: Partial<DivinationFeedback>): DivinationFeedback | null {
  if (!value || !value.recordId || !value.createdAt || !value.feedbackAt || !isAppResult(value.originalResult)) return null;
  const resultType = value.resultType || value.originalResult.type;
  return {
    recordId: String(value.recordId),
    resultType,
    createdAt: String(value.createdAt),
    feedbackAt: String(value.feedbackAt),
    actualOutcome: value.actualOutcome || '',
    outcomeMatched: OUTCOME_KEYS.includes(value.outcomeMatched as OutcomeMatched) ? (value.outcomeMatched as OutcomeMatched) : 'unknown',
    timingMatched: TIMING_KEYS.includes(value.timingMatched as TimingMatched) ? (value.timingMatched as TimingMatched) : 'unknown',
    qualityTag: QUALITY_KEYS.includes(value.qualityTag as FeedbackQuality) ? (value.qualityTag as FeedbackQuality) : 'unknown',
    privacyLevel: PRIVACY_KEYS.includes(value.privacyLevel as FeedbackPrivacyLevel) ? (value.privacyLevel as FeedbackPrivacyLevel) : 'private_raw',
    usefulParts: Array.isArray(value.usefulParts) ? value.usefulParts.map(String) : [],
    wrongParts: Array.isArray(value.wrongParts) ? value.wrongParts.map(String) : [],
    userNote: value.userNote || '',
    adminReviewNote: value.adminReviewNote || '',
    originalResult: value.originalResult,
  };
}

export function loadRecords(): DivinationRecord[] {
  const stored = parseStoredArray<Partial<DivinationRecord>>(RECORD_STORAGE_KEY).map(normalizeRecord).filter(Boolean) as DivinationRecord[];
  if (stored.length || !hasLocalStorage() || window.localStorage.getItem(RECORD_STORAGE_KEY)) return stored;

  const legacy = parseStoredArray<Partial<DivinationRecord>>(LEGACY_RECORD_STORAGE_KEY).map(normalizeRecord).filter(Boolean) as DivinationRecord[];
  if (legacy.length) writeStoredArray(RECORD_STORAGE_KEY, legacy);
  return legacy;
}

export function saveRecords(records: DivinationRecord[]) {
  writeStoredArray(RECORD_STORAGE_KEY, records);
}

export function loadFeedbacks(): DivinationFeedback[] {
  return parseStoredArray<Partial<DivinationFeedback>>(FEEDBACK_STORAGE_KEY).map(normalizeFeedback).filter(Boolean) as DivinationFeedback[];
}

export function saveFeedbacks(feedbacks: DivinationFeedback[]) {
  writeStoredArray(FEEDBACK_STORAGE_KEY, feedbacks);
}

export function upsertFeedback(feedbacks: DivinationFeedback[], feedback: DivinationFeedback) {
  return [feedback, ...feedbacks.filter((item) => item.recordId !== feedback.recordId)];
}

export function createFeedbackMap(feedbacks: DivinationFeedback[]) {
  return feedbacks.reduce<Record<string, DivinationFeedback>>((map, feedback) => {
    map[feedback.recordId] = feedback;
    return map;
  }, {});
}

export function calculateFeedbackStats(feedbacks: DivinationFeedback[]): FeedbackStats {
  const validFeedbacks = feedbacks.filter((feedback) => feedback.qualityTag === 'valid');
  const stats: FeedbackStats = {
    total: validFeedbacks.length,
    byOutcomeMatched: Object.fromEntries(OUTCOME_KEYS.map((key) => [key, 0])),
    byTimingMatched: Object.fromEntries(TIMING_KEYS.map((key) => [key, 0])),
    byResultType: Object.fromEntries(RESULT_TYPE_KEYS.map((key) => [key, 0])),
  };

  for (const feedback of validFeedbacks) {
    stats.byOutcomeMatched[feedback.outcomeMatched] = (stats.byOutcomeMatched[feedback.outcomeMatched] ?? 0) + 1;
    const timing = feedback.timingMatched || 'unknown';
    stats.byTimingMatched[timing] = (stats.byTimingMatched[timing] ?? 0) + 1;
    stats.byResultType[feedback.resultType] = (stats.byResultType[feedback.resultType] ?? 0) + 1;
  }

  return stats;
}

function questionCategoryFromResult(result: AppResult) {
  if ('input' in result && result.input && 'questionCategory' in result.input && result.input.questionCategory) {
    return String(result.input.questionCategory);
  }
  return 'general';
}

function ruleVersionFromResult(result: AppResult) {
  return 'milestone' in result ? `milestone-${result.milestone}` : 'unknown';
}

export function buildPrivateRawFeedbackExport(feedbacks: DivinationFeedback[]): PrivateRawFeedbackExport {
  return {
    exportType: 'private_raw',
    exportedAt: new Date().toISOString(),
    privacyWarning: PRIVATE_RAW_WARNING,
    feedbacks,
  };
}

export function buildAnonymizedFeedbackExport(feedbacks: DivinationFeedback[]): AnonymizedFeedbackExport {
  return {
    exportType: 'anonymized',
    exportedAt: new Date().toISOString(),
    feedbacks: feedbacks.map((feedback) => ({
      resultType: feedback.resultType,
      questionCategory: questionCategoryFromResult(feedback.originalResult),
      outcomeMatched: feedback.outcomeMatched,
      timingMatched: feedback.timingMatched || 'unknown',
      qualityTag: feedback.qualityTag,
      ruleVersion: ruleVersionFromResult(feedback.originalResult),
    })),
  };
}

export function privateRawExportWarning() {
  return PRIVATE_RAW_WARNING;
}
