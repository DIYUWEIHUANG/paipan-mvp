import { Solar } from 'lunar-javascript';

export type ChartMode = 'liuyao' | 'liuren';
export type LinePolarity = 'yin' | 'yang';

export type LineState = {
  position: number;
  value: number;
  polarity: LinePolarity;
  moving: boolean;
  display: string;
};

export type Hexagram = {
  number: number;
  name: string;
  upper_trigram: string;
  lower_trigram: string;
  lines: LineState[];
};

export type LiuYaoResult = {
  type: 'liu_yao';
  milestone: number;
  input: {
    method: 'manual';
    manual_lines: number[];
    line_order: 'bottom_to_top';
  };
  base_hexagram: Hexagram;
  changed_hexagram: Hexagram;
  moving_lines: number[];
  debug_trace: string[];
};

export type LiurenResult = {
  type: 'da_liuren';
  milestone: number;
  input: {
    question_time: string;
    timezone: string;
  };
  localized_datetime: string;
  four_pillars: Record<'year' | 'month' | 'day' | 'hour', string>;
  xunkong: string[];
  month_general: {
    branch: string;
    source_qi: string;
    source_qi_time: string;
  };
  tian_di_pan: Array<{
    index: number;
    earth: string;
    heaven: string;
  }>;
  four_lessons: {
    status: 'reserved' | 'computed';
    items: Array<{
      index: number;
      label: string;
      upper: string;
      lower: string;
      relation: string;
      upper_element: string;
      lower_element: string;
    }>;
  };
  three_transmissions: {
    status: 'reserved' | 'computed';
    gate?: string;
    variant?: string;
    items: Array<{
      index: number;
      stage: string;
      branch: string;
    }>;
  };
  debug_trace: string[];
};

export type ChartResult = LiuYaoResult | LiurenResult;

const TRIGRAMS = new Map<string, string>([
  ['111', '乾'],
  ['110', '兑'],
  ['101', '离'],
  ['100', '震'],
  ['011', '巽'],
  ['010', '坎'],
  ['001', '艮'],
  ['000', '坤'],
]);

