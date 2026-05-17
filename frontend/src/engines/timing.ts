import type { XiaoLiurenPalaceName } from './xiaoliuren';

export type TimingConfidence = 'low' | 'medium' | 'high';

export type TimingWindow = {
  label: string;
  window: string;
  basis: string[];
  confidence: TimingConfidence;
  suggestion: string;
};

export type TimingAnalysis = {
  timing_windows: TimingWindow[];
  debug_trace: string[];
};

const BRANCH_HOUR_WINDOWS: Record<string, string> = {
  子: '子时前后（23:00-01:00）',
  丑: '丑时前后（01:00-03:00）',
  寅: '寅时前后（03:00-05:00）',
  卯: '卯时前后（05:00-07:00）',
  辰: '辰时前后（07:00-09:00）',
  巳: '巳时前后（09:00-11:00）',
  午: '午时前后（11:00-13:00）',
  未: '未时前后（13:00-15:00）',
  申: '申时前后（15:00-17:00）',
  酉: '酉时前后（17:00-19:00）',
  戌: '戌时前后（19:00-21:00）',
  亥: '亥时前后（21:00-23:00）',
};

const FAST_CATEGORIES = new Set(['sleep_health', 'communication', 'lost_item', 'travel']);
const SLOW_CATEGORIES = new Set(['research_project', 'career', 'money_resource', 'relationship']);
const TRIGGER_INTENTS = new Set(['timing_advice', 'go_or_no_go', 'risk_check']);

export function analyzeDaliurenTiming(input: {
  currentDatetime: string;
  timezone: string;
  questionCategory: string;
  questionIntent: string;
  threeTransmissions: Array<{ stage: string; branch: string }>;
  xunkong: string[];
}): TimingAnalysis {
  const debugTrace = [
    `timing_engine=da_liuren current=${input.currentDatetime}`,
    `question_category=${input.questionCategory} question_intent=${input.questionIntent}`,
  ];
  const labels = ['近应', '中应', '后应'];
  let windows = input.threeTransmissions.slice(0, 3).map((item, index) => {
    const basis = [`${item.stage}${item.branch}`, `问题类型为 ${input.questionCategory}`, `提问意图为 ${input.questionIntent}`];
    let confidence: TimingConfidence = 'medium';
    let suggestion = daliurenSuggestion(index, input.questionCategory, input.questionIntent);
    if (input.xunkong.includes(item.branch)) {
      basis.push(`${item.branch}旬空`);
      confidence = 'low';
      suggestion = '此候选窗口有延迟或落空倾向，适合复核条件后再行动';
    } else if (TRIGGER_INTENTS.has(input.questionIntent) && index === 0) {
      basis.push('时效性强，优先看初传');
    }
    const window = daliurenWindow(index, item.branch, input.questionCategory);
    debugTrace.push(`${labels[index]}: branch=${item.branch} window=${window} confidence=${confidence}`);
    return {
      label: labels[index],
      window,
      basis,
      confidence,
      suggestion,
    };
  });

  if (input.questionIntent === 'timing_advice') {
    windows = windows.sort((left, right) => (left.label === '近应' ? -1 : right.label === '近应' ? 1 : 0));
    debugTrace.push('timing_advice=prioritize_near_window');
  }

  return { timing_windows: windows, debug_trace: debugTrace };
}

function daliurenWindow(index: number, branch: string, category: string) {
  const hourWindow = BRANCH_HOUR_WINDOWS[branch] ?? `${branch}时前后`;
  if (index === 0 && FAST_CATEGORIES.has(category)) return `近候选：当下至次日，重点看${hourWindow}`;
  if (index === 0) return `近候选：1-3日内，或逢${branch}日/${hourWindow}`;
  if (index === 1) return `中段候选：3-7日内，或逢${branch}日/${branch}月`;
  if (SLOW_CATEGORIES.has(category)) return `后续候选：1-3周或阶段后段，留意${branch}日/${branch}月`;
  return `后续候选：7-14日内，或逢${branch}日/${branch}月`;
}

function daliurenSuggestion(index: number, category: string, intent: string) {
  if (index === 0 && TRIGGER_INTENTS.has(intent)) return '适合先处理眼前触发点，不宜拖延';
  if (index === 0 && category === 'sleep_health') return '适合立即收束，优先恢复节律';
  if (index === 1) return '适合在中段复核条件，再决定是否加速';
  return '适合作为后续观察窗口，不宜当作绝对日期';
}

export function analyzeXiaoLiurenTiming(input: {
  finalPalace: XiaoLiurenPalaceName;
  questionTime?: string;
  timezone: string;
}): TimingAnalysis {
  const map: Record<XiaoLiurenPalaceName, TimingWindow> = {
    大安: {
      label: '稳定应',
      window: '候选：1日后至一周内，偏稳定推进',
      basis: ['最终宫位大安', '慢、稳定', '偏日/周'],
      confidence: 'medium',
      suggestion: '适合按既定节奏推进，不宜急催',
    },
    留连: {
      label: '延后应',
      window: '候选：延后再看，偏拖延或反复',
      basis: ['最终宫位留连', '拖延', '偏延后'],
      confidence: 'low',
      suggestion: '适合先清理阻滞条件，再等待反馈',
    },
    速喜: {
      label: '速应',
      window: '候选：数小时至当日',
      basis: ['最终宫位速喜', '快', '偏小时/当日'],
      confidence: 'medium',
      suggestion: '适合快速确认或立即行动',
    },
    赤口: {
      label: '冲突应',
      window: '候选：当日内，伴随沟通摩擦',
      basis: ['最终宫位赤口', '快但有冲突', '偏当日'],
      confidence: 'medium',
      suggestion: '适合先降冲突，再处理关键动作',
    },
    小吉: {
      label: '中速应',
      window: '候选：1-3日内',
      basis: ['最终宫位小吉', '中等', '偏1-3日'],
      confidence: 'medium',
      suggestion: '适合小步推进，等待正向反馈',
    },
    空亡: {
      label: '不定应',
      window: '候选：不定、落空或需重问',
      basis: ['最终宫位空亡', '不定/落空', '需重问'],
      confidence: 'low',
      suggestion: '适合暂停判断，待信息明确后再问',
    },
  };
  const debugTrace = [`timing_engine=xiao_liuren final_palace=${input.finalPalace}`, `timezone=${input.timezone}`];
  if (input.questionTime) debugTrace.push(`question_time=${input.questionTime}`);
  return { timing_windows: [map[input.finalPalace]], debug_trace: debugTrace };
}
