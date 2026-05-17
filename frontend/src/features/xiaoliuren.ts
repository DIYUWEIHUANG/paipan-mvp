import { calculateXiaoLiuren, type XiaoLiurenInput, type XiaoLiurenResult } from '../engines/xiaoliuren';
import { interpretXiaoLiuren, type XiaoLiurenInterpretation } from '../interpretations/xiaoliuren';

export type XiaoLiurenMilestone2Result = Omit<XiaoLiurenResult, 'milestone'> & {
  milestone: 2;
  interpretation: XiaoLiurenInterpretation;
};

export function calculateXiaoLiurenMilestone2(input: XiaoLiurenInput): XiaoLiurenMilestone2Result {
  const chart = calculateXiaoLiuren(input);
  const interpretation = interpretXiaoLiuren(chart.final_palace);
  return {
    ...chart,
    milestone: 2,
    interpretation,
    debug_trace: [
      ...chart.debug_trace,
      `interpretation_palace=${interpretation.palace}`,
      `interpretation_polarity=${interpretation.polarity}`,
      `interpretation_keywords=${interpretation.keywords.join('/')}`,
    ],
  };
}
