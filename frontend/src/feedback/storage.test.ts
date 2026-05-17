import { describe, expect, it } from 'vitest';
import type { AppResult } from '../appTypes';
import { buildAnonymizedFeedbackExport, buildPrivateRawFeedbackExport, calculateFeedbackStats, upsertFeedback } from './storage';
import type { DivinationFeedback } from './types';

const daLiurenResult = { type: 'da_liuren' } as AppResult;
const xiaoLiurenResult = { type: 'xiao_liuren' } as AppResult;

function feedback(partial: Partial<DivinationFeedback> & Pick<DivinationFeedback, 'recordId' | 'resultType' | 'outcomeMatched'>): DivinationFeedback {
  return {
    createdAt: '2026-05-18T00:00:00.000Z',
    feedbackAt: '2026-05-18T01:00:00.000Z',
    actualOutcome: '实际结果',
    timingMatched: 'unknown',
    qualityTag: 'valid',
    privacyLevel: 'private_raw',
    usefulParts: [],
    wrongParts: [],
    userNote: '',
    originalResult: partial.resultType === 'xiao_liuren' ? xiaoLiurenResult : daLiurenResult,
    ...partial,
  };
}

describe('feedback storage helpers', () => {
  it('counts feedbacks by outcome, timing, and result type', () => {
    const stats = calculateFeedbackStats([
      feedback({ recordId: 'r1', resultType: 'da_liuren', outcomeMatched: 'matched', timingMatched: 'on_time' }),
      feedback({ recordId: 'r2', resultType: 'da_liuren', outcomeMatched: 'partial', timingMatched: 'late' }),
      feedback({ recordId: 'r3', resultType: 'xiao_liuren', outcomeMatched: 'missed', timingMatched: 'not_happened' }),
      feedback({ recordId: 'r4', resultType: 'da_liuren', outcomeMatched: 'matched', qualityTag: 'test' }),
    ]);

    expect(stats.total).toBe(3);
    expect(stats.byOutcomeMatched).toMatchObject({ matched: 1, partial: 1, missed: 1, unknown: 0 });
    expect(stats.byTimingMatched).toMatchObject({ on_time: 1, late: 1, not_happened: 1, unknown: 0 });
    expect(stats.byResultType).toMatchObject({ da_liuren: 2, xiao_liuren: 1, liu_yao: 0 });
  });

  it('updates an existing feedback by record id', () => {
    const first = feedback({ recordId: 'r1', resultType: 'da_liuren', outcomeMatched: 'unknown' });
    const edited = feedback({ recordId: 'r1', resultType: 'da_liuren', outcomeMatched: 'matched', actualOutcome: '已验证' });

    expect(upsertFeedback([first], edited)).toEqual([edited]);
  });

  it('keeps raw export complete and anonymized export minimal', () => {
    const item = feedback({ recordId: 'r1', resultType: 'da_liuren', outcomeMatched: 'matched', userNote: '私有备注' });

    expect(buildPrivateRawFeedbackExport([item]).feedbacks[0].userNote).toBe('私有备注');
    expect(buildAnonymizedFeedbackExport([item]).feedbacks[0]).toEqual({
      resultType: 'da_liuren',
      questionCategory: 'general',
      outcomeMatched: 'matched',
      timingMatched: 'unknown',
      qualityTag: 'valid',
      ruleVersion: 'unknown',
    });
  });
});
