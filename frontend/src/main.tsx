import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Braces, CalendarDays, CheckCircle2, RefreshCw, Send, XCircle } from 'lucide-react';
import './styles.css';

type ChartMode = 'liuyao' | 'liuren';

type HealthState = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  message: string;
};

type LineState = {
  position: number;
  value: number;
  polarity: 'yin' | 'yang';
  moving: boolean;
  display: string;
};

type Hexagram = {
  number: number;
  name: string;
  upper_trigram: string;
  lower_trigram: string;
  lines: LineState[];
};

type LiuYaoResult = {
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

type LiurenResult = {
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
    status: 'reserved';
    items: unknown[];
  };
  three_transmissions: {
    status: 'reserved';
    items: unknown[];
  };
  debug_trace: string[];
};

type ChartResult = LiuYaoResult | LiurenResult;

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

function HealthBadge({ health, onRefresh }: { health: HealthState; onRefresh: () => void }) {
  return (
    <button className={`health health-${health.status}`} type="button" onClick={onRefresh} title="检查后端连接">
      {health.status === 'ok' && <CheckCircle2 size={18} aria-hidden="true" />}
      {health.status === 'error' && <XCircle size={18} aria-hidden="true" />}
      {health.status !== 'ok' && health.status !== 'error' && <RefreshCw className={health.status === 'loading' ? 'spin' : ''} size={18} aria-hidden="true" />}
      <span>{health.message}</span>
    </button>
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
            <small>{line.position}{line.moving ? ' 动' : ''}</small>
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
  const [submitting, setSubmitting] = useState(false);

  async function submitManual(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/liuyao/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_lines: manualLines }),
      });
      if (!response.ok) throw new Error(await response.text());
      onResult((await response.json()) as LiuYaoResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitManual}>
      <div className="line-grid">
        {manualLines.map((line, index) => (
          <label className="line-select" key={index}>
            <span>第 {index + 1} 爻</span>
            <select value={line} onChange={(event) => setManualLines(manualLines.map((value, valueIndex) => (valueIndex === index ? Number(event.target.value) : value)))}>
              {LINE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
            <small>{LINE_OPTIONS.find((option) => option.value === line)?.hint}</small>
          </label>
        ))}
      </div>
      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? <RefreshCw className="spin" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
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
  const [submitting, setSubmitting] = useState(false);

  async function submitLiuren(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/liuren/basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_time: questionTime, timezone }),
      });
      if (!response.ok) throw new Error(await response.text());
      onResult((await response.json()) as LiurenResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
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
      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? <RefreshCw className="spin" size={18} aria-hidden="true" /> : <CalendarDays size={18} aria-hidden="true" />}
        生成大六壬基础盘
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
          <strong>{result.month_general.branch} · {result.month_general.source_qi}</strong>
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
      <div className="summary">
        <div>
          <span>四课</span>
          <strong>{result.four_lessons.status}</strong>
        </div>
        <div>
          <span>三传</span>
          <strong>{result.three_transmissions.status}</strong>
        </div>
      </div>
    </>
  );
}

function ResultPanel({ result }: { result: ChartResult | null }) {
  const json = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);
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
        <h2>原始 JSON</h2>
        <pre className="json">{json}</pre>
      </section>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<ChartMode>('liuren');
  const [health, setHealth] = useState<HealthState>({
    status: 'idle',
    message: '未检查',
  });
  const [result, setResult] = useState<ChartResult | null>(null);

  async function checkHealth() {
    setHealth({ status: 'loading', message: '检查中' });
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { status: string };
      setHealth({ status: 'ok', message: data.status });
    } catch (caught) {
      setHealth({ status: 'error', message: caught instanceof Error ? caught.message : String(caught) });
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 2</p>
          <h1>排盘 MVP</h1>
          <p>六爻手动 MVP 与大六壬基础盘；不做断语。</p>
        </div>
        <HealthBadge health={health} onRefresh={() => void checkHealth()} />
      </header>

      <div className="layout">
        <section className="panel input-panel">
          <div className="tabs">
            <button type="button" className={mode === 'liuren' ? 'active' : ''} onClick={() => setMode('liuren')}>大六壬</button>
            <button type="button" className={mode === 'liuyao' ? 'active' : ''} onClick={() => setMode('liuyao')}>六爻</button>
          </div>
          <div className="panel-title">
            <strong>{mode === 'liuren' ? '大六壬基础盘' : '手动六爻'}</strong>
            <span>{mode === 'liuren' ? '四课三传预留' : '从初爻到上爻'}</span>
          </div>
          {mode === 'liuren' ? <LiurenForm onResult={setResult} /> : <LiuYaoForm onResult={setResult} />}
        </section>

        <section className="panel result-panel">
          <ResultPanel result={result} />
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
