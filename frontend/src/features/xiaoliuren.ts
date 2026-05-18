import { calculateXiaoLiuren, type XiaoLiurenInput, type XiaoLiurenResult } from '../engines/xiaoliuren';
import { analyzeXiaoLiurenTiming, type TimingAnalysis } from '../engines/timing';
import { interpretXiaoLiuren, type XiaoLiurenInterpretation } from '../interpretations/xiaoliuren';
import { hashQuestionText, type InputFingerprint } from '../calculators';

export type XiaoLiurenMilestone2Result = Omit<XiaoLiurenResult, 'milestone'> & {
  milestone: 8;
  interpretation: XiaoLiurenInterpretation;
  timing: TimingAnalysis;
  input_fingerprint: InputFingerprint;
};

export function calculateXiaoLiurenMilestone2(input: XiaoLiurenInput): XiaoLiurenMilestone2Result {
  const chart = calculateXiaoLiuren(input);
  const interpretation = interpretXiaoLiuren(chart.final_palace);
  const timing = analyzeXiaoLiurenTiming({
    finalPalace: chart.final_palace,
    questionTime: chart.input.question_time,
    timezone: chart.input.timezone,
    questionCategory: chart.input.questionCategory,
    questionIntent: chart.input.questionIntent,
  });
  const sourceInput =
    chart.input.method === 'manual'
      ? JSON.stringify(chart.input.manual_lunar)
      : chart.input.question_time ?? '';
  const inputFingerprint: InputFingerprint = {
    datetime: chart.input.question_time ?? '',
    timezone: chart.input.timezone,
    questionTextHash: hashQuestionText(chart.input.question_text),
    questionCategory: chart.input.questionCategory ?? 'general',
    questionIntent: chart.input.questionIntent ?? 'trend',
    mode: `xiao_liuren:${chart.input.method}`,
    sourceInput,
    algorithmVersion: 'xiaoliuren-milestone-13',
  };
  return {
    ...chart,
    milestone: 8,
    interpretation,
    timing,
    input_fingerprint: inputFingerprint,
    debug_trace: [
      ...chart.debug_trace,
      `input_fingerprint=${JSON.stringify(inputFingerprint)}`,
      `interpretation_palace=${interpretation.palace}`,
      `interpretation_polarity=${interpretation.polarity}`,
      `interpretation_keywords=${interpretation.keywords.join('/')}`,
      ...timing.debug_trace,
    ],
  };
}
