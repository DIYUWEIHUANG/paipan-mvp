import type { XiaoLiurenPalaceName } from './xiaoliuren';

export type TimingConfidence = 'low' | 'medium' | 'high';
export type TimingScale = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'life_stage';

export type TimingWindow = {
  label: string;
  window: string;
  basis: string[];
  confidence: TimingConfidence;
  suggestion: string;
};

export type TimingAnalysis = {
  timing_scale: TimingScale;
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

const TRIGGER_INTENTS = new Set(['timing_advice', 'go_or_no_go', 'risk_check']);

type TimingProfile = {
  scale: TimingScale;
  scaleOptions: TimingScale[];
  basis: string;
  windows: [string, string, string];
};

function timingProfile(category: string): TimingProfile {
  const profiles: Record<string, TimingProfile> = {
    sleep_health: {
      scale: 'immediate',
      scaleOptions: ['immediate', 'short_term'],
      basis: '睡眠健康问题时效性强，优先按小时/日观察',
      windows: ['数小时至当日', '1-3日', '3-7日'],
    },
    daily_decision: {
      scale: 'immediate',
      scaleOptions: ['immediate', 'short_term'],
      basis: '日常决策偏即时反馈，先看近端触发',
      windows: ['当下至次日', '1-3日', '3-7日'],
    },
    decision: {
      scale: 'immediate',
      scaleOptions: ['immediate', 'short_term'],
      basis: '决策类问题先看近端条件，再看短期反馈',
      windows: ['当下至次日', '1-3日', '3-7日'],
    },
    communication: {
      scale: 'short_term',
      scaleOptions: ['short_term'],
      basis: '沟通问题通常按日/周反馈',
      windows: ['1-3日', '3-7日', '1-3周'],
    },
    lost_item: {
      scale: 'short_term',
      scaleOptions: ['immediate', 'short_term'],
      basis: '失物问题偏短应，优先按小时/日复查',
      windows: ['当下至次日', '1-3日', '3-7日'],
    },
    travel: {
      scale: 'short_term',
      scaleOptions: ['short_term'],
      basis: '出行问题按行程前后与短期变动观察',
      windows: ['1-3日', '3-7日', '1-3周'],
    },
    money_resource: {
      scale: 'short_term',
      scaleOptions: ['short_term', 'medium_term'],
      basis: '资源与财务问题兼看短期现金流和中期兑现',
      windows: ['3-14日', '2-6周', '1-3个月'],
    },
    research_project: {
      scale: 'medium_term',
      scaleOptions: ['medium_term'],
      basis: '研究项目以阶段推进为主，默认按周/月观察',
      windows: ['1-4周', '1-3个月', '3-6个月'],
    },
    career: {
      scale: 'medium_term',
      scaleOptions: ['medium_term', 'long_term'],
      basis: '事业职业类问题不取今晚/明天，按周/月/年度阶段观察',
      windows: ['1-4周', '1-3个月', '3-12个月'],
    },
    relationship: {
      scale: 'medium_term',
      scaleOptions: ['medium_term', 'long_term'],
      basis: '关系问题通常需要互动周期沉淀，按周/月观察',
      windows: ['1-4周', '1-3个月', '3-12个月'],
    },
    exam_learning: {
      scale: 'medium_term',
      scaleOptions: ['short_term', 'medium_term'],
      basis: '学习考试兼看近期复习与阶段结果',
      windows: ['3-14日', '2-6周', '1-3个月'],
    },
    life_path: {
      scale: 'long_term',
      scaleOptions: ['long_term', 'life_stage'],
      basis: '人生方向问题取长期/阶段尺度，不按短日断应',
      windows: ['1-3个月', '3-12个月', '1-3年或阶段节点'],
    },
    general: {
      scale: 'short_term',
      scaleOptions: ['short_term'],
      basis: '综合问题默认按短期到中段观察',
      windows: ['1-7日', '1-4周', '1-3个月'],
    },
  };
  return profiles[category] ?? profiles.general;
}

export function analyzeDaliurenTiming(input: {
  currentDatetime: string;
  timezone: string;
  questionCategory: string;
  questionIntent: string;
  threeTransmissions: Array<{ stage: string; branch: string }>;
  xunkong: string[];
}): TimingAnalysis {
  const profile = timingProfile(input.questionCategory);
  const debugTrace = [
    `timing_engine=da_liuren current=${input.currentDatetime}`,
    `question_category=${input.questionCategory} question_intent=${input.questionIntent}`,
    `timing_scale=${profile.scale} options=${profile.scaleOptions.join('/')} basis=${profile.basis}`,
  ];
  const labels = ['近应', '中应', '后应'];
  let windows = input.threeTransmissions.slice(0, 3).map((item, index) => {
    const basis = [`${item.stage}${item.branch}`, `问题类型为 ${input.questionCategory}`, `提问意图为 ${input.questionIntent}`, `应期尺度为 ${profile.scale}`, profile.basis];
    let confidence: TimingConfidence = 'medium';
    let suggestion = daliurenSuggestion(index, input.questionCategory, input.questionIntent);
    if (input.xunkong.includes(item.branch)) {
      basis.push(`${item.branch}旬空`);
      confidence = 'low';
      suggestion = '此候选窗口有延迟或落空倾向，适合复核条件后再行动';
    } else if (TRIGGER_INTENTS.has(input.questionIntent) && index === 0) {
      basis.push('时效性强，优先看初传');
    }
    const window = daliurenWindow(index, item.branch, profile);
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

  return { timing_scale: profile.scale, timing_windows: windows, debug_trace: debugTrace };
}

function daliurenWindow(index: number, branch: string, profile: TimingProfile) {
  const hourWindow = BRANCH_HOUR_WINDOWS[branch] ?? `${branch}时前后`;
  if (index === 0 && profile.scale === 'immediate') return `近候选：${profile.windows[0]}，重点看${hourWindow}`;
  if (index === 0) return `近候选：${profile.windows[0]}，或逢${branch}日/${hourWindow}`;
  if (index === 1) return `中段候选：${profile.windows[1]}，或逢${branch}日/${branch}月`;
  return `后续候选：${profile.windows[2]}，留意${branch}日/${branch}月`;
}

function daliurenSuggestion(index: number, category: string, intent: string) {
  if (category === 'career') {
    if (index === 0) return '适合在近几周内确认职责、资源与沟通窗口';
    if (index === 1) return '适合在1-3个月内复核阶段反馈，再决定加码';
    return '适合作为季度到年度的观察窗口，不宜当作绝对日期';
  }
  if (index === 0 && TRIGGER_INTENTS.has(intent)) return '适合先处理眼前触发点，不宜拖延';
  if (index === 0 && category === 'sleep_health') return '适合立即收束，优先恢复节律';
  if (index === 1) return '适合在中段复核条件，再决定是否加速';
  return '适合作为后续观察窗口，不宜当作绝对日期';
}

export function analyzeXiaoLiurenTiming(input: {
  finalPalace: XiaoLiurenPalaceName;
  questionTime?: string;
  timezone: string;
  questionCategory?: string;
  questionIntent?: string;
}): TimingAnalysis {
  const categoryProfile = timingProfile(input.questionCategory ?? 'general');
  const palaceScales: Record<XiaoLiurenPalaceName, TimingScale> = {
    大安: 'short_term',
    留连: 'medium_term',
    速喜: 'immediate',
    赤口: 'immediate',
    小吉: 'short_term',
    空亡: 'short_term',
  };
  const timingScale = input.questionCategory ? categoryProfile.scale : palaceScales[input.finalPalace];
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
  const debugTrace = [
    `timing_engine=xiao_liuren final_palace=${input.finalPalace}`,
    `timezone=${input.timezone}`,
    `question_category=${input.questionCategory ?? 'general'} question_intent=${input.questionIntent ?? 'trend'}`,
    `timing_scale=${timingScale} basis=${input.questionCategory ? categoryProfile.basis : '小六壬宫位默认快慢尺度'}`,
  ];
  if (input.questionTime) debugTrace.push(`question_time=${input.questionTime}`);
  const selectedWindow = map[input.finalPalace];
  const scaledWindow = input.questionCategory
    ? {
        ...selectedWindow,
        window: `候选：${categoryProfile.windows[0]}，以${selectedWindow.label}作为快慢倾向参考`,
        basis: [...selectedWindow.basis, `问题类型为 ${input.questionCategory}`, `应期尺度为 ${categoryProfile.scale}`, categoryProfile.basis],
        suggestion:
          categoryProfile.scale === 'medium_term' || categoryProfile.scale === 'long_term' || categoryProfile.scale === 'life_stage'
            ? '适合按阶段观察，不宜压缩成今晚或明天的绝对时间'
            : selectedWindow.suggestion,
      }
    : selectedWindow;
  debugTrace.push(`window_adjusted_by_category=${Boolean(input.questionCategory)} window=${scaledWindow.window}`);
  return { timing_scale: timingScale, timing_windows: [scaledWindow], debug_trace: debugTrace };
}
