import type { AppResult } from '../appTypes';
import type { LineState } from '../calculators';
import type { NameWuxingApiResult, NameWuxingProfile, PersonalizedInfluence, WuxingElement } from './types';

const ELEMENTS: WuxingElement[] = ['木', '火', '土', '金', '水'];
const GENERATES: Record<WuxingElement, WuxingElement> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CONTROLS: Record<WuxingElement, WuxingElement> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const STEM_BRANCH_ELEMENTS: Record<string, WuxingElement> = {
  甲: '木',
  乙: '木',
  寅: '木',
  卯: '木',
  丙: '火',
  丁: '火',
  巳: '火',
  午: '火',
  戊: '土',
  己: '土',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
  庚: '金',
  辛: '金',
  申: '金',
  酉: '金',
  壬: '水',
  癸: '水',
  亥: '水',
  子: '水',
};
const TRIGRAM_ELEMENTS: Record<string, WuxingElement> = {
  乾: '金',
  兑: '金',
  震: '木',
  巽: '木',
  坎: '水',
  离: '火',
  坤: '土',
  艮: '土',
};
const XIAO_LIUREN_ELEMENTS: Record<string, WuxingElement> = {
  大安: '木',
  留连: '土',
  速喜: '火',
  赤口: '金',
  小吉: '木',
  空亡: '水',
};
const CONFIDENCE_WEIGHT = { high: 1, medium: 0.7, low: 0.4 } as const;

export type PersonalizedResult = AppResult & {
  rawChart: AppResult;
  nameProfile: NameWuxingProfile;
  personalizedChart: PersonalizedInfluence;
};

function emptyElementScores(): Record<WuxingElement, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function knownElement(value: string | undefined): WuxingElement | null {
  return value && ELEMENTS.includes(value as WuxingElement) ? (value as WuxingElement) : null;
}

export function buildNameWuxingProfile(apiResult: NameWuxingApiResult): NameWuxingProfile {
  const elements = emptyElementScores();
  const characterAnalysis = apiResult.characters.map((item) => {
    const wuxing = knownElement(item.element) ?? '未知';
    const confidence: 'low' | 'medium' | 'high' = wuxing === '未知' ? 'low' : 'high';
    if (wuxing !== '未知') {
      elements[wuxing] = roundScore(elements[wuxing] + 1 + CONFIDENCE_WEIGHT[confidence]);
    }
    return {
      char: item.char,
      wuxing,
      basis: ['StepFun 姓名五行 V1', '逐字主五行判定'],
      confidence,
    };
  });
  const positive = Object.entries(elements).filter(([, score]) => score > 0);
  const maxScore = Math.max(0, ...positive.map(([, score]) => score));
  return {
    name: apiResult.name,
    elements,
    dominantElements: positive.filter(([, score]) => score === maxScore).map(([element]) => element),
    weakElements: Object.entries(elements).filter(([, score]) => score === 0).map(([element]) => element),
    characterAnalysis,
  };
}

function stripPersonalization(result: AppResult): AppResult {
  if (!('rawChart' in result)) return JSON.parse(JSON.stringify(result)) as AppResult;
  const rawChart = (result as PersonalizedResult).rawChart;
  return JSON.parse(JSON.stringify(rawChart)) as AppResult;
}

function pushElement(flow: string[], label: string, token: string | undefined) {
  const element = knownElement(token ?? '');
  if (element) flow.push(`${label}:${element}`);
}

function trigramForLine(lines: LineState[], position: number) {
  const line = lines.find((item) => item.position === position);
  if (!line) return '';
  return position <= 3 ? 'lower' : 'upper';
}

export function chartElementFlow(result: AppResult): string[] {
  const flow: string[] = [];
  if (result.type === 'da_liuren') {
    pushElement(flow, `日干${result.four_pillars.day[0]}`, STEM_BRANCH_ELEMENTS[result.four_pillars.day[0]]);
    for (const item of result.three_transmissions.items) pushElement(flow, item.stage + item.branch, STEM_BRANCH_ELEMENTS[item.branch]);
    for (const lesson of result.four_lessons.items) {
      pushElement(flow, `${lesson.label}上${lesson.upper}`, lesson.upper_element ?? STEM_BRANCH_ELEMENTS[lesson.upper]);
      pushElement(flow, `${lesson.label}下${lesson.lower}`, lesson.lower_element ?? STEM_BRANCH_ELEMENTS[lesson.lower]);
    }
  } else if (result.type === 'xiao_liuren') {
    pushElement(flow, `最终宫位${result.final_palace}`, XIAO_LIUREN_ELEMENTS[result.final_palace]);
  } else {
    pushElement(flow, `本卦上${result.base_hexagram.upper_trigram}`, TRIGRAM_ELEMENTS[result.base_hexagram.upper_trigram]);
    pushElement(flow, `本卦下${result.base_hexagram.lower_trigram}`, TRIGRAM_ELEMENTS[result.base_hexagram.lower_trigram]);
    pushElement(flow, `变卦上${result.changed_hexagram.upper_trigram}`, TRIGRAM_ELEMENTS[result.changed_hexagram.upper_trigram]);
    pushElement(flow, `变卦下${result.changed_hexagram.lower_trigram}`, TRIGRAM_ELEMENTS[result.changed_hexagram.lower_trigram]);
    for (const position of result.moving_lines) {
      const side = trigramForLine(result.base_hexagram.lines, position);
      const trigram = side === 'lower' ? result.base_hexagram.lower_trigram : result.base_hexagram.upper_trigram;
      pushElement(flow, `动爻${position}${trigram}`, TRIGRAM_ELEMENTS[trigram]);
    }
  }
  return flow;
}

