import React, { useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import type { AppMode, AppResult } from '../appTypes';
import { calculateLiurenV1, calculateManualLiuyao } from '../calculators';
import { XIAOLIUREN_HOUR_BRANCHES, type XiaoLiurenMethod } from '../engines/xiaoliuren';
import { calculateXiaoLiurenMilestone2 } from '../features/xiaoliuren';

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
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onResult: (result: AppResult) => void;
  onClear: () => void;
};

export function InputPanel({ mode, onModeChange, onResult, onClear }: InputPanelProps) {
  const [questionTime, setQuestionTime] = useState(localDateTimeInput());
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [questionText, setQuestionText] = useState('');
  const [manualLines, setManualLines] = useState([7, 8, 7, 8, 7, 8]);
  const [xiaoMethod, setXiaoMethod] = useState<XiaoLiurenMethod>('time');
  const [manualLunarMonth, setManualLunarMonth] = useState(1);
  const [manualLunarDay, setManualLunarDay] = useState(1);
  const [manualHourBranch, setManualHourBranch] = useState('子');
  const [error, setError] = useState('');

  function clearForm() {
    setQuestionTime(localDateTimeInput());
    setTimezone('Asia/Shanghai');
    setQuestionText('');
    setManualLines([7, 8, 7, 8, 7, 8]);
    setXiaoMethod('time');
    setManualLunarMonth(1);
    setManualLunarDay(1);
    setManualHourBranch('子');
    setError('');
    onClear();
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result =
        mode === 'liuren'
          ? calculateLiurenV1(questionTime, timezone)
          : mode === 'liuyao'
            ? calculateManualLiuyao(manualLines)
            : calculateXiaoLiurenMilestone2(
                xiaoMethod === 'time'
                  ? { method: 'time', questionTime, timezone, questionText }
                  : {
                      method: 'manual',
                      timezone,
                      questionText,
                      lunarMonth: manualLunarMonth,
                      lunarDay: manualLunarDay,
                      hourBranch: manualHourBranch,
                    },
              );
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
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'xiaoliuren'}
          className={mode === 'xiaoliuren' ? 'active' : ''}
          onClick={() => onModeChange('xiaoliuren')}
        >
          小六壬
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
        ) : mode === 'liuyao' ? (
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
        ) : (
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
              <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={4} placeholder="可选，用于记录起课问题。" />
            </label>
            <div className="method-toggle" role="radiogroup" aria-label="小六壬起课方式">
              <button type="button" className={xiaoMethod === 'time' ? 'active' : ''} onClick={() => setXiaoMethod('time')}>
                时间起课
              </button>
              <button type="button" className={xiaoMethod === 'manual' ? 'active' : ''} onClick={() => setXiaoMethod('manual')}>
                手动农历月日时
              </button>
            </div>
            {xiaoMethod === 'manual' && (
              <>
                <div className="form-grid two">
                  <label className="field">
                    <span>农历月</span>
                    <input type="number" min={1} max={12} value={manualLunarMonth} onChange={(event) => setManualLunarMonth(Number(event.target.value))} required />
                  </label>
                  <label className="field">
                    <span>农历日</span>
                    <input type="number" min={1} max={30} value={manualLunarDay} onChange={(event) => setManualLunarDay(Number(event.target.value))} required />
                  </label>
                </div>
                <label className="field">
                  <span>时辰</span>
                  <select value={manualHourBranch} onChange={(event) => setManualHourBranch(event.target.value)}>
                    {XIAOLIUREN_HOUR_BRANCHES.map((branch) => (
                      <option value={branch} key={branch}>
                        {branch}时
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </>
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
