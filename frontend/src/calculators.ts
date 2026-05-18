import { Solar } from 'lunar-javascript';
import { analyzeDaliurenTiming, type TimingAnalysis } from './engines/timing';

export type ChartMode = 'liuyao' | 'liuren';
export type LinePolarity = 'yin' | 'yang';
export type LiuyaoMode = 'manual' | 'time' | 'number';

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

export type LiuyaoMeta = {
  mode: LiuyaoMode;
  sourceInput?: string;
  generatedAt?: string;
  algorithmVersion: string;
};

export type LiuyaoTimeMode = {
  datetime: string;
  timezone: string;
};

export type LiuyaoNumberMode = {
  numbers: string;
};

export type InputFingerprint = {
  datetime: string;
  timezone: string;
  questionTextHash: string;
  questionCategory: string;
  questionIntent: string;
  mode: string;
  sourceInput: string;
  algorithmVersion: string;
};

export type LiuyaoWuxingRelation = '生' | '克' | '比和';

export type LiuyaoWuxingAnalysis = {
  base_upper_trigram: string;
  base_lower_trigram: string;
  changed_upper_trigram: string;
  changed_lower_trigram: string;
  base_element: string;
  changed_element: string;
  relation: LiuyaoWuxingRelation;
  relation_arrow: string;
  direction: 'base_to_changed' | 'changed_to_base' | 'same';
};

export type LiuyaoInterpretation = {
  movement_pattern: '静卦' | '动卦';
  same_hexagram: boolean;
  wuxing_summary: string;
  yin_yang_ratio: {
    yin: number;
    yang: number;
    moving: number;
  };
  notes: string[];
};

export type LiuYaoResult = {
  type: 'liu_yao';
  milestone: number;
  input: {
    method: LiuyaoMode;
    manual_lines: number[];
    line_order: 'bottom_to_top';
    question_text?: string;
    questionText?: string;
    questionCategory?: QuestionCategory;
    questionIntent?: QuestionIntent;
  };
  meta: LiuyaoMeta;
  input_fingerprint: InputFingerprint;
  base_hexagram: Hexagram;
  changed_hexagram: Hexagram;
  moving_lines: number[];
  wuxing: LiuyaoWuxingAnalysis;
  interpretation: LiuyaoInterpretation;
  debug_trace: string[];
};

export type WuxingRelation = '生' | '克' | '比和' | '泄' | '耗';

export type WuxingPairRelation = {
  from_label: string;
  from: string;
  from_element: string;
  to_label: string;
  to: string;
  to_element: string;
  relation: WuxingRelation;
};

export type AskerGender = 'unknown' | 'female' | 'male' | 'other';

export type AskerProfileInput = {
  gender: AskerGender;
  birth_time?: string;
  daymaster?: string;
};

export type AskerProfile = {
  gender: AskerGender;
  daymaster_source: 'manual' | 'birth_time' | 'chart_day_fallback';
  asker_daymaster: string;
  asker_element: string;
  asker_bias: string;
  chart_bias: string;
  impact: string;
  advice: string;
};

export type QuestionCategory =
  | 'general'
  | 'sleep_health'
  | 'research_project'
  | 'career'
  | 'money_resource'
  | 'relationship'
  | 'travel'
  | 'lost_item'
  | 'daily_decision'
  | 'decision'
  | 'exam_learning'
  | 'communication'
  | 'life_path';

export type QuestionIntent = 'trend' | 'timing_advice' | 'risk_check' | 'go_or_no_go' | 'strategy' | 'diagnosis';

export type QuestionSchema = {
  questionText: string;
  questionCategory: QuestionCategory;
  questionIntent: QuestionIntent;
};

export type QuestionContext = QuestionSchema & {
  category_label: string;
  intent_label: string;
  class_spirit: string;
  focus_points: string[];
  favorable_signals: string[];
  risk_signals: string[];
  suggested_action: string;
  avoid_action: string;
};

