import { describe, expect, it } from 'vitest';
import { calculateManualLiuyao } from '../calculators';
import { attachLlmInterpretation, buildLlmEnhancePayload } from './llmInterpretation';

const llmInterpretation = {
  summary: '倾向平衡',
  keySignals: ['同气'],
  riskSignals: ['沟通摩擦'],
  timingAdvice: '候选窗口为1-3日',
  actionAdvice: '适合小步验证',
  avoidAction: '不宜重押',
  confidence: 'medium' as const,
};

describe('LLM interpretation layer', () => {
  it('builds payload from rule result without changing raw result', () => {
    const raw = calculateManualLiuyao([7, 8, 7, 8, 7, 8], {
      questionText: '要不要推进？',
      questionCategory: 'decision',
      questionIntent: 'go_or_no_go',
    });
    const payload = buildLlmEnhancePayload(raw);

    expect(payload.resultType).toBe('liu_yao');
    expect(payload.questionText).toBe('要不要推进？');
    expect(payload.questionCategory).toBe('decision');
    expect(payload.rawResult).toEqual(raw);
    expect(payload.ruleInterpretation.interpretation).toEqual(raw.interpretation);
  });

  it('attaches llmInterpretation while preserving existing rule fields', () => {
    const raw = calculateManualLiuyao([7, 8, 7, 8, 7, 8], 'test');
    const enhanced = attachLlmInterpretation(raw, llmInterpretation);

    expect(enhanced.llmInterpretation).toEqual(llmInterpretation);
    expect(enhanced.type).toBe(raw.type);
    if (enhanced.type === 'liu_yao') {
      expect(enhanced.base_hexagram).toEqual(raw.base_hexagram);
      expect(enhanced.interpretation).toEqual(raw.interpretation);
    }
    expect(enhanced.debug_trace.join('\n')).toContain('llm_interpretation_note');
  });
});
