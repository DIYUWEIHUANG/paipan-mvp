import React, { useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import type { AppMode, AppResult, LiurenMode } from '../appTypes';
import { calculateLiurenV1, calculateManualLiuyao, type AskerGender, type QuestionCategory, type QuestionIntent } from '../calculators';
import { XIAOLIUREN_HOUR_BRANCHES, type XiaoLiurenMethod } from '../engines/xiaoliuren';
import { calculateXiaoLiurenMilestone2 } from '../features/xiaoliuren';

const LINE_OPTIONS = [
  { value: 6, label: '6 老阴', hint: '阴动' },
  { value: 7, label: '7 少阳', hint: '阳静' },
  { value: 8, label: '8 少阴', hint: '阴静' },
  { value: 9, label: '9 老阳', hint: '阳动' },
];

const DAYMASTER_OPTIONS = [
  { value: '', label: '自动/不填' },
  { value: '甲', label: '甲木' },
  { value: '乙', label: '乙木' },
  { value: '丙', label: '丙火' },
  { value: '丁', label: '丁火' },
  { value: '戊', label: '戊土' },
  { value: '己', label: '己土' },
  { value: '庚', label: '庚金' },
  { value: '辛', label: '辛金' },
  { value: '壬', label: '壬水' },
  { value: '癸', label: '癸水' },
];

const QUESTION_CATEGORY_OPTIONS: Array<{ value: QuestionCategory; label: string }> = [
  { value: 'general', label: '综合' },
  { value: 'sleep_health', label: '睡眠健康' },
  { value: 'research_project', label: '研究项目' },
  { value: 'career', label: '事业职业' },
  { value: 'money_resource', label: '金钱资源' },
  { value: 'relationship', label: '关系' },
  { value: 'travel', label: '出行' },
  { value: 'lost_item', label: '失物' },
  { value: 'decision', label: '决策' },
  { value: 'exam_learning', label: '考试学习' },
  { value: 'communication', label: '沟通' },
];

const QUESTION_INTENT_OPTIONS: Array<{ value: QuestionIntent; label: string }> = [
  { value: 'trend', label: '看趋势' },
  { value: 'timing_advice', label: '择时建议' },
  { value: 'risk_check', label: '风险检查' },
  { value: 'go_or_no_go', label: '是否推进' },
  { value: 'strategy', label: '策略选择' },
  { value: 'diagnosis', label: '原因诊断' },
];

function localDateTimeInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

type InputPanelProps = {
  mode: AppMode;
  liurenMode: LiurenMode;
  onModeChange: (mode: AppMode) => void;
  onLiurenModeChange: (mode: LiurenMode) => void;
  onResult: (result: AppResult) => void;
  onClear: () => void;
};

export function InputPanel({ mode, liurenMode, onModeChange, onLiurenModeChange, onResult, onClear }: InputPanelProps) {
  const [questionTime, setQuestionTime] = useState(localDateTimeInput());
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>('general');
  const [questionIntent, setQuestionIntent] = useState<QuestionIntent>('trend');
  const [askerGender, setAskerGender] = useState<AskerGender>('unknown');
  const [askerBirthTime, setAskerBirthTime] = useState('');
  const [askerDaymaster, setAskerDaymaster] = useState('');
  const [manualLines, setManualLines] = useState([7, 8, 7, 8, 7, 8]);
  const [xiaoMethod, setXiaoMethod] = useState<XiaoLiurenMethod>('time');
  const [manualLunarMonth, setManualLunarMonth] = useState(1);
  const [manualLunarDay, setManualLunarDay] = useState(1);
  const [manualHourBranch, setManualHourBranch] = useState('子');
  const [error, setError] = useState('');
  const submitLabel = mode === 'liuyao' ? '生成六爻' : liurenMode === 'daliuren' ? '生成大六壬 V1' : '生成小六壬';

  function clearForm() {
    setQuestionTime(localDateTimeInput());
    setTimezone('Asia/Shanghai');
    setQuestionText('');
    setQuestionCategory('general');
    setQuestionIntent('trend');
    setAskerGender('unknown');
    setAskerBirthTime('');
    setAskerDaymaster('');
    onLiurenModeChange('daliuren');
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
        mode === 'liuyao'
          ? calculateManualLiuyao(manualLines, questionText)
          : liurenMode === 'daliuren'
            ? calculateLiurenV1(questionTime, timezone, {
                questionText,
                questionCategory,
                questionIntent,
              }, {
                gender: askerGender,
                birth_time: askerBirthTime || undefined,
                daymaster: askerDaymaster || undefined,
              })
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
          六壬
        </button>
        <button type="button" role="tab" aria-selected={mode === 'liuyao'} className={mode === 'liuyao' ? 'active' : ''} onClick={() => onModeChange('liuyao')}>
          六爻
        </button>
      </div>

      <form onSubmit={submitForm}>
        {mode === 'liuren' ? (
          <>
            <div className="mode-heading">
              <strong>六壬</strong>
              <span>{liurenMode === 'daliuren' ? '大六壬 V1' : '小六壬'}</span>
            </div>
            <div className="method-toggle" role="radiogroup" aria-label="六壬类型">
              <button type="button" className={liurenMode === 'daliuren' ? 'active' : ''} onClick={() => onLiurenModeChange('daliuren')}>
                大六壬
              </button>
              <button type="button" className={liurenMode === 'xiaoliuren' ? 'active' : ''} onClick={() => onLiurenModeChange('xiaoliuren')}>
                小六壬
              </button>
            </div>
            {liurenMode === 'daliuren' ? (
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
                <div className="form-grid two">
                  <label className="field">
                    <span>问题类型</span>
                    <select value={questionCategory} onChange={(event) => setQuestionCategory(event.target.value as QuestionCategory)}>
                      {QUESTION_CATEGORY_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>提问意图</span>
                    <select value={questionIntent} onChange={(event) => setQuestionIntent(event.target.value as QuestionIntent)}>
                      {QUESTION_INTENT_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="profile-fields">
                  <div className="mode-heading compact">
                    <strong>提问者画像</strong>
                    <span>Milestone 6</span>
                  </div>
                  <div className="form-grid two">
                    <label className="field">
                      <span>性别</span>
                      <select value={askerGender} onChange={(event) => setAskerGender(event.target.value as AskerGender)}>
                        <option value="unknown">未说明</option>
                        <option value="female">女</option>
                        <option value="male">男</option>
                        <option value="other">其他</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>日主</span>
                      <select value={askerDaymaster} onChange={(event) => setAskerDaymaster(event.target.value)}>
                        {DAYMASTER_OPTIONS.map((option) => (
                          <option value={option.value} key={option.value || 'auto'}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>出生日期时间</span>
                    <input type="datetime-local" value={askerBirthTime} onChange={(event) => setAskerBirthTime(event.target.value)} />
                  </label>
                </div>
              </>
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
            {submitLabel}
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