const HEXAGRAMS: Record<string, [number, string]> = {
  '乾/乾': [1, '乾为天'],
  '乾/兑': [10, '天泽履'],
  '乾/离': [13, '天火同人'],
  '乾/震': [25, '天雷无妄'],
  '乾/巽': [44, '天风姤'],
  '乾/坎': [6, '天水讼'],
  '乾/艮': [33, '天山遯'],
  '乾/坤': [12, '天地否'],
  '兑/乾': [43, '泽天夬'],
  '兑/兑': [58, '兑为泽'],
  '兑/离': [49, '泽火革'],
  '兑/震': [17, '泽雷随'],
  '兑/巽': [28, '泽风大过'],
  '兑/坎': [47, '泽水困'],
  '兑/艮': [31, '泽山咸'],
  '兑/坤': [45, '泽地萃'],
  '离/乾': [14, '火天大有'],
  '离/兑': [38, '火泽睽'],
  '离/离': [30, '离为火'],
  '离/震': [21, '火雷噬嗑'],
  '离/巽': [50, '火风鼎'],
  '离/坎': [64, '火水未济'],
  '离/艮': [56, '火山旅'],
  '离/坤': [35, '火地晋'],
  '震/乾': [34, '雷天大壮'],
  '震/兑': [54, '雷泽归妹'],
  '震/离': [55, '雷火丰'],
  '震/震': [51, '震为雷'],
  '震/巽': [32, '雷风恒'],
  '震/坎': [40, '雷水解'],
  '震/艮': [62, '雷山小过'],
  '震/坤': [16, '雷地豫'],
  '巽/乾': [9, '风天小畜'],
  '巽/兑': [61, '风泽中孚'],
  '巽/离': [37, '风火家人'],
  '巽/震': [42, '风雷益'],
  '巽/巽': [57, '巽为风'],
  '巽/坎': [59, '风水涣'],
  '巽/艮': [53, '风山渐'],
  '巽/坤': [20, '风地观'],
  '坎/乾': [5, '水天需'],
  '坎/兑': [60, '水泽节'],
  '坎/离': [63, '水火既济'],
  '坎/震': [3, '水雷屯'],
  '坎/巽': [48, '水风井'],
  '坎/坎': [29, '坎为水'],
  '坎/艮': [39, '水山蹇'],
  '坎/坤': [8, '水地比'],
  '艮/乾': [26, '山天大畜'],
  '艮/兑': [41, '山泽损'],
  '艮/离': [22, '山火贲'],
  '艮/震': [27, '山雷颐'],
  '艮/巽': [18, '山风蛊'],
  '艮/坎': [4, '山水蒙'],
  '艮/艮': [52, '艮为山'],
  '艮/坤': [23, '山地剥'],
  '坤/乾': [11, '地天泰'],
  '坤/兑': [19, '地泽临'],
  '坤/离': [36, '地火明夷'],
  '坤/震': [24, '地雷复'],
  '坤/巽': [46, '地风升'],
  '坤/坎': [7, '地水师'],
  '坤/艮': [15, '地山谦'],
  '坤/坤': [2, '坤为地'],
};

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const MONTH_GENERAL_BY_QI: Record<string, string> = {
  雨水: '亥',
  春分: '戌',
  谷雨: '酉',
  小满: '申',
  夏至: '未',
  大暑: '午',
  处暑: '巳',
  秋分: '辰',
  霜降: '卯',
  小雪: '寅',
  冬至: '丑',
  大寒: '子',
};
const STEM_HOME: Record<string, string> = { 甲: '寅', 乙: '辰', 丙: '巳', 丁: '未', 戊: '巳', 己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑' };
const STEM_COMBINE: Record<string, string> = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
const ELEMENT_BY_TOKEN: Record<string, string> = {};
for (const token of ['甲', '乙', '寅', '卯']) ELEMENT_BY_TOKEN[token] = '木';
for (const token of ['丙', '丁', '巳', '午']) ELEMENT_BY_TOKEN[token] = '火';
for (const token of ['戊', '己', '辰', '戌', '丑', '未']) ELEMENT_BY_TOKEN[token] = '土';
for (const token of ['庚', '辛', '申', '酉']) ELEMENT_BY_TOKEN[token] = '金';
for (const token of ['壬', '癸', '亥', '子']) ELEMENT_BY_TOKEN[token] = '水';
const CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const YIN_YANG: Record<string, string> = {};
for (const token of ['甲', '丙', '戊', '庚', '壬', '子', '寅', '辰', '午', '申', '戌']) YIN_YANG[token] = '阳';
for (const token of ['乙', '丁', '己', '辛', '癸', '丑', '卯', '巳', '未', '酉', '亥']) YIN_YANG[token] = '阴';
const CHONG = Object.fromEntries(BRANCHES.map((branch, index) => [branch, BRANCHES[(index + 6) % 12]]));
const SAN_HE: Record<string, string[]> = {
  申: ['申', '子', '辰'],
  子: ['申', '子', '辰'],
  辰: ['申', '子', '辰'],
  亥: ['亥', '卯', '未'],
  卯: ['亥', '卯', '未'],
  未: ['亥', '卯', '未'],
  寅: ['寅', '午', '戌'],
  午: ['寅', '午', '戌'],
  戌: ['寅', '午', '戌'],
  巳: ['巳', '酉', '丑'],
  酉: ['巳', '酉', '丑'],
  丑: ['巳', '酉', '丑'],
};

function lineToBit(value: number) {
  return value === 7 || value === 9 ? 1 : 0;
}

function isMoving(value: number) {
  return value === 6 || value === 9;
}

function buildHexagramFromBits(bits: number[], sourceValues?: number[]): Hexagram {
  const lowerTrigram = TRIGRAMS.get(bits.slice(0, 3).join(''))!;
  const upperTrigram = TRIGRAMS.get(bits.slice(3).join(''))!;
  const [number, name] = HEXAGRAMS[`${upperTrigram}/${lowerTrigram}`];
  const values = sourceValues ?? bits.map((bit) => (bit === 1 ? 7 : 8));
  return {
    number,
    name,
    upper_trigram: upperTrigram,
    lower_trigram: lowerTrigram,
    lines: bits.map((bit, index) => ({
      position: index + 1,
      value: values[index],
      polarity: bit === 1 ? 'yang' : 'yin',
      moving: isMoving(values[index]),
      display: bit === 1 ? '━━━' : '━ ━',
    })),
  };
}

export function calculateManualLiuyao(manualLines: number[]): LiuYaoResult {
  if (manualLines.length !== 6 || manualLines.some((line) => ![6, 7, 8, 9].includes(line))) {
    throw new Error('六爻输入必须正好包含 6 个值，且只能是 6、7、8、9。');
  }
  const baseBits = manualLines.map(lineToBit);
  const changedBits = manualLines.map((line) => (isMoving(line) ? 1 - lineToBit(line) : lineToBit(line)));
  const movingLines = manualLines.map((line, index) => (isMoving(line) ? index + 1 : 0)).filter(Boolean);
  return {
    type: 'liu_yao',
    milestone: 1,
    input: { method: 'manual', manual_lines: manualLines, line_order: 'bottom_to_top' },
    base_hexagram: buildHexagramFromBits(baseBits, manualLines),
    changed_hexagram: buildHexagramFromBits(changedBits),
    moving_lines: movingLines,
    debug_trace: [
      `manual_lines(bottom_to_top)=${JSON.stringify(manualLines)}`,
      `base_bits(bottom_to_top)=${JSON.stringify(baseBits)}`,
      `changed_bits(bottom_to_top)=${JSON.stringify(changedBits)}`,
      `moving_lines=${JSON.stringify(movingLines)}`,
    ],
  };
}

function parseQuestionTime(questionTime: string) {
  const date = new Date(questionTime);
  if (Number.isNaN(date.getTime())) throw new Error('请输入有效时间。');
  return date;
}

function getSolarFromDate(date: Date) {
  return Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
}

function splitXunkong(value: string) {
  return [...value].filter((char) => char.trim());
}

function branchDistance(start: string, end: string) {
  return (BRANCHES.indexOf(end) - BRANCHES.indexOf(start) + 12) % 12;
}

function rotateBranch(start: string, offset: number) {
  return BRANCHES[(BRANCHES.indexOf(start) + offset + 12) % 12];
}

function buildTianDiPan(monthGeneralBranch: string, hourBranch: string) {
  const monthGeneralIndex = BRANCHES.indexOf(monthGeneralBranch);
  const hourBranchIndex = BRANCHES.indexOf(hourBranch);
  return BRANCHES.map((earth, earthIndex) => ({
    index: earthIndex + 1,
    earth,
    heaven: BRANCHES[(monthGeneralIndex + earthIndex - hourBranchIndex + 12) % 12],
  }));
}

function plateMap(plate: ReturnType<typeof buildTianDiPan>) {
  return Object.fromEntries(plate.map((item) => [item.earth, item.heaven]));
}

function earthUnderHeaven(plate: ReturnType<typeof buildTianDiPan>, heaven: string) {
  const found = plate.find((item) => item.heaven === heaven);
  if (!found) throw new Error(`天盘支未找到：${heaven}`);
  return found.earth;
}

function relationBetween(upper: string, lower: string) {
  const upperElement = ELEMENT_BY_TOKEN[upper];
  const lowerElement = ELEMENT_BY_TOKEN[lower];
  if (CONTROLS[lowerElement] === upperElement) return '下贼上';
  if (CONTROLS[upperElement] === lowerElement) return '上克下';
  if (upperElement === lowerElement) return '比和';
  if (GENERATES[lowerElement] === upperElement) return '下生上';
  if (GENERATES[upperElement] === lowerElement) return '上生下';
  throw new Error(`未知五行关系：${upper}/${lower}`);
}

function buildFourLessons(dayGanzhi: string, plate: ReturnType<typeof buildTianDiPan>) {
  const sky = plateMap(plate);
  const dayStem = dayGanzhi[0];
  const dayBranch = dayGanzhi[1];
  const rawLessons = [
    ['一课', sky[STEM_HOME[dayStem]], STEM_HOME[dayStem]],
    ['二课', sky[sky[STEM_HOME[dayStem]]], sky[STEM_HOME[dayStem]]],
    ['三课', sky[dayBranch], dayBranch],
    ['四课', sky[sky[dayBranch]], sky[dayBranch]],
  ];
  return rawLessons.map(([label, upper, lower], index) => ({
    index: index + 1,
    label,
    upper,
    lower,
    relation: relationBetween(upper, lower),
    upper_element: ELEMENT_BY_TOKEN[upper],
    lower_element: ELEMENT_BY_TOKEN[lower],
  }));
}

function uniqueByUpper<T extends { upper: string }>(candidates: T[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.upper)) return false;
    seen.add(candidate.upper);
    return true;
  });
}

