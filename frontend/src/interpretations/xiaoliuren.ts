import type { XiaoLiurenPalaceName } from '../engines/xiaoliuren';

export type XiaoLiurenInterpretation = {
  palace: XiaoLiurenPalaceName;
  polarity: '吉' | '平' | '凶';
  keywords: string[];
  summary: string;
  progress: string;
  relationship: string;
  resource: string;
  action_advice: string;
  risk: string;
};

const INTERPRETATIONS: Record<XiaoLiurenPalaceName, XiaoLiurenInterpretation> = {
  大安: {
    palace: '大安',
    polarity: '吉',
    keywords: ['稳定', '守成', '确认', '缓进'],
    summary: '大安提示局面偏稳定，适合先确认基础条件，再稳步推进。',
    progress: '事情进展倾向平稳，不宜急推，适合处理已有基础、流程清楚的事项。',
    relationship: '人际沟通倾向温和，可通过明确边界和责任减少反复。',
    resource: '资源面倾向可控，适合盘点存量、核对预算或确认可用支持。',
    action_advice: '适合先做信息核验、排期和风险清单，再进入执行。',
    risk: '风险在于过度保守或拖延决策，可能错过需要及时响应的窗口。',
  },
  留连: {
    palace: '留连',
    polarity: '平',
    keywords: ['拖延', '反复', '等待', '卡点'],
    summary: '留连提示事项可能出现等待、往返或节奏变慢。',
    progress: '事情进展倾向迟缓，容易卡在审批、沟通或条件未齐的环节。',
    relationship: '人际层面提示信息来回较多，适合把口头沟通转成清晰记录。',
    resource: '资源面可能存在占用、延迟到账或支持不到位的情况。',
    action_advice: '适合明确下一步责任人、截止时间和缺口条件，减少空等。',
    risk: '风险在于反复消耗时间，导致机会成本上升或执行节奏被拖散。',
  },
  速喜: {
    palace: '速喜',
    polarity: '吉',
    keywords: ['消息', '推进', '响应', '机会'],
    summary: '速喜提示信息流动较快，事项有较快转明朗的倾向。',
    progress: '事情进展倾向较快，适合主动跟进、争取反馈或推进短周期事项。',
    relationship: '人际层面较适合沟通协调，但仍需避免只凭即时反馈下结论。',
    resource: '资源面可能出现可用支持、临时机会或较快反馈。',
    action_advice: '适合抓住当前窗口推进，同时保留确认和复核环节。',
    risk: '风险在于节奏过快导致判断粗糙，或把短期积极信号误当成最终结果。',
  },
  赤口: {
    palace: '赤口',
    polarity: '凶',
    keywords: ['争执', '误解', '口舌', '冲突'],
    summary: '赤口提示沟通摩擦和立场冲突的概率偏高。',
    progress: '事情进展容易受争议、质疑或细节分歧影响，不宜强行推进。',
    relationship: '人际层面提示口舌风险，适合降低情绪表达，保留书面确认。',
    resource: '资源面可能因分歧、权限或分配问题产生阻力。',
    action_advice: '适合先澄清事实、统一口径，再处理具体执行。',
    risk: '风险在于措辞不当、承诺过满或误解扩大，导致关系和进度同时受损。',
  },
  小吉: {
    palace: '小吉',
    polarity: '吉',
    keywords: ['小成', '协作', '渐进', '可行'],
    summary: '小吉提示事项有温和有利的倾向，适合小步推进。',
    progress: '事情进展倾向逐步改善，适合试点、轻量执行或先完成局部目标。',
    relationship: '人际层面较适合协商，容易通过互相让步取得可执行方案。',
    resource: '资源面倾向有一定支持，但规模或确定性可能有限。',
    action_advice: '适合把目标拆小，先拿到阶段性反馈和可验证结果。',
    risk: '风险在于把小进展放大为全面确定，后续仍需持续校准。',
  },
  空亡: {
    palace: '空亡',
    polarity: '凶',
    keywords: ['落空', '不实', '缺口', '暂缓'],
    summary: '空亡提示条件未实、信息不足或预期落空的倾向。',
    progress: '事情进展可能出现空转、延期或关键条件暂时不成立。',
    relationship: '人际层面提示承诺可靠性需复核，适合少做情绪判断，多看实际动作。',
    resource: '资源面可能存在缺口、不可用或账面支持难以落地的情况。',
    action_advice: '适合暂缓重投入，先验证关键事实、资源和执行条件。',
    risk: '风险在于基于不完整信息做决定，导致时间、预算或信任成本损耗。',
  },
};

export function interpretXiaoLiuren(palace: XiaoLiurenPalaceName): XiaoLiurenInterpretation {
  return INTERPRETATIONS[palace];
}
