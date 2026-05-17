import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ChartMode, ChartResult } from './calculators';
import { InputPanel } from './components/InputPanel';
import { Layout } from './components/Layout';
import { ResultPanel } from './components/ResultPanel';
import './styles.css';

function App() {
  const [mode, setMode] = useState<ChartMode>('liuren');
  const [result, setResult] = useState<ChartResult | null>(null);

  return (
    <Layout>
      <InputPanel mode={mode} onModeChange={setMode} onResult={setResult} onClear={() => setResult(null)} />
      <ResultPanel result={result} />
    </Layout>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