function chainThreeTransmissions(first: string, plate: ReturnType<typeof buildTianDiPan>) {
  const sky = plateMap(plate);
  return [first, sky[first], sky[sky[first]]];
}

function decideThreeTransmissions(dayGanzhi: string, hourGanzhi: string, monthGeneralBranch: string, plate: ReturnType<typeof buildTianDiPan>, fourLessons: ReturnType<typeof buildFourLessons>) {
  const dayStem = dayGanzhi[0];
  const dayBranch = dayGanzhi[1];
  const dayYinyang = YIN_YANG[dayStem];
  const hourBranch = hourGanzhi[1];
  const directRelations = new Set(['下贼上', '上克下']);
  const thiefCandidates = fourLessons.filter((lesson) => lesson.relation === '下贼上');
  const upperKeCandidates = fourLessons.filter((lesson) => lesson.relation === '上克下');
  const hasFuyin = monthGeneralBranch === hourBranch;
  const hasFanyin = plate.every((item) => item.heaven === CHONG[item.earth]);
  const isBazhuan = STEM_HOME[dayStem] === dayBranch;
  const uniqueLessonPairs = new Set(fourLessons.map((item) => `${item.upper}/${item.lower}`));
  const isIncompleteLessons = uniqueLessonPairs.size < 4;
  const trace = [
    `gate_context day=${dayGanzhi} hour=${hourGanzhi} day_yinyang=${dayYinyang}`,
    `gate_context fuyin=${hasFuyin} fanyin=${hasFanyin} bazhuan=${isBazhuan} incomplete_lessons=${isIncompleteLessons}`,
  ];

  let first = '';
  let gate = '';
  let variant = '';
  let primaryDirect = uniqueByUpper(thiefCandidates.length ? thiefCandidates : upperKeCandidates);

  if (primaryDirect.length === 1) {
    first = primaryDirect[0].upper;
    gate = '贼克';
    variant = primaryDirect[0].relation === '下贼上' ? '重审' : '元首';
  } else if (primaryDirect.length > 1) {
    const sameYinyang = primaryDirect.filter((item) => YIN_YANG[item.upper] === dayYinyang);
    if (sameYinyang.length === 1) {
      first = sameYinyang[0].upper;
      gate = '比用';
      variant = '知一';
    } else {
      const scored = primaryDirect
        .map((lesson) => ({ lesson, score: branchDistance(lesson.lower, lesson.upper) + branchDistance(dayBranch, lesson.upper) }))
        .sort((a, b) => b.score - a.score || a.lesson.index - b.lesson.index);
      first = scored[0].lesson.upper;
      gate = '涉害';
      variant = '涉害深度V1';
      trace.push(`gate_涉害 scores=${JSON.stringify(scored.map((item) => [item.lesson.label, item.lesson.upper, item.score]))}`);
    }
  } else {
    const remoteCandidates = fourLessons
      .map((lesson) => ({ ...lesson, remote_relation: relationBetween(lesson.upper, dayStem) }))
      .filter((lesson) => directRelations.has(lesson.remote_relation));
    const remoteSameYinyang = remoteCandidates.filter((item) => YIN_YANG[item.upper] === dayYinyang);
    if (remoteSameYinyang.length || remoteCandidates.length) {
      const selected = remoteSameYinyang[0] ?? remoteCandidates[0];
      first = selected.upper;
      gate = '遥克';
      variant = selected.remote_relation === '上克下' ? '蒿矢' : '弹射';
    } else if (hasFanyin) {
      first = CHONG[dayBranch];
      gate = '返吟';
      variant = '无克取冲';
    } else if (hasFuyin) {
      first = dayYinyang === '阳' ? STEM_HOME[dayStem] : dayBranch;
      gate = '伏吟';
      variant = '无克取刑';
    } else if (isBazhuan) {
      const anchor = dayYinyang === '阳' ? fourLessons[0].upper : fourLessons.at(-1)!.upper;
      first = rotateBranch(anchor, dayYinyang === '阳' ? 2 : -2);
      gate = '八专';
      variant = '顺逆取用';
    } else if (isIncompleteLessons) {
      const sky = plateMap(plate);
      if (dayYinyang === '阳') {
        first = sky[STEM_HOME[STEM_COMBINE[dayStem]]];
      } else {
        const sanhe = SAN_HE[dayBranch];
        first = sanhe[(sanhe.indexOf(dayBranch) + 1) % 3];
      }
      gate = '别责';
      variant = '四课不备';
    } else {
      first = dayYinyang === '阳' ? plateMap(plate).酉 : earthUnderHeaven(plate, '酉');
      gate = '昴星';
      variant = '俯仰酉神';
    }
  }

  const branches = chainThreeTransmissions(first, plate);
  trace.push(`gate_${gate} selected=${first} variant=${variant}`, `three_transmissions chain=${JSON.stringify(branches)}`);
  return {
    status: 'computed' as const,
    gate,
    variant,
    items: branches.map((branch, index) => ({ index: index + 1, stage: ['初传', '中传', '末传'][index], branch })),
    debug_trace: trace,
  };
}

