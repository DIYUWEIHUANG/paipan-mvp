import { Braces } from 'lucide-react';
import type { ChartResult, Hexagram, LiurenResult, LiuYaoResult } from '../calculators';
import { JsonViewer } from './JsonViewer';
import { SummaryCard } from './SummaryCard';

type ResultPanelProps = {
  result: ChartResult | null;
};

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
  return (
    <>
      <SummaryCard
        title="摘要"
        items={[
          { label: '本卦', value: result.base_hexagram.name },
          { label: '变卦', value: result.changed_hexagram.name },
          { label: '动爻', value: result.moving_lines.length ? result.moving_lines.join('、') : '无' },
        ]}
      />
      <section className="surface result-section">
        <div className="section-title">
          <h2>六爻盘</h2>
          <span>自下而上输入</span>
        </div>
        <div className="hexagram-grid">
          <HexagramView title="本卦" hexagram={result.base_hexagram} />
          <HexagramView title="变卦" hexagram={result.changed_hexagram} />
        </div>
      </section>
    </>
  );
}

function LiurenView({ result }: { result: LiurenResult }) {
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
        <div className="plate-grid">
          {result.tian_di_pan.map((item) => (
            <div className="plate-cell" key={item.earth}>
              <span>{item.heaven}</span>
              <strong>{item.earth}</strong>
            </div>
          ))}
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
    </>
  );
}

function EmptyState() {
  return (
    <section className="surface empty-state">
      <Braces size={30} aria-hidden="true" />
      <div>
        <h2>等待生成排盘</h2>
        <p>填写左侧表单后，结果会在这里以结构化卡片展示。</p>
      </div>
    </section>
  );
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) return <EmptyState />;

  return (
    <section className="result-panel">
      {result.type === 'liu_yao' ? <LiuYaoView result={result} /> : <LiurenView result={result} />}
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
