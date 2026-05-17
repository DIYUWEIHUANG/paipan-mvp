import { Solar } from 'lunar-javascript';

export type XiaoLiurenMethod = 'time' | 'manual';

export type XiaoLiurenPalaceName = '大安' | '留连' | '速喜' | '赤口' | '小吉' | '空亡';

export type XiaoLiurenStep = {
  step: 'month' | 'day' | 'hour';
  label: string;
  start_palace: XiaoLiurenPalaceName;
  count: number;
  result_palace: XiaoLiurenPalaceName;
  rule: string;
};

export type XiaoLiurenResult = {
  type: 'xiao_liuren';
  milestone: 1;
  input: {
    method: XiaoLiurenMethod;
    question_time?: string;
    timezone: string;
    question_text: string;
    manual_lunar?: {
      month: number;
      day: number;
      hour_branch: string;
    };
  };
  lunar: {
    month: number;
    month_text: string;
    day: number;
    day_text: string;
    hour_branch: string;
    hour_index: number;
  };
  palace_order: XiaoLiurenPalaceName[];
  steps: XiaoLiurenStep[];
  final_palace: XiaoLiurenPalaceName;
  basic_inference: {
    title: string;
    tendency: string;
    suggestion: string;
  };
  debug_trace: string[];
};

type TimeInput = {
  method: 'time';
  questionTime: string;
  timezone: string;
  questionText: string;
};

type ManualInput = {
  method: 'manual';
  timezone: string;
  questionText: string;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
};

export type XiaoLiurenInput = TimeInput | ManualInput;

const PALACES: XiaoLiurenPalaceName[] = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
const HOUR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const INFERENCES: Record<XiaoLiurenPalaceName, XiaoLiurenResult['basic_inference']> = {
  大安: {
    title: '大安',
    tendency: '局面偏稳定，宜守成、确认基础条件，进展通常不宜急推。',
    suggestion: '先把信息核准，再稳步推进。适合处理确定性高的事项。',
  },
  留连: {
    title: '留连',
    tendency: '事情容易拖延、反复或卡在沟通往返中，短期节奏偏慢。',
    suggestion: '减少等待成本，明确下一步责任人和时间点。',
  },
  速喜: {
    title: '速喜',
    tendency: '消息来得较快，局面有转明朗的倾向，适合主动推进。',
    suggestion: '抓住窗口期，但仍需保留确认环节。',
  },
  赤口: {
    title: '赤口',
    tendency: '容易出现口舌、误解或立场冲突，沟通风险偏高。',
    suggestion: '避免情绪化表达，重要信息尽量书面确认。',
  },
  小吉: {
    title: '小吉',
    tendency: '小有进展，结果偏温和有利，但通常不是大幅突破。',
    suggestion: '适合轻量推进、试探反馈、逐步累积确定性。',
  },
  空亡: {
    title: '空亡',
    tendency: '信息不实、预期落空或条件未成的可能性较高。',
    suggestion: '暂缓重投入，先验证关键事实和可执行条件。',
  },
};

function validateTimezone(timezone: string) {
  if (timezone !== 'Asia/Shanghai') {
    throw new Error('静态网页版本当前按 Asia/Shanghai 计算小六壬；请使用 Asia/Shanghai。');
  }
}

function parseQuestionTime(questionTime: string) {
  const date = new Date(questionTime);
  if (Number.isNaN(date.getTime())) throw new Error('请输入有效的公历日期时间。');
  return date;
}

function palaceAt(startIndex: number, count: number) {
  return PALACES[(startIndex + count - 1) % PALACES.length];
}

function palaceIndex(palace: XiaoLiurenPalaceName) {
  return PALACES.indexOf(palace);
}

function normalizeMonth(month: number) {
  const normalized = Math.abs(month);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 12) {
    throw new Error('农历月必须是 1-12。');
  }
  return normalized;
}

function normalizeDay(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error('农历日必须是 1-30。');
  }
  return day;
}