export function calculateLiurenV1(questionTime: string, timezone = 'Asia/Shanghai'): LiurenResult {
  if (timezone !== 'Asia/Shanghai') {
    throw new Error('静态网页版本当前按浏览器本地时间计算；请使用 Asia/Shanghai，或在本地后端版本中扩展时区支持。');
  }
  const date = parseQuestionTime(questionTime);
  const solar = getSolarFromDate(date);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const pillars = {
    year: eightChar.getYear(),
    month: eightChar.getMonth(),
    day: eightChar.getDay(),
    hour: eightChar.getTime(),
  };
  const prevQi = lunar.getPrevQi();
  const qiName = prevQi.getName();
  const monthGeneral = {
    branch: MONTH_GENERAL_BY_QI[qiName],
    source_qi: qiName,
    source_qi_time: prevQi.getSolar().toYmdHms(),
  };
  const plate = buildTianDiPan(monthGeneral.branch, pillars.hour[1]);
  const lessons = buildFourLessons(pillars.day, plate);
  const transmissions = decideThreeTransmissions(pillars.day, pillars.hour, monthGeneral.branch, plate, lessons);
  const commonTrace = [
    `localized_datetime=${date.toISOString()}`,
    `four_pillars=${JSON.stringify(pillars)}`,
    `day_xunkong=${JSON.stringify(splitXunkong(eightChar.getDayXunKong()))}`,
    `month_general=${JSON.stringify(monthGeneral)}`,
    `tian_di_pan_rule=place_month_general_${monthGeneral.branch}_on_hour_branch_${pillars.hour[1]}`,
  ];
  return {
    type: 'da_liuren',
    milestone: 3,
    input: { question_time: questionTime, timezone },
    localized_datetime: date.toISOString(),
    four_pillars: pillars,
    xunkong: splitXunkong(eightChar.getDayXunKong()),
    month_general: monthGeneral,
    tian_di_pan: plate,
    four_lessons: { status: 'computed', items: lessons },
    three_transmissions: { status: transmissions.status, gate: transmissions.gate, variant: transmissions.variant, items: transmissions.items },
    debug_trace: [
      ...commonTrace,
      `four_lessons=${JSON.stringify(lessons.map((item) => [item.label, item.upper, item.lower, item.relation]))}`,
      ...transmissions.debug_trace,
    ],
  };
}
