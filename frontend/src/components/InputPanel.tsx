import React, { useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import { calculateLiurenV1, calculateManualLiuyao, type ChartMode, type ChartResult } from '../calculators';

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

type InputPanelProps = {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  onResult: (result: ChartResult) => void;
  onClear: () => void;
};

export function InputPanel({ mode, onModeChange, onResult, onClear }: InputPanelProps) {
  const [questionTime, setQuestionTime] = useState(localDateTimeInput());
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [questionText, setQuestionText] = useState('');
  const [manualLines, setManualLines] = useState([7, 8, 7, 8, 7, 8]);
  const [error, setError] = useState('');

  function clearForm() {
    setQuestionTime(localDateTimeInput());
    setTimezone('Asia/Shanghai');
    setQuestionText('');
    setManualLines([7, 8, 7, 8, 7, 8]);
    setError('');
    onClear();
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = mode === 'liuren' ? calculateLiurenV1(questionTime, timezone) : calculateManualLiuyao(manualLines);
      onResult(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <aside className="surface input-panel">
      <div className="tabs" role="tablist" aria-label="排盘类型">
        <button type="button" role="tab" aria-selected={mode === 'liuren'} className={mode === 'liuren' ? 'active' : ''} onClick={() => onModeChange('liuren')}>
          大六壬
        </button>
        <button type="button" role="tab" aria-selected={mode === 'liuyao'} className={mode === 'liuyao' ? 'active' : ''} onClick={() => onModeChange('liuyao')}>
          六爻
        </button>
      </div>

      <form onSubmit={submitForm}>
        {mode === 'liuren' ? (
          <>
            <label className="field">
              <span>日期时间</span>
              <input type="datetime-local" value={questionTime} onChange={(event) => setQuestionTime(event.target.value)} required />
            </label>
            <label className="field">
              <span>时区</span>
              <input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
            </label>
            <label className="field">
              <span>问题文本</span>
              <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={4} placeholder="可选，仅用于记录问题，不参与排盘计算。" />
            </label>
          </>
        ) : (
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
        )}

        <div className="button-row">
          <button className="primary-button" type="submit">
            <Send size={17} aria-hidden="true" />
            生成排盘
          </button>
          <button className="secondary-button" type="button" onClick={clearForm}>
            <RotateCcw size={16} aria-hidden="true" />
            清空
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </aside>
  );
}
