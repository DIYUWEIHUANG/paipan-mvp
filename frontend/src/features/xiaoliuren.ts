import { calculateXiaoLiuren, type XiaoLiurenInput, type XiaoLiurenResult } from '../engines/xiaoliuren';
import { analyzeXiaoLiurenTiming, type TimingAnalysis } from '../engines/timing';
import { interpretXiaoLiuren, type XiaoLiurenInterpretation } from '../interpretations/xiaoliuren';

export type XiaoLiurenMilestone2Result = Omit<XiaoLiurenResult, 'milestone'> & {
  milestone: 8;
  interpretation: XiaoLiurenInterpretation;
  timing: TimingAnalysis;
};

export function calculateXiaoLiurenMilestone2(input: XiaoLiurenInput): XiaoLiurenMilestone2Result {
  const chart = calculateXiaoLiuren(input);
  const interpretation = interpretXiaoLiuren(chart.final_palace);
  const timing = analyzeXiaoLiurenTiming({
    finalPalace: chart.final_palace,
    questionTime: chart.input.question_time,
    timezone: chart.input.timezone,
  });
  return {
    ...chart,
    milestone: 8,
    interpretation,
    timing,
    debug_trace: [
      ...chart.debug_trace,
      `interpretation_palace=${interpretation.palace}`,
      `interpretation_polarity=${interpretation.polarity}`,
      `interpretation_keywords=${interpretation.keywords.join('/')}`,
      ...timing.debug_trace,
    ],
  };
}