export type LiurenResult = {
  type: 'da_liuren';
  milestone: number;
  input: {
    question_time: string;
    timezone: string;
    question_text?: string;
    questionText?: string;
    questionCategory?: QuestionCategory;
    questionIntent?: QuestionIntent;
    asker?: AskerProfileInput;
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
  wuxing_relations?: {
    daymaster: string;
    daymaster_element: string;
    initial_relation_to_daymaster: WuxingRelation;
    middle_relation_to_initial: WuxingRelation;
    final_relation_to_middle: WuxingRelation;
    energy_flow: string;
    overall_pattern: string;
    daymaster_to_transmissions: Array<{
      target_stage: string;
      target_branch: string;
      target_element: string;
      relation: WuxingRelation;
    }>;
    transmissions_to_daymaster: Array<{
      stage: string;
      branch: string;
      element: string;
      relation: WuxingRelation;
    }>;
    transmission_relations: WuxingPairRelation[];
    four_lesson_internal_relations: Array<{
      lesson: string;
      upper: string;
      upper_element: string;
      lower: string;
      lower_element: string;
      relation: WuxingRelation;
    }>;
    four_lesson_upper_relations: WuxingPairRelation[];
  };
  asker_profile?: AskerProfile;
  question_schema?: QuestionSchema;
  question_context?: QuestionContext;
  timing?: TimingAnalysis;
  input_fingerprint?: InputFingerprint;
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

const TRIGRAM_ELEMENTS: Record<string, string> = {
  乾: '金',
  兑: '金',
  震: '木',
  巽: '木',
  坎: '水',
  离: '火',
  坤: '土',
  艮: '土',
};

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
const QUESTION_CATEGORIES: Record<QuestionCategory, { label: string; classSpirit: string; focusPoints: string[]; suggestedAction: string; avoidAction: string }> = {
  general: {
    label: '综合',
    classSpirit: '日干/三传',
    focusPoints: ['整体趋势', '关键阻力', '可借之力'],
    suggestedAction: '先抓主要矛盾，再决定推进节奏。',
    avoidAction: '避免只凭单一信号下结论。',
  },
  sleep_health: {
    label: '睡眠健康',
    classSpirit: '身/病',
    focusPoints: ['身体消耗', '恢复节律', '压力来源'],
    suggestedAction: '优先稳住作息和恢复窗口。',
    avoidAction: '避免继续透支精力。',
  },
  research_project: {
    label: '研究项目',
    classSpirit: '文书/课题/资源',
    focusPoints: ['证据链', '资源配合', '阶段推进'],
    suggestedAction: '先补齐关键证据，再推进下一步。',
    avoidAction: '避免在证据不足时扩大范围。',
  },
  career: {
    label: '事业职业',
    classSpirit: '官/职事',
    focusPoints: ['职责压力', '上级规则', '机会窗口'],
    suggestedAction: '按规则推进，保留沟通余地。',
    avoidAction: '避免硬碰硬或越级冒进。',
  },
  money_resource: {
    label: '金钱资源',
    classSpirit: '财/资源',
    focusPoints: ['投入产出', '资源占用', '现金压力'],
    suggestedAction: '先确认成本边界，再做投入。',
    avoidAction: '避免超预算承诺。',
  },
  relationship: {
    label: '关系',
    classSpirit: '人际/合冲',
    focusPoints: ['双方位置', '沟通阻力', '关系张力'],
    suggestedAction: '先澄清真实诉求，再谈推进。',
    avoidAction: '避免情绪化回应。',
  },
  travel: {
    label: '出行',
    classSpirit: '行人/道路',
    focusPoints: ['路线安排', '时间窗口', '临时变动'],
    suggestedAction: '提前留出缓冲时间。',
    avoidAction: '避免赶点和临时改计划。',
  },
  lost_item: {
    label: '失物',
    classSpirit: '物/所在',
    focusPoints: ['物品位置', '移动痕迹', '可回收性'],
    suggestedAction: '按最后接触点向外复查。',
    avoidAction: '避免盲目扩大搜索范围。',
  },
  daily_decision: {
    label: '日常决策',
    classSpirit: '用神/取舍',
    focusPoints: ['眼前条件', '执行成本', '可逆空间'],
    suggestedAction: '先处理最短路径上的关键条件。',
    avoidAction: '避免把短期选择扩大成长期承诺。',
  },
  decision: {
    label: '决策',
    classSpirit: '用神/取舍',
    focusPoints: ['利弊权重', '执行成本', '退出余地'],
    suggestedAction: '把选择拆成可逆与不可逆部分。',
    avoidAction: '避免一次性押注。',
  },
  exam_learning: {
    label: '考试学习',
    classSpirit: '文书/学业',
    focusPoints: ['吸收效率', '复习重点', '临场稳定'],
    suggestedAction: '集中处理高频薄弱点。',
    avoidAction: '避免平均用力。',
  },
  communication: {
    label: '沟通',
    classSpirit: '口舌/信息',
    focusPoints: ['信息清晰度', '对方反应', '误解风险'],
    suggestedAction: '先写清楚边界和请求。',
    avoidAction: '避免含糊表达。',
  },
  life_path: {
    label: '人生方向',
    classSpirit: '命身/阶段',
    focusPoints: ['长期趋势', '阶段节点', '可持续性'],
    suggestedAction: '把长期方向拆成可验证的阶段选择。',
    avoidAction: '避免用短期波动替代长期判断。',
  },
};
const QUESTION_INTENTS: Record<QuestionIntent, string> = {
  trend: '看趋势',
  timing_advice: '择时建议',
  risk_check: '风险检查',
  go_or_no_go: '是否推进',
  strategy: '策略选择',
  diagnosis: '原因诊断',
};
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
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

function splitDigitsIntoSixGroups(digits: string) {
  const baseSize = Math.floor(digits.length / 6);
  const extra = digits.length % 6;
  const groups: string[] = [];
  let cursor = 0;
  for (let index = 0; index < 6; index += 1) {
    const size = baseSize + (index < extra ? 1 : 0);
    groups.push(digits.slice(cursor, cursor + size) || '0');
    cursor += size;
  }
  return groups;
}

function normalizeDatetimeDigits(datetime: string) {
  const digits = datetime.replace(/\D/g, '');
  if (digits.length < 12) throw new Error('时间起卦需要包含年月日时分。');
  return digits.length === 12 ? `${digits}00` : digits;
}

function lineFromTimeGroup(group: string) {
  const value = Number(group);
  const isYang = value % 2 === 1;
  const remainder = value % 4;
  if (isYang) return remainder === 1 ? 9 : 7;
  return remainder === 0 ? 6 : 8;
}

function forceMovingLine(line: number) {
  if (line === 7) return 9;
  if (line === 8) return 6;
  return line;
}

function extractNumberDigits(numbers: string) {
  return [...numbers.replace(/\D/g, '')].map((digit) => Number(digit));
}

function normalizeLiuyaoLines(manualLines: number[]) {
  if (manualLines.length !== 6 || manualLines.some((line) => ![6, 7, 8, 9].includes(line))) {
    throw new Error('六爻输入必须正好包含 6 个值，且只能是 6、7、8、9。');
  }
  return manualLines;
}

function liuyaoWuxingRelation(baseElement: string, changedElement: string): Pick<LiuyaoWuxingAnalysis, 'relation' | 'relation_arrow' | 'direction'> {
  if (baseElement === changedElement) {
    return { relation: '比和', relation_arrow: `${baseElement} -> 比和 ${changedElement}`, direction: 'same' };
  }
  if (GENERATES[baseElement] === changedElement) {
    return { relation: '生', relation_arrow: `${baseElement} -> 生 ${changedElement}`, direction: 'base_to_changed' };
  }
  if (CONTROLS[baseElement] === changedElement) {
    return { relation: '克', relation_arrow: `${baseElement} -> 克 ${changedElement}`, direction: 'base_to_changed' };
  }
  if (GENERATES[changedElement] === baseElement) {
    return { relation: '生', relation_arrow: `${changedElement} -> 生 ${baseElement}`, direction: 'changed_to_base' };
  }
  return { relation: '克', relation_arrow: `${changedElement} -> 克 ${baseElement}`, direction: 'changed_to_base' };
}

function analyzeLiuyaoWuxing(baseHexagram: Hexagram, changedHexagram: Hexagram): LiuyaoWuxingAnalysis {
  const baseElement = TRIGRAM_ELEMENTS[baseHexagram.upper_trigram];
  const changedElement = TRIGRAM_ELEMENTS[changedHexagram.upper_trigram];
  return {
    base_upper_trigram: baseHexagram.upper_trigram,
    base_lower_trigram: baseHexagram.lower_trigram,
    changed_upper_trigram: changedHexagram.upper_trigram,
    changed_lower_trigram: changedHexagram.lower_trigram,
    base_element: baseElement,
    changed_element: changedElement,
    ...liuyaoWuxingRelation(baseElement, changedElement),
  };
}

function interpretLiuyao(baseHexagram: Hexagram, changedHexagram: Hexagram, movingLines: number[], wuxing: LiuyaoWuxingAnalysis, question: QuestionSchema): LiuyaoInterpretation {
  const yin = baseHexagram.lines.filter((line) => line.polarity === 'yin').length;
  const yang = baseHexagram.lines.length - yin;
  const movementPattern = movingLines.length ? '动卦' : '静卦';
  const sameHexagram = baseHexagram.number === changedHexagram.number;
  const category = QUESTION_CATEGORIES[question.questionCategory];
  const notes = [
    movementPattern === '静卦' ? '六爻皆静，先看本卦结构。' : `有${movingLines.length}个动爻，需同时看本卦与变卦。`,
    sameHexagram ? '本卦与变卦相同，事情结构变化较少。' : '本卦已转入变卦，事情存在变化路径。',
    `本卦上卦五行为${wuxing.base_element}，变卦上卦五行为${wuxing.changed_element}。`,
    yang > yin ? '阳爻偏多，外显与推进性较强。' : yin > yang ? '阴爻偏多，收敛与承载性较强。' : '阴阳数量平衡。',
    `问题类型为${category.label}，解释层关注${category.focusPoints.join('、')}。`,
    `提问意图为${QUESTION_INTENTS[question.questionIntent]}，不改变卦体，只调整建议焦点。`,
  ];
  return {
    movement_pattern: movementPattern,
    same_hexagram: sameHexagram,
    wuxing_summary: wuxing.relation_arrow,
    yin_yang_ratio: {
      yin,
      yang,
      moving: movingLines.length,
    },
    notes,
  };
}

function buildLiuyaoResult(
  manualLines: number[],
  question: string | Partial<QuestionSchema>,
  meta: LiuyaoMeta,
  trace: string[],
  fingerprintBase: { datetime?: string; timezone?: string } = {},
): LiuYaoResult {
  const questionSchema = normalizeQuestionSchema(question);
  const normalizedLines = normalizeLiuyaoLines(manualLines);
  const baseBits = manualLines.map(lineToBit);
  const changedBits = manualLines.map((line) => (isMoving(line) ? 1 - lineToBit(line) : lineToBit(line)));
  const movingLines = manualLines.map((line, index) => (isMoving(line) ? index + 1 : 0)).filter(Boolean);
  const baseHexagram = buildHexagramFromBits(baseBits, manualLines);
  const changedHexagram = buildHexagramFromBits(changedBits);
  const wuxing = analyzeLiuyaoWuxing(baseHexagram, changedHexagram);
  const interpretation = interpretLiuyao(baseHexagram, changedHexagram, movingLines, wuxing, questionSchema);
  const inputFingerprint = buildInputFingerprint({
    ...fingerprintBase,
    question: questionSchema,
    mode: meta.mode,
    sourceInput: meta.sourceInput,
    algorithmVersion: meta.algorithmVersion,
  });
  return {
    type: 'liu_yao',
    milestone: 12,
    input: {
      method: meta.mode,
      manual_lines: normalizedLines,
      line_order: 'bottom_to_top',
      question_text: questionSchema.questionText,
      questionText: questionSchema.questionText,
      questionCategory: questionSchema.questionCategory,
      questionIntent: questionSchema.questionIntent,
    },
    meta,
    input_fingerprint: inputFingerprint,
    base_hexagram: baseHexagram,
    changed_hexagram: changedHexagram,
    moving_lines: movingLines,
    wuxing,
    interpretation,
    debug_trace: [
      `liuyao_meta=${JSON.stringify(meta)}`,
      `input_fingerprint=${JSON.stringify(inputFingerprint)}`,
      ...trace,
      `manual_lines(bottom_to_top)=${JSON.stringify(manualLines)}`,
      `base_bits(bottom_to_top)=${JSON.stringify(baseBits)}`,
      `changed_bits(bottom_to_top)=${JSON.stringify(changedBits)}`,
      `moving_lines=${JSON.stringify(movingLines)}`,
      `wuxing=${wuxing.relation_arrow}`,
      `interpretation=${interpretation.movement_pattern};yin=${interpretation.yin_yang_ratio.yin};yang=${interpretation.yin_yang_ratio.yang}`,
    ],
  };
}

export function calculateManualLiuyao(manualLines: number[], question: string | Partial<QuestionSchema> = ''): LiuYaoResult {
  return buildLiuyaoResult(manualLines, question, {
    mode: 'manual',
    sourceInput: JSON.stringify(manualLines),
    algorithmVersion: 'liuyao-manual-v1',
  }, ['mode=manual', 'manual_rule=direct 6/7/8/9 input']);
}

export function calculateTimeLiuyao(input: LiuyaoTimeMode, question: string | Partial<QuestionSchema> = ''): LiuYaoResult {
  if (input.timezone !== 'Asia/Shanghai') {
    throw new Error('静态网页版本当前按 Asia/Shanghai 记录时间起卦；请使用 Asia/Shanghai。');
  }
  const digits = normalizeDatetimeDigits(input.datetime);
  const groups = splitDigitsIntoSixGroups(digits);
  const initialLines = groups.map(lineFromTimeGroup);
  const digitSum = [...digits].reduce((sum, digit) => sum + Number(digit), 0);
  const movingPosition = digitSum % 6 || 6;
  const lines = initialLines.map((line, index) => (index + 1 === movingPosition ? forceMovingLine(line) : line));
  return buildLiuyaoResult(lines, question, {
    mode: 'time',
    sourceInput: input.datetime,
    generatedAt: input.datetime,
    algorithmVersion: 'liuyao-time-v1',
  }, [
    'mode=time',
    `time_digits=${digits}`,
    `time_groups=${JSON.stringify(groups)}`,
    `initial_lines_by_group=${JSON.stringify(initialLines)}`,
    `digit_sum=${digitSum}`,
    `moving_position_by_sum_mod_6=${movingPosition}`,
    `final_lines=${JSON.stringify(lines)}`,
  ], { datetime: input.datetime, timezone: input.timezone });
}

export function calculateNumberLiuyao(input: LiuyaoNumberMode, question: string | Partial<QuestionSchema> = ''): LiuYaoResult {
  const digits = extractNumberDigits(input.numbers);
  if (!digits.length) throw new Error('数字起卦需要至少输入一个数字。');
  const total = digits.reduce((sum, digit) => sum + digit, 0);
  const movingPosition = total % 6 || 6;
  const lines = Array.from({ length: 6 }, (_, index) => {
    const digit = digits[index % digits.length];
    const isYang = digit % 2 === 1;
    if (index + 1 === movingPosition) return isYang ? 9 : 6;
    return isYang ? 7 : 8;
  });
  return buildLiuyaoResult(lines, question, {
    mode: 'number',
    sourceInput: input.numbers,
    algorithmVersion: 'liuyao-number-v1',
  }, [
    'mode=number',
    `number_digits=${JSON.stringify(digits)}`,
    `digit_total=${total}`,
    `moving_position_by_total_mod_6=${movingPosition}`,
    `cyclic_digit_mapping=${JSON.stringify(lines.map((line, index) => ({ position: index + 1, digit: digits[index % digits.length], line })))}`,
  ]);
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

function wuxingRelationTo(subjectElement: string, objectElement: string): WuxingRelation {
  if (subjectElement === objectElement) return '比和';
  if (GENERATES[subjectElement] === objectElement) return '泄';
  if (GENERATES[objectElement] === subjectElement) return '生';
  if (CONTROLS[subjectElement] === objectElement) return '克';
  if (CONTROLS[objectElement] === subjectElement) return '耗';
  throw new Error(`未知五行关系：${subjectElement}/${objectElement}`);
}

function wuxingPairRelation(fromLabel: string, from: string, toLabel: string, to: string): WuxingPairRelation {
  const fromElement = ELEMENT_BY_TOKEN[from];
  const toElement = ELEMENT_BY_TOKEN[to];
  return {
    from_label: fromLabel,
    from,
    from_element: fromElement,
    to_label: toLabel,
    to,
    to_element: toElement,
    relation: wuxingRelationTo(fromElement, toElement),
  };
}

function overallWuxingPattern(elements: string[]) {
  if (elements[0] === elements[1] && elements[1] === elements[2]) return '三传比和';
  if (GENERATES[elements[0]] === elements[1] && GENERATES[elements[1]] === elements[2]) return '连续相生';
  if (CONTROLS[elements[0]] === elements[1] && CONTROLS[elements[1]] === elements[2]) return '连续相克';
  if (elements[0] === elements[2] && elements[0] !== elements[1]) return '首末同气';
  return '生克混杂';
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

function analyzeWuxingRelations(dayGanzhi: string, threeTransmissions: ReturnType<typeof decideThreeTransmissions>['items'], fourLessons: ReturnType<typeof buildFourLessons>) {
  const daymaster = dayGanzhi[0];
  const daymasterElement = ELEMENT_BY_TOKEN[daymaster];
  const transmissions = threeTransmissions.map((item) => ({
    ...item,
    element: ELEMENT_BY_TOKEN[item.branch],
  }));
  const [initial, middle, final] = transmissions;
  const energyFlowElements = transmissions.map((item) => item.element);

  return {
    daymaster,
    daymaster_element: daymasterElement,
    initial_relation_to_daymaster: wuxingRelationTo(initial.element, daymasterElement),
    middle_relation_to_initial: wuxingRelationTo(middle.element, initial.element),
    final_relation_to_middle: wuxingRelationTo(final.element, middle.element),
    energy_flow: energyFlowElements.join(' -> '),
    overall_pattern: overallWuxingPattern(energyFlowElements),
    daymaster_to_transmissions: transmissions.map((item) => ({
      target_stage: item.stage,
      target_branch: item.branch,
      target_element: item.element,
      relation: wuxingRelationTo(daymasterElement, item.element),
    })),
    transmissions_to_daymaster: transmissions.map((item) => ({
      stage: item.stage,
      branch: item.branch,
      element: item.element,
      relation: wuxingRelationTo(item.element, daymasterElement),
    })),
    transmission_relations: [
      wuxingPairRelation('初传', initial.branch, '中传', middle.branch),
      wuxingPairRelation('中传', middle.branch, '末传', final.branch),
    ],
    four_lesson_internal_relations: fourLessons.map((item) => ({
      lesson: item.label,
      upper: item.upper,
      upper_element: ELEMENT_BY_TOKEN[item.upper],
      lower: item.lower,
      lower_element: ELEMENT_BY_TOKEN[item.lower],
      relation: wuxingRelationTo(ELEMENT_BY_TOKEN[item.upper], ELEMENT_BY_TOKEN[item.lower]),
    })),
    four_lesson_upper_relations: fourLessons.flatMap((left, leftIndex) =>
      fourLessons.slice(leftIndex + 1).map((right) => wuxingPairRelation(left.label, left.upper, right.label, right.upper)),
    ),
  };
}

function normalizeDaymaster(value?: string) {
  if (!value) return '';
  return [...value].find((char) => STEMS.includes(char)) ?? '';
}

function resolveAskerDaymaster(input: AskerProfileInput | undefined, chartDayGanzhi: string) {
  const manual = normalizeDaymaster(input?.daymaster);
  if (manual) return { daymaster: manual, source: 'manual' as const };
  if (input?.birth_time) {
    const birthDate = parseQuestionTime(input.birth_time);
    const birthDay = getSolarFromDate(birthDate).getLunar().getEightChar().getDay();
    return { daymaster: birthDay[0], source: 'birth_time' as const };
  }
  return { daymaster: chartDayGanzhi[0], source: 'chart_day_fallback' as const };
}

function dominantChartElement(threeTransmissions: ReturnType<typeof decideThreeTransmissions>['items'], fourLessons: ReturnType<typeof buildFourLessons>) {
  const scores: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const item of threeTransmissions) scores[ELEMENT_BY_TOKEN[item.branch]] += 2;
  for (const item of fourLessons) {
    scores[ELEMENT_BY_TOKEN[item.upper]] += 1;
    scores[ELEMENT_BY_TOKEN[item.lower]] += 1;
  }
  return Object.entries(scores).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))[0][0];
}

function askerImpact(chartElement: string, askerElement: string) {
  if (chartElement === askerElement) return '同气助身';
  if (GENERATES[chartElement] === askerElement) return '印旺生身';
  if (GENERATES[askerElement] === chartElement) return '食伤泄身';
  if (CONTROLS[askerElement] === chartElement) return '财旺耗身';
  if (CONTROLS[chartElement] === askerElement) return '官杀压身';
  return '影响混杂';
}

function askerAdvice(impact: string) {
  return (
    {
      同气助身: '适合借力合作，也要避免分散。',
      印旺生身: '适合补足资源，先稳住节奏。',
      食伤泄身: '适合表达输出，注意保留余力。',
      财旺耗身: '适合推进结果，不宜过度透支。',
      官杀压身: '适合守规则推进，避免硬碰压力。',
    }[impact] ?? '先观察关键节点，避免仓促加码。'
  );
}

function analyzeAskerProfile(
  input: AskerProfileInput | undefined,
  chartDayGanzhi: string,
  threeTransmissions: ReturnType<typeof decideThreeTransmissions>['items'],
  fourLessons: ReturnType<typeof buildFourLessons>,
): AskerProfile {
  const resolved = resolveAskerDaymaster(input, chartDayGanzhi);
  const askerElement = ELEMENT_BY_TOKEN[resolved.daymaster];
  const chartElement = dominantChartElement(threeTransmissions, fourLessons);
  const impact = askerImpact(chartElement, askerElement);
  return {
    gender: input?.gender ?? 'unknown',
    daymaster_source: resolved.source,
    asker_daymaster: `${resolved.daymaster}${askerElement}`,
    asker_element: askerElement,
    asker_bias: `${askerElement}性为主`,
    chart_bias: `${chartElement}旺`,
    impact,
    advice: askerAdvice(impact),
  };
}

function normalizeQuestionSchema(question: string | Partial<QuestionSchema> = ''): QuestionSchema {
  if (typeof question === 'string') {
    return { questionText: question, questionCategory: 'general', questionIntent: 'trend' };
  }
  return {
    questionText: question.questionText ?? '',
    questionCategory: question.questionCategory ?? 'general',
    questionIntent: question.questionIntent ?? 'trend',
  };
}

export function hashQuestionText(value = '') {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function buildInputFingerprint(input: {
  datetime?: string;
  timezone?: string;
  question: QuestionSchema;
  mode: string;
  sourceInput?: string;
  algorithmVersion: string;
}): InputFingerprint {
  return {
    datetime: input.datetime ?? '',
    timezone: input.timezone ?? '',
    questionTextHash: hashQuestionText(input.question.questionText),
    questionCategory: input.question.questionCategory,
    questionIntent: input.question.questionIntent,
    mode: input.mode,
    sourceInput: input.sourceInput ?? '',
    algorithmVersion: input.algorithmVersion,
  };
}

function questionFocusPoints(basePoints: string[], intent: QuestionIntent) {
  const intentFocus: Record<QuestionIntent, string> = {
    trend: '后续走势',
    timing_advice: '时间窗口',
    risk_check: '风险触发点',
    go_or_no_go: '推进条件',
    strategy: '行动路径',
    diagnosis: '成因结构',
  };
  return [...basePoints, intentFocus[intent]];
}

function favorableQuestionSignals(wuxingRelations: NonNullable<LiurenResult['wuxing_relations']>, askerProfile: AskerProfile) {
  const signals: string[] = [];
  if (wuxingRelations.overall_pattern === '连续相生') signals.push('三传连续相生，结构上有顺承');
  if (['生', '比和'].includes(wuxingRelations.initial_relation_to_daymaster)) signals.push('初传对日干有扶助或同气');
  if (['同气助身', '印旺生身'].includes(askerProfile.impact)) signals.push(`对提问者为${askerProfile.impact}`);
  return signals.length ? signals : ['暂无明显扶助信号'];
}

function riskQuestionSignals(wuxingRelations: NonNullable<LiurenResult['wuxing_relations']>, askerProfile: AskerProfile) {
  const signals: string[] = [];
  if (wuxingRelations.overall_pattern === '生克混杂') signals.push('三传生克混杂，节奏容易反复');
  if (['克', '耗'].includes(wuxingRelations.initial_relation_to_daymaster)) signals.push('初传对日干有克耗');
  if (['财旺耗身', '官杀压身', '食伤泄身'].includes(askerProfile.impact)) signals.push(`对提问者为${askerProfile.impact}`);
  return signals.length ? signals : ['暂无明显风险信号'];
}

function suggestedQuestionAction(baseAction: string, intent: QuestionIntent, favorableSignals: string[], riskSignals: string[]) {
  if (intent === 'go_or_no_go') return '有扶助信号时小步推进；风险信号多时先暂停复核。';
  if (intent === 'timing_advice') return '选择阻力较少、资源更稳的时间段行动。';
  if (intent === 'risk_check' && riskSignals[0] !== '暂无明显风险信号') return '先处理风险点，再进入执行。';
  if (intent === 'strategy') return '采用分阶段策略，先做低成本验证。';
  if (intent === 'diagnosis') return '优先定位阻力来源，再判断是否调整路径。';
  return favorableSignals[0] !== '暂无明显扶助信号' ? baseAction : '先收集更多信息，再小范围试探。';
}

function avoidQuestionAction(baseAction: string, intent: QuestionIntent, riskSignals: string[]) {
  if (intent === 'go_or_no_go') return '避免在条件未明时直接重押。';
  if (intent === 'risk_check') return '避免忽视已出现的克耗与反复信号。';
  return riskSignals[0] !== '暂无明显风险信号' ? baseAction : '避免过度解读单一吉凶信号。';
}

function analyzeQuestionContext(
  question: QuestionSchema,
  wuxingRelations: NonNullable<LiurenResult['wuxing_relations']>,
  askerProfile: AskerProfile,
): QuestionContext {
  const category = QUESTION_CATEGORIES[question.questionCategory];
  const favorableSignals = favorableQuestionSignals(wuxingRelations, askerProfile);
  const riskSignals = riskQuestionSignals(wuxingRelations, askerProfile);
  return {
    ...question,
    category_label: category.label,
    intent_label: QUESTION_INTENTS[question.questionIntent],
    class_spirit: category.classSpirit,
    focus_points: questionFocusPoints(category.focusPoints, question.questionIntent),
    favorable_signals: favorableSignals,
    risk_signals: riskSignals,
    suggested_action: suggestedQuestionAction(category.suggestedAction, question.questionIntent, favorableSignals, riskSignals),
    avoid_action: avoidQuestionAction(category.avoidAction, question.questionIntent, riskSignals),
  };
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
  const gateOrder = ['贼克', '比用', '涉害', '遥克', '昴星', '别责', '八专', '伏吟', '返吟'];
  const selectedIndex = gateOrder.indexOf(gate);
  gateOrder.forEach((gateName, index) => {
    if (index === selectedIndex) {
      trace.push(`gate_step ${gateName}=selected first=${first} variant=${variant}`);
    } else if (selectedIndex >= 0 && index < selectedIndex) {
      trace.push(`gate_step ${gateName}=checked_no_result`);
    } else {
      trace.push(`gate_step ${gateName}=not_reached`);
    }
  });
  trace.push(`gate_${gate} selected=${first} variant=${variant}`, `three_transmissions chain=${JSON.stringify(branches)}`);
  return {
    status: 'computed' as const,
    gate,
    variant,
    items: branches.map((branch, index) => ({ index: index + 1, stage: ['初传', '中传', '末传'][index], branch })),
    debug_trace: trace,
  };
}

export function calculateLiurenV1(questionTime: string, timezone = 'Asia/Shanghai', question: string | Partial<QuestionSchema> = '', asker?: AskerProfileInput): LiurenResult {
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
  const wuxingRelations = analyzeWuxingRelations(pillars.day, transmissions.items, lessons);
  const askerProfile = analyzeAskerProfile(asker, pillars.day, transmissions.items, lessons);
  const questionSchema = normalizeQuestionSchema(question);
  const questionContext = analyzeQuestionContext(questionSchema, wuxingRelations, askerProfile);
  const inputFingerprint = buildInputFingerprint({
    datetime: questionTime,
    timezone,
    question: questionSchema,
    mode: 'da_liuren',
    sourceInput: questionTime,
    algorithmVersion: 'daliuren-v1-milestone-13',
  });
  const timing = analyzeDaliurenTiming({
    currentDatetime: date.toISOString(),
    timezone,
    questionCategory: questionContext.questionCategory,
    questionIntent: questionContext.questionIntent,
    threeTransmissions: transmissions.items,
    xunkong: splitXunkong(eightChar.getDayXunKong()),
  });
  const commonTrace = [
    `localized_datetime=${date.toISOString()}`,
    `question_time_used=${questionTime} timezone=${timezone}`,
    `time_components year=${date.getFullYear()} month=${date.getMonth() + 1} day=${date.getDate()} hour=${date.getHours()} minute=${date.getMinutes()} second=${date.getSeconds()}`,
    `four_pillars=${JSON.stringify(pillars)}`,
    `day_xunkong=${JSON.stringify(splitXunkong(eightChar.getDayXunKong()))}`,
    `month_general=${JSON.stringify(monthGeneral)}`,
    `tian_di_pan_rule=place_month_general_${monthGeneral.branch}_on_hour_branch_${pillars.hour[1]}`,
    `input_fingerprint=${JSON.stringify(inputFingerprint)}`,
  ];
  return {
    type: 'da_liuren',
    milestone: 7,
    input: {
      question_time: questionTime,
      timezone,
      question_text: questionSchema.questionText,
      questionText: questionSchema.questionText,
      questionCategory: questionSchema.questionCategory,
      questionIntent: questionSchema.questionIntent,
      asker,
    },
    localized_datetime: date.toISOString(),
    four_pillars: pillars,
    xunkong: splitXunkong(eightChar.getDayXunKong()),
    month_general: monthGeneral,
    tian_di_pan: plate,
    four_lessons: { status: 'computed', items: lessons },
    three_transmissions: { status: transmissions.status, gate: transmissions.gate, variant: transmissions.variant, items: transmissions.items },
    wuxing_relations: wuxingRelations,
    asker_profile: askerProfile,
    question_schema: questionSchema,
    question_context: questionContext,
    timing,
    input_fingerprint: inputFingerprint,
    debug_trace: [
      ...commonTrace,
      `four_lessons=${JSON.stringify(lessons.map((item) => [item.label, item.upper, item.lower, item.relation]))}`,
      ...transmissions.debug_trace,
      `wuxing_relations=${wuxingRelations.energy_flow}:${wuxingRelations.overall_pattern}`,
      `asker_profile=${askerProfile.asker_daymaster}:${askerProfile.chart_bias}:${askerProfile.impact}`,
      `question_context=${questionContext.questionCategory}:${questionContext.questionIntent}`,
      ...timing.debug_trace,
    ],
  };
}