function flowElements(flow: string[]) {
  return flow.map((item) => item.split(':').at(-1) ?? '').filter((item): item is WuxingElement => ELEMENTS.includes(item as WuxingElement));
}

function summarizeInfluence(input: Pick<PersonalizedInfluence, 'supportScore' | 'drainScore' | 'conflictScore' | 'controlScore' | 'harmonyScore'>) {
  const stabilizing = input.supportScore + input.harmonyScore;
  const pressure = input.conflictScore + input.drainScore;
  if (input.conflictScore > stabilizing && input.conflictScore >= input.drainScore) return '冲突压力偏强';
  if (input.drainScore > stabilizing) return '消耗输出偏强';
  if (stabilizing > pressure && input.supportScore >= input.harmonyScore) return '补益扶助偏强';
  if (input.harmonyScore >= pressure && input.harmonyScore > 0) return '同气平衡偏强';
  if (input.controlScore > stabilizing) return '可控但耗力';
  return '结构相对平衡';
}

function actionAdvice(summary: string) {
  if (summary.includes('冲突')) return '适合先降阻力和压力源，再推进关键动作。';
  if (summary.includes('消耗')) return '适合控制投入节奏，避免过度输出。';
  if (summary.includes('补益')) return '适合借势推进，同时保留复核节点。';
  if (summary.includes('同气')) return '适合稳步执行，避免因过稳而停滞。';
  return '适合小步验证，以反馈修正行动。';
}

export function analyzePersonalizedInfluence(result: AppResult, nameProfile: NameWuxingProfile): PersonalizedInfluence {
  const flow = chartElementFlow(result);
  const chartElements = flowElements(flow);
  const usefulElements: string[] = [];
  const riskyElements: string[] = [];
  let supportScore = 0;
  let drainScore = 0;
  let conflictScore = 0;
  let controlScore = 0;
  let harmonyScore = 0;

  for (const chartElement of chartElements) {
    for (const [nameElement, nameScore] of Object.entries(nameProfile.elements) as Array<[WuxingElement, number]>) {
      if (nameScore <= 0) continue;
      if (chartElement === nameElement) {
        harmonyScore += nameScore;
        usefulElements.push(chartElement);
      } else if (GENERATES[chartElement] === nameElement) {
        supportScore += nameScore;
        usefulElements.push(chartElement);
      } else if (GENERATES[nameElement] === chartElement) {
        drainScore += nameScore;
        riskyElements.push(chartElement);
      } else if (CONTROLS[chartElement] === nameElement) {
        conflictScore += nameScore;
        riskyElements.push(chartElement);
      } else if (CONTROLS[nameElement] === chartElement) {
        controlScore += nameScore;
      }
    }
  }

  const rounded = {
    supportScore: roundScore(supportScore),
    drainScore: roundScore(drainScore),
    conflictScore: roundScore(conflictScore),
    controlScore: roundScore(controlScore),
    harmonyScore: roundScore(harmonyScore),
  };
  const summary = summarizeInfluence(rounded);
  return {
    chartElementFlow: flow,
    nameElementBias: { ...nameProfile.elements },
    ...rounded,
    usefulElements: unique(usefulElements),
    riskyElements: unique(riskyElements),
    summary,
    actionAdvice: actionAdvice(summary),
  };
}

export function personalizeChart(result: AppResult, nameProfile: NameWuxingProfile): PersonalizedResult {
  const rawChart = stripPersonalization(result);
  const personalizedChart = analyzePersonalizedInfluence(rawChart, nameProfile);
  return {
    ...rawChart,
    rawChart,
    nameProfile,
    personalizedChart,
    debug_trace: [
      ...rawChart.debug_trace,
      `personalized_chart=name=${nameProfile.name};summary=${personalizedChart.summary}`,
      'personalized_chart_note=rawChart preserved; nameProfile only adjusts influence analysis',
    ],
  } as PersonalizedResult;
}
