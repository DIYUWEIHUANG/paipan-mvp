import { ArrowRight, Braces, Download, FileJson, GitBranch } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { AppResult, LiurenMode } from '../appTypes';
import type { Hexagram, LiurenResult, LiuYaoResult } from '../calculators';
import type { TimingAnalysis } from '../engines/timing';
import type { XiaoLiurenMilestone2Result } from '../features/xiaoliuren';
import { JsonViewer } from './JsonViewer';
import { SummaryCard } from './SummaryCard';

type ResultPanelProps = {
  result: AppResult | null;
  liurenMode: LiurenMode;
};

function resultKindLabel(result: AppResult) {
  if (result.type === 'da_liuren') return '大六壬';
  if (result.type === 'xiao_liuren') return '小六壬';
  return '六爻';
}

function resultFilePrefix(result: AppResult) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  return `paipan-${result.type}-${stamp}`;
}

function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function collectPageStyles() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');
}

function exportResultPage(result: AppResult) {
  const panel = document.querySelector('.result-panel');
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${resultKindLabel(result)}排盘导出</title>
  <style>${collectPageStyles()}</style>
</head>
<body>
  <main class="app-shell export-shell">
    <header class="site-header">
      <div>
        <h1>${resultKindLabel(result)}排盘导出</h1>
        <p>导出时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
    </header>
    ${panel?.outerHTML ?? `<pre>${JSON.stringify(result, null, 2)}</pre>`}
  </main>
</body>
</html>`;
  downloadText(`${resultFilePrefix(result)}.html`, 'text/html;charset=utf-8', html);
}

function exportResultJson(result: AppResult) {
  downloadText(`${resultFilePrefix(result)}.json`, 'application/json;charset=utf-8', JSON.stringify(result, null, 2));
}

function ExportBar({ result }: { result: AppResult }) {
  return (
    <section className="surface export-bar">
      <div>
        <strong>导出当前结果</strong>
        <span>保存右侧这一页或原始 JSON</span>
      </div>
      <div className="export-actions">
        <button className="secondary-button" type="button" onClick={() => exportResultPage(result)}>
          <Download size={16} aria-hidden="true" />
          导出页面
        </button>
        <button className="secondary-button" type="button" onClick={() => exportResultJson(result)}>
          <FileJson size={16} aria-hidden="true" />
          导出 JSON
        </button>
      </div>
    </section>
  );
}

function HexagramView({ title, hexagram }: { title: string; hexagram: Hexagram }) {
  return (
    <article className="sub-card hexagram-card">
      <div className="card-head">
        <span>{title}</span>
        <strong>{hexagram.name}</strong>
      </div>
      <div className="hexagram-lines" aria-label={hexagram.name}>
        {[...hexagram.lines].reverse().map((line) => (
          <div className="yao-line" key={line.position}>
            <span>{line.display}</span>
            <small>
              {line.position}
              {line.moving ? ' 动' : ''}
            </small>
          </div>
        ))}
      </div>
      <dl>
        <div>
          <dt>序号</dt>
          <dd>{hexagram.number}</dd>
        </div>
        <div>
          <dt>上卦</dt>
          <dd>{hexagram.upper_trigram}</dd>
        </div>
        <div>
          <dt>下卦</dt>
          <dd>{hexagram.lower_trigram}</dd>
        </div>
      </dl>
    </article>
  );
}

function LiuYaoView({ result }: { result: LiuYaoResult }) {
  const meta = result.meta ?? { mode: result.input.method, algorithmVersion: 'liuyao-legacy' };
  const wuxing = result.wuxing ?? {
    base_upper_trigram: result.base_hexagram.upper_trigram,
    base_lower_trigram: result.base_hexagram.lower_trigram,
    changed_upper_trigram: result.changed_hexagram.upper_trigram,
    changed_lower_trigram: result.changed_hexagram.lower_trigram,
    base_element: '未计算',
    changed_element: '未计算',
    relation: '比和',
    relation_arrow: '未计算',
    direction: 'same',
  };
  const interpretation = result.interpretation ?? {
    movement_pattern: result.moving_lines.length ? '动卦' : '静卦',
    same_hexagram: result.base_hexagram.number === result.changed_hexagram.number,
    wuxing_summary: wuxing.relation_arrow,
    yin_yang_ratio: {
      yin: result.base_hexagram.lines.filter((line) => line.polarity === 'yin').length,
      yang: result.base_hexagram.lines.filter((line) => line.polarity === 'yang').length,
      moving: result.moving_lines.length,
    },
    notes: ['旧版六爻记录未包含 Milestone 12 解释层。'],
  };
  const modeLabel = meta.mode === 'time' ? '时间起卦' : meta.mode === 'number' ? '数字起卦' : '手动起卦';
  return (
    <>
      <SummaryCard
        title="摘要"
        items={[
          { label: '起卦方式', value: modeLabel },
          { label: '本卦', value: result.base_hexagram.name },
          { label: '变卦', value: result.changed_hexagram.name },
          { label: '动爻', value: result.moving_lines.length ? result.moving_lines.join('、') : '无' },
          { label: '五行关系', value: wuxing.relation_arrow },
          { label: '算法版本', value: meta.algorithmVersion },
        ]}
      />
      <section className="surface result-section">
        <div className="section-title">
          <h2>六爻盘</h2>
          <span>{modeLabel} · 自下而上</span>
        </div>
        <div className="hexagram-grid">
          <HexagramView title="本卦" hexagram={result.base_hexagram} />
          <HexagramView title="变卦" hexagram={result.changed_hexagram} />
        </div>
      </section>
      <section className="surface result-section">
        <div className="section-title">
          <h2>五行关系</h2>
          <span>{wuxing.relation}</span>
        </div>
        <div className="interpretation-grid">
          <div className="inference-card">
            <span>本卦五行</span>
            <strong>
              {wuxing.base_upper_trigram} / {wuxing.base_element}
            </strong>
          </div>
          <div className="inference-card">
            <span>变卦五行</span>
            <strong>
              {wuxing.changed_upper_trigram} / {wuxing.changed_element}
            </strong>
          </div>
          <div className="inference-card wide">
            <span>生克箭头</span>
            <strong>{wuxing.relation_arrow}</strong>
          </div>
        </div>
      </section>
      <section className="surface result-section">
        <div className="section-title">
          <h2>基础解释</h2>
          <span>{interpretation.movement_pattern}</span>
        </div>
        <div className="interpretation-grid">
          <div className="inference-card">
            <span>本变关系</span>
            <strong>{interpretation.same_hexagram ? '本变同卦' : '本卦变卦不同'}</strong>
          </div>
          <div className="inference-card">
            <span>阴阳比例</span>
            <strong>
              阴 {interpretation.yin_yang_ratio.yin} / 阳 {interpretation.yin_yang_ratio.yang}
            </strong>
          </div>
          <div className="inference-card wide">
            <span>规则说明</span>
            <p>{interpretation.notes.join('；')}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function TimingView({ timing }: { timing?: TimingAnalysis }) {
  if (!timing) return null;
  return (
    <section className="surface result-section">
      <div className="section-title">
        <h2>应期</h2>
        <span>候选窗口</span>
      </div>
      <div className="timing-grid">
        {timing.timing_windows.map((item) => (
          <article className="timing-card" key={`${item.label}-${item.window}`}>
            <div>
              <span>{item.label}</span>
              <strong>{item.window}</strong>
            </div>
            <p>{item.suggestion}</p>
            <small>置信度：{item.confidence}</small>
            <ul>
              {item.basis.map((basis) => (
                <li key={basis}>{basis}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function DaliurenView({ result }: { result: LiurenResult }) {
  const wuxing = result.wuxing_relations;
  const askerProfile = result.asker_profile;
  const questionContext = result.question_context;
  const palaceStyle = (index: number) =>
    ({
      '--angle': `${-90 + index * 30}deg`,
    }) as CSSProperties;

  return (
    <>
      <SummaryCard
        title="摘要"
        items={[
          { label: '四柱', value: `${result.four_pillars.year} ${result.four_pillars.month} ${result.four_pillars.day} ${result.four_pillars.hour}` },
          { label: '旬空', value: result.xunkong.join('、') },
          { label: '月将', value: `${result.month_general.branch} · ${result.month_general.source_qi}` },
        ]}
      />
      <section className="surface result-section">
        <div className="section-title">
          <h2>天地盘</h2>
          <span>{result.three_transmissions.gate || '未定'} · {result.three_transmissions.variant || '无取法'}</span>
        </div>
        <div className="palace-visuals">
          <div className="twelve-disk" aria-label="十二宫圆盘">
            <div className="disk-center">
              <span>月将</span>
              <strong>{result.month_general.branch}</strong>
            </div>
            {result.tian_di_pan.map((item, index) => (
              <div className="disk-palace" style={palaceStyle(index)} key={item.earth}>
                <span>{item.heaven}</span>
                <strong>{item.earth}</strong>
              </div>
            ))}
          </div>
          <div className="plate-grid" aria-label="十二宫方盘">
            {result.tian_di_pan.map((item) => (
              <div className="plate-cell" key={item.earth}>
                <span>{item.heaven}</span>
                <strong>{item.earth}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="surface result-section">
        <div className="section-title">
          <h2>四课 / 三传</h2>
        </div>
        <div className="lesson-grid">
          {result.four_lessons.items.map((lesson) => (
            <div className="sub-card lesson-card" key={lesson.label}>
              <span>{lesson.label}</span>
              <strong>
                {lesson.upper} / {lesson.lower}
              </strong>
              <small>
                {lesson.relation} · {lesson.upper_element}
                {lesson.lower_element}
              </small>
            </div>
          ))}
        </div>
        <div className="transmission-grid">
          {result.three_transmissions.items.map((item) => (
            <div className="sub-card transmission-card" key={item.stage}>
              <span>{item.stage}</span>
              <strong>{item.branch}</strong>
            </div>
          ))}
        </div>
      </section>
      {wuxing ? (
        <section className="surface result-section">
          <div className="section-title">
            <h2>五行关系</h2>
            <span>{wuxing.overall_pattern}</span>
          </div>
          <div className="wuxing-overview">
            <div className="wuxing-flow" aria-label="能量流向">
              <GitBranch size={18} aria-hidden="true" />
              <strong>{wuxing.energy_flow}</strong>
            </div>
            <div className="wuxing-trend">
              <span>初传对日干</span>
              <strong>{wuxing.initial_relation_to_daymaster}</strong>
            </div>
            <div className="wuxing-trend">
              <span>中传对初传</span>
              <strong>{wuxing.middle_relation_to_initial}</strong>
            </div>
            <div className="wuxing-trend">
              <span>末传对中传</span>
              <strong>{wuxing.final_relation_to_middle}</strong>
            </div>
          </div>
          <div className="wuxing-arrow-grid">
            {wuxing.transmission_relations.map((item) => (
              <div className="wuxing-arrow" key={`${item.from_label}-${item.to_label}`}>
                <span>
                  {item.from_label} {item.from_element}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
                <strong>{item.relation}</strong>
                <ArrowRight size={16} aria-hidden="true" />
                <span>
                  {item.to_label} {item.to_element}
                </span>
              </div>
            ))}
            {wuxing.transmissions_to_daymaster.map((item) => (
              <div className="wuxing-arrow" key={`${item.stage}-daymaster`}>
                <span>
                  {item.stage} {item.element}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
                <strong>{item.relation}</strong>
                <ArrowRight size={16} aria-hidden="true" />
                <span>
                  日干 {wuxing.daymaster_element}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <TimingView timing={result.timing} />
      {questionContext ? (
        <section className="surface result-section">
          <div className="section-title">
            <h2>问题语义</h2>
            <span>
              {questionContext.category_label} · {questionContext.intent_label}
            </span>
          </div>
          <div className="question-context-grid">
            <div className="inference-card">
              <span>类神关注</span>
              <strong>{questionContext.class_spirit}</strong>
            </div>
            <div className="inference-card">
              <span>关注点</span>
              <strong>{questionContext.focus_points.join('、')}</strong>
            </div>
            <div className="inference-card">
              <span>有利信号</span>
              <p>{questionContext.favorable_signals.join('；')}</p>
            </div>
            <div className="inference-card">
              <span>风险信号</span>
              <p>{questionContext.risk_signals.join('；')}</p>
            </div>
            <div className="inference-card">
              <span>建议行动</span>
              <p>{questionContext.suggested_action}</p>
            </div>
            <div className="inference-card">
              <span>避免行动</span>
              <p>{questionContext.avoid_action}</p>
            </div>
          </div>
        </section>
      ) : null}
      {askerProfile ? (
        <section className="surface result-section">
          <div className="section-title">
            <h2>提问者画像</h2>
            <span>{askerProfile.chart_bias}</span>
          </div>
          <div className="profile-result-grid">
            <div className="inference-card">
              <span>日主</span>
              <strong>{askerProfile.asker_daymaster}</strong>
            </div>
            <div className="inference-card">
              <span>提问者偏性</span>
              <strong>{askerProfile.asker_bias}</strong>
            </div>
            <div className="inference-card">
              <span>课局影响</span>
              <strong>{askerProfile.impact}</strong>
            </div>
            <div className="inference-card wide">
              <span>建议</span>
              <p>{askerProfile.advice}</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function XiaoLiurenView({ result }: { result: XiaoLiurenMilestone2Result }) {
  return (
    <>
      <SummaryCard
        title="摘要"
        items={[
          { label: '最终宫位', value: result.final_palace },
          { label: '吉凶', value: result.interpretation.polarity },
          { label: '关键词', value: result.interpretation.keywords.join('、') },
        ]}
      />
      <section className="surface result-section">
        <div className="section-title">
          <h2>小六壬排盘</h2>
          <span>{result.input.method === 'time' ? '时间起课' : '手动农历月日时'}</span>
        </div>
        <div className="palace-order">
          {result.palace_order.map((palace) => (
            <div className={palace === result.final_palace ? 'palace-pill active' : 'palace-pill'} key={palace}>
              {palace}
            </div>
          ))}
        </div>
        <div className="step-grid">
          {result.steps.map((step, index) => (
            <article className="sub-card step-card" key={step.step}>
              <span>{step.step === 'month' ? '月' : step.step === 'day' ? '日' : '时'}</span>
              <strong>{step.label}</strong>
              <p>{step.rule}</p>
              <div>
                {step.start_palace} → {step.result_palace}
              </div>
            </article>
          ))}
        </div>
      </section>
      <TimingView timing={result.timing} />
      <section className="surface result-section">
        <div className="section-title">
          <h2>基础推断</h2>
          <span>{result.interpretation.palace} · {result.interpretation.polarity}</span>
        </div>
        <div className="interpretation-grid">
          <div className="inference-card">
            <span>关键词</span>
            <strong>{result.interpretation.keywords.join('、')}</strong>
          </div>
          <div className="inference-card wide">
            <span>总述</span>
            <p>{result.interpretation.summary}</p>
          </div>
          <div className="inference-card">
            <span>事情进展</span>
            <p>{result.interpretation.progress}</p>
          </div>
          <div className="inference-card">
            <span>人际 / 口舌</span>
            <p>{result.interpretation.relationship}</p>
          </div>
          <div className="inference-card">
            <span>财务 / 资源</span>
            <p>{result.interpretation.resource}</p>
          </div>
          <div className="inference-card">
            <span>行动建议</span>
            <p>{result.interpretation.action_advice}</p>
          </div>
          <div className="inference-card wide">
            <span>风险提醒</span>
            <p>{result.interpretation.risk}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyState({ liurenMode }: { liurenMode: LiurenMode }) {
  const label = liurenMode === 'xiaoliuren' ? '小六壬' : '排盘';
  return (
    <section className="surface empty-state">
      <Braces size={30} aria-hidden="true" />
      <div>
        <h2>等待生成{label}</h2>
        <p>填写左侧表单后，结果会在这里以结构化卡片展示。</p>
      </div>
    </section>
  );
}

export function ResultPanel({ result, liurenMode }: ResultPanelProps) {
  if (!result) return <EmptyState liurenMode={liurenMode} />;

  return (
    <section className="result-panel">
      <ExportBar result={result} />
      {result.type === 'liu_yao' ? (
        <LiuYaoView result={result} />
      ) : result.type === 'xiao_liuren' ? (
        <XiaoLiurenView result={result} />
      ) : (
        <DaliurenView result={result} />
      )}
      <section className="surface result-section">
        <div className="section-title">
          <h2>Debug Trace</h2>
        </div>
        <pre className="trace">{result.debug_trace.join('\n')}</pre>
      </section>
      <JsonViewer data={result} />
    </section>
  );
}
