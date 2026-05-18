import type { AppResult } from '../appTypes';
import type { NameWuxingProfile, PersonalizedInfluence } from '../personalization/types';

export type LlmInterpretation = {
  summary: string;
  keySignals: string[];
  riskSignals: string[];
  timingAdvice: string;
  actionAdvice: string;
  avoidAction: string;
  confidence: 'low' | 'medium' | 'high';
};

export type LlmEnhancedResult = AppResult & {
  llmInterpretation: LlmInterpretation;
};

export type LlmEnhancePayload = {
  resultType: AppResult['type'];
  questionText: string;
  questionCategory: string;
  rawResult: AppResult;
  ruleInterpretation: Record<string, unknown>;
  nameWuxingProfile?: NameWuxingProfile;
  personalizedInfluence?: PersonalizedInfluence;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function resultInput(result: AppResult) {
  return asRecord('input' in result ? result.input : undefined) ?? {};
}

export function questionTextFromResult(result: AppResult) {
  const input = resultInput(result);
  return String(input.questionText || input.question_text || '');
}

export function questionCategoryFromResult(result: AppResult) {
  const input = resultInput(result);
  return String(input.questionCategory || input.question_category || ('question_context' in result ? result.question_context?.questionCategory : '') || 'general');
}

export function stripLlmInterpretation(result: AppResult): AppResult {
  const cloned = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
  delete cloned.llmInterpretation;
  return cloned as AppResult;
}

function rawChartFromResult(result: AppResult): AppResult {
  if ('rawChart' in result && asRecord(result.rawChart)) return JSON.parse(JSON.stringify(result.rawChart)) as AppResult;
  return stripLlmInterpretation(result);
}

export function ruleInterpretationFromResult(result: AppResult): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  if ('question_context' in result && result.question_context) base.question_context = result.question_context;
  if ('wuxing_relations' in result && result.wuxing_relations) base.wuxing_relations = result.wuxing_relations;
  if ('asker_profile' in result && result.asker_profile) base.asker_profile = result.asker_profile;
  if ('timing' in result && result.timing) base.timing = result.timing;
  if ('interpretation' in result && result.interpretation) base.interpretation = result.interpretation;
  if ('wuxing' in result && result.wuxing) base.wuxing = result.wuxing;
  return base;
}

export function buildLlmEnhancePayload(result: AppResult): LlmEnhancePayload {
  const nameWuxingProfile = 'nameProfile' in result ? (result.nameProfile as NameWuxingProfile) : undefined;
  const personalizedInfluence = 'personalizedChart' in result ? (result.personalizedChart as PersonalizedInfluence) : undefined;
  return {
    resultType: result.type,
    questionText: questionTextFromResult(result),
    questionCategory: questionCategoryFromResult(result),
    rawResult: rawChartFromResult(result),
    ruleInterpretation: ruleInterpretationFromResult(result),
    nameWuxingProfile,
    personalizedInfluence,
  };
}

export function attachLlmInterpretation(result: AppResult, llmInterpretation: LlmInterpretation): LlmEnhancedResult {
  const base = stripLlmInterpretation(result) as AppResult & { debug_trace?: string[] };
  return {
    ...base,
    llmInterpretation,
    debug_trace: [
      ...(base.debug_trace ?? []),
      `llm_interpretation=confidence=${llmInterpretation.confidence};summary=${llmInterpretation.summary}`,
      'llm_interpretation_note=rawChart and ruleInterpretation preserved; LLM only rewrites advice',
    ],
  } as LlmEnhancedResult;
}
