import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import './styles.css';

type HealthState = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  message: string;
};

function App() {
  const [health, setHealth] = useState<HealthState>({
    status: 'idle',
    message: '尚未检查后端连接',
  });

  async function checkHealth() {
    setHealth({ status: 'loading', message: '正在连接 /api/health' });
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { status: string };
      setHealth({ status: 'ok', message: `后端返回：${data.status}` });
    } catch (error) {
      setHealth({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <main className="app">
      <section className="shell">
        <header>
          <div>
            <p className="eyebrow">Milestone 0</p>
            <h1>术数排盘 Web MVP</h1>
            <p>当前只搭项目骨架，确认 Vite React 前端可以调用 FastAPI 后端。</p>
          </div>
          <Activity size={32} aria-hidden="true" />
        </header>

        <div className={`status status-${health.status}`}>
          {health.status === 'ok' && <CheckCircle2 size={22} aria-hidden="true" />}
          {health.status === 'error' && <XCircle size={22} aria-hidden="true" />}
          {health.status !== 'ok' && health.status !== 'error' && <RefreshCw className={health.status === 'loading' ? 'spin' : ''} size={22} aria-hidden="true" />}
          <div>
            <strong>后端健康检查</strong>
            <span>{health.message}</span>
          </div>
        </div>

        <div className="milestones">
          <div className="milestone active">
            <strong>0</strong>
            <span>骨架与健康检查</span>
          </div>
          <div className="milestone">
            <strong>1</strong>
            <span>六爻手动 MVP</span>
          </div>
          <div className="milestone">
            <strong>2</strong>
            <span>大六壬基础盘</span>
          </div>
          <div className="milestone">
            <strong>3</strong>
            <span>九宗门三传</span>
          </div>
          <div className="milestone">
            <strong>4</strong>
            <span>可视化与保存</span>
          </div>
        </div>

        <button type="button" onClick={() => void checkHealth()}>
          <RefreshCw size={18} aria-hidden="true" />
          重新检查
        </button>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