function hourIndex(hourBranch: string) {
  const index = HOUR_BRANCHES.indexOf(hourBranch);
  if (index < 0) throw new Error('时辰必须是十二地支之一。');
  return index + 1;
}

function buildSteps(month: number, day: number, hourNumber: number) {
  const monthPalace = palaceAt(0, month);
  const dayPalace = palaceAt(palaceIndex(monthPalace), day);
  const hourPalace = palaceAt(palaceIndex(dayPalace), hourNumber);
  return [
    {
      step: 'month',
      label: '月上起大安',
      start_palace: '大安',
      count: month,
      result_palace: monthPalace,
      rule: `从大安起农历${month}月，顺数${month}位。`,
    },
    {
      step: 'day',
      label: '日上顺数',
      start_palace: monthPalace,
      count: day,
      result_palace: dayPalace,
      rule: `从${monthPalace}起初一，顺数至农历${day}日。`,
    },
    {
      step: 'hour',
      label: '时上顺数',
      start_palace: dayPalace,
      count: hourNumber,
      result_palace: hourPalace,
      rule: `从${dayPalace}起子时，顺数至第${hourNumber}位。`,
    },
  ] satisfies XiaoLiurenStep[];
}

function numberText(value: number, suffix: string) {
  return `${value}${suffix}`;
}

export function calculateXiaoLiuren(input: XiaoLiurenInput): XiaoLiurenResult {
  validateTimezone(input.timezone);

  let month = 0;
  let day = 0;
  let monthText = '';
  let dayText = '';
  let branch = '';
  let questionTime: string | undefined;
  const debugTrace: string[] = [`method=${input.method}`, `palace_order=${PALACES.join(' -> ')}`, 'rule=月上起大安，日上顺数，时上顺数'];

  if (input.method === 'time') {
    const date = parseQuestionTime(input.questionTime);
    const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    const lunar = solar.getLunar();
    month = normalizeMonth(lunar.getMonth());
    day = normalizeDay(lunar.getDay());
    monthText = lunar.getMonthInChinese();
    dayText = lunar.getDayInChinese();
    branch = lunar.getTimeZhi();
    questionTime = input.questionTime;
    debugTrace.push(`time_input=${input.questionTime}`, `lunar_month=${monthText}(${month})`, `lunar_day=${dayText}(${day})`, `hour_branch=${branch}`);
  } else {
    month = normalizeMonth(input.lunarMonth);
    day = normalizeDay(input.lunarDay);
    branch = input.hourBranch;
    monthText = numberText(month, '月');
    dayText = numberText(day, '日');
    debugTrace.push(`manual_lunar_month=${month}`, `manual_lunar_day=${day}`, `manual_hour_branch=${branch}`);
  }

  const hourNumber = hourIndex(branch);
  const steps = buildSteps(month, day, hourNumber);
  for (const step of steps) {
    debugTrace.push(`${step.step}: start=${step.start_palace}, count=${step.count}, result=${step.result_palace}, rule=${step.rule}`);
  }
  const finalPalace = steps.at(-1)!.result_palace;
  debugTrace.push(`final_palace=${finalPalace}`);

  return {
    type: 'xiao_liuren',
    milestone: 1,
    input: {
      method: input.method,
      question_time: questionTime,
      timezone: input.timezone,
      question_text: input.questionText,
      manual_lunar:
        input.method === 'manual'
          ? {
              month,
              day,
              hour_branch: branch,
            }
          : undefined,
    },
    lunar: {
      month,
      month_text: monthText,
      day,
      day_text: dayText,
      hour_branch: branch,
      hour_index: hourNumber,
    },
    palace_order: PALACES,
    steps,
    final_palace: finalPalace,
    basic_inference: INFERENCES[finalPalace],
    debug_trace: debugTrace,
  };
}

export const XIAOLIUREN_HOUR_BRANCHES = HOUR_BRANCHES;
export const XIAOLIUREN_PALACES = PALACES;
