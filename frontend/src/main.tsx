import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Braces, CheckCircle2, RefreshCw, Send, XCircle } from 'lucide-react';
import './styles.css';

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

const LINE_OPTIONS = [
  { value: 6, label: '6 老阴', hint: '阴动' },
  { value: 7, label: '7 少阳', hint: '阳静' },
  { value: 8, label: '8 少阴', hint: '阴静' },
  { value: 9, label: '9 老阳', hint: '阳动' },
];

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

function App() {
  const [health, setHealth] = useState<HealthState>({
    status: 'idle',
    message: '未检查',
  });
  const [manualLines, setManualLines] = useState([7, 8, 7, 8, 7, 8]);
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const json = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);

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
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setResult((await response.json()) as LiuYaoResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 1</p>
          <h1>六爻 MVP</h1>
          <p>手动输入六爻，只输出本卦、变卦和动爻。</p>
        </div>
        <HealthBadge health={health} onRefresh={() => void checkHealth()} />
      </header>

      <div className="layout">
        <section className="panel input-panel">
          <div className="panel-title">
            <strong>手动六爻</strong>
            <span>从初爻到上爻</span>
          </div>
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
        </section>

        <section className="panel result-panel">
          {!result ? (
            <div className="empty">
              <Braces size={30} aria-hidden="true" />
              <p>提交后显示本卦、变卦、动爻和原始 JSON。</p>
            </div>
          ) : (
            <div className="result-stack">
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
              <section>
                <h2>Debug Trace</h2>
                <pre className="trace">{result.debug_trace.join('\n')}</pre>
              </section>
              <section>
                <h2>原始 JSON</h2>
                <pre className="json">{json}</pre>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
