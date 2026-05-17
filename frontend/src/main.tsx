import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Braces, CalendarDays, CheckCircle2, Copy, RefreshCw, Send } from 'lucide-react';
import {
  calculateLiurenV1,
  calculateManualLiuyao,
  type ChartMode,
  type ChartResult,
  type Hexagram,
  type LiurenResult,
  type LiuYaoResult,
} from './calculators';
import './styles.css';

const LINE_OPTIONS = [
  { value: 6, label: '6 老阴', hint: '阴动' },
  { value: 7, label: '7 少阳', hint: '阳静' },
  { value: 8, label: '8 少阴', hint: '阴静' },
  { value: 9, label: '9 老阳', hint: '阳动' },
];

function localDateTimeInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function StatusBadge() {
  return (
    <div className="health health-ok" title="纯前端静态版本，可部署到 GitHub Pages">
      <CheckCircle2 size={18} aria-hidden="true" />
      <span>静态网页</span>
    </div>
  );
}

function HexagramView({ title, hexagram }: { title: string; hexagram: Hexagram }) {
  return (
    <section className="hexagram-card">
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
    </section>
  );
}

function LiuYaoForm({ onResult }: { onResult: (result: ChartResult) => void }) {
  const [manualLines, setManualLines] = useState([7, 8, 7, 8, 7, 8]);
  const [error, setError] = useState('');

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      onResult(calculateManualLiuyao(manualLines));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <form onSubmit={submitManual}>
      <div className="line-grid">
        {manualLines.map((line, index) => (
          <label className="line-select" key={index}>
            <span>第 {index + 1} 爻</span>
            <select
              value={line}
              onChange={(event) => setManualLines(manualLines.map((value, valueIndex) => (valueIndex === index ? Number(event.target.value) : value)))}
            >
              {LINE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>{LINE_OPTIONS.find((option) => option.value === line)?.hint}</small>
          </label>
        ))}
      </div>
      <button className="primary" type="submit">
        <Send size={18} aria-hidden="true" />
        生成六爻盘
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function LiurenForm({ onResult }: { onResult: (result: ChartResult) => void }) {
  const [questionTime, setQuestionTime] = useState(localDateTimeInput());
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [error, setError] = useState('');

  function submitLiuren(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      onResult(calculateLiurenV1(questionTime, timezone));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <form onSubmit={submitLiuren}>
      <label className="field">
        <span>问事时间</span>
        <input type="datetime-local" value={questionTime} onChange={(event) => setQuestionTime(event.target.value)} required />
      </label>
      <label className="field">
        <span>时区</span>
        <input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
      </label>
      <button className="primary" type="submit">
        <CalendarDays size={18} aria-hidden="true" />
        生成大六壬 V1
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function LiuYaoResultView({ result }: { result: LiuYaoResult }) {
  return (
    <>
      <div className="summary">
        <div>
          <span>动爻</span>
          <strong>{result.moving_lines.length ? result.moving_lines.join('、') : '无'}</strong>
        </div>
        <div>
          <span>输入顺序</span>
          <strong>自下而上</strong>
        </div>
      </div>
      <div className="hexagram-grid">
        <HexagramView title="本卦" hexagram={result.base_hexagram} />
        <HexagramView title="变卦" hexagram={result.changed_hexagram} />
      </div>
    </>
  );
}

function LiurenResultView({ result }: { result: LiurenResult }) {
  return (
    <>
      <div className="summary">
        <div>
          <span>宗门</span>
          <strong>{result.three_transmissions.gate || result.three_transmissions.status}</strong>
        </div>
        <div>
          <span>取法</span>
          <strong>{result.three_transmissions.variant || '-'}</strong>
        </div>
      </div>
      <div className="summary four">
        <div>
          <span>年柱</span>
          <strong>{result.four_pillars.year}</strong>
        </div>
        <div>
          <span>月柱</span>
          <strong>{result.four_pillars.month}</strong>
        </div>
        <div>
          <span>日柱</span>
          <strong>{result.four_pillars.day}</strong>
        </div>
        <div>
          <span>时柱</span>
          <strong>{result.four_pillars.hour}</strong>
        </div>
      </div>
      <div className="summary">
        <div>
          <span>旬空</span>
          <strong>{result.xunkong.join('、')}</strong>
        </div>
        <div>
          <span>月将</span>
          <strong>
            {result.month_general.branch} · {result.month_general.source_qi}
          </strong>
        </div>
      </div>
      <section>
        <h2>天地盘</h2>
        <div className="plate-grid">
          {result.tian_di_pan.map((item) => (
            <div className="plate-cell" key={item.earth}>
              <span>{item.heaven}</span>
              <strong>{item.earth}</strong>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>四课</h2>
        <div className="lesson-grid">
          {result.four_lessons.items.map((lesson) => (
            <div className="lesson-card" key={lesson.label}>
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
      </section>
      <section>
        <h2>三传</h2>
        <div className="transmission-grid">
          {result.three_transmissions.items.map((item) => (
            <div className="transmission-card" key={item.stage}>
              <span>{item.stage}</span>
              <strong>{item.branch}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ResultPanel({ result }: { result: ChartResult | null }) {
  const json = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);

  async function copyJson() {
    if (!json) return;
    await navigator.clipboard.writeText(json);
  }

  if (!result) {
    return (
      <div className="empty">
        <Braces size={30} aria-hidden="true" />
        <p>提交后显示排盘结果和原始 JSON。</p>
      </div>
    );
  }

  return (
    <div className="result-stack">
      {result.type === 'liu_yao' ? <LiuYaoResultView result={result} /> : <LiurenResultView result={result} />}
      <section>
        <h2>Debug Trace</h2>
        <pre className="trace">{result.debug_trace.join('\n')}</pre>
      </section>
      <section>
        <div className="section-head">
          <h2>原始 JSON</h2>
          <button className="icon-button" type="button" onClick={() => void copyJson()} title="复制 JSON">
            <Copy size={16} aria-hidden="true" />
          </button>
        </div>
        <pre className="json">{json}</pre>
      </section>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<ChartMode>('liuren');
  const [result, setResult] = useState<ChartResult | null>(null);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 3 · Browser Edition</p>
          <h1>术数排盘 MVP</h1>
          <p>六爻手动 MVP 与大六壬 V1；仅排盘展示，不做断语。</p>
        </div>
        <StatusBadge />
      </header>

      <div className="layout">
        <section className="panel input-panel">
          <div className="tabs">
            <button type="button" className={mode === 'liuren' ? 'active' : ''} onClick={() => setMode('liuren')}>
              大六壬
            </button>
            <button type="button" className={mode === 'liuyao' ? 'active' : ''} onClick={() => setMode('liuyao')}>
              六爻
            </button>
          </div>
          <div className="panel-title">
            <strong>{mode === 'liuren' ? '大六壬 V1' : '手动六爻'}</strong>
            <span>{mode === 'liuren' ? '九宗门三传' : '初爻到上爻'}</span>
          </div>
          {mode === 'liuren' ? <LiurenForm onResult={setResult} /> : <LiuYaoForm onResult={setResult} />}
        </section>

        <section className="panel result-panel">
          <ResultPanel result={result} />
        </section>
      </div>

      <footer>
        <RefreshCw size={14} aria-hidden="true" />
        <span>所有计算在浏览器内完成，适合静态托管和链接分享。</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
