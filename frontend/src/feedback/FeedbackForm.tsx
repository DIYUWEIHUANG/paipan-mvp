import { useEffect, useState, type FormEvent } from 'react';
import type { AppResult } from '../appTypes';
import type { DivinationFeedback, DivinationRecord, FeedbackPrivacyLevel, FeedbackQuality, OutcomeMatched, TimingMatched } from './types';

const OUTCOME_OPTIONS: Array<{ value: OutcomeMatched; label: string }> = [
  { value: 'matched', label: '整体匹配' },
  { value: 'partial', label: '部分匹配' },
  { value: 'missed', label: '不匹配' },
  { value: 'unknown', label: '暂不确定' },
];

const TIMING_OPTIONS: Array<{ value: TimingMatched; label: string }> = [
  { value: 'unknown', label: '暂不确定' },
  { value: 'early', label: '偏早发生' },
  { value: 'on_time', label: '窗口内发生' },
  { value: 'late', label: '偏晚发生' },
  { value: 'not_happened', label: '尚未发生' },
];

const QUALITY_OPTIONS: Array<{ value: FeedbackQuality; label: string }> = [
  { value: 'unknown', label: '未审核' },
  { value: 'valid', label: '有效数据' },
  { value: 'test', label: '测试数据' },
  { value: 'noise', label: '噪声' },
  { value: 'invalid_datetime', label: '时间无效' },
  { value: 'meaningless_question', label: '问题无意义' },
  { value: 'duplicate', label: '重复数据' },
];

const PRIVACY_OPTIONS: Array<{ value: FeedbackPrivacyLevel; label: string }> = [
  { value: 'private_raw', label: 'private_raw 完整私有' },
  { value: 'anonymized', label: 'anonymized 匿名化' },
  { value: 'public_stats', label: 'public_stats 仅聚合' },
];

type FeedbackFormProps = {
  record: DivinationRecord | null;
  feedback?: DivinationFeedback;
  onSubmit: (feedback: DivinationFeedback) => void;
  onCancel: () => void;
};

function linesToText(lines: string[] | undefined) {
  return lines?.join('\n') ?? '';
}

function textToLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function cloneResult(result: AppResult): AppResult {
  return JSON.parse(JSON.stringify(result)) as AppResult;
}

export function FeedbackForm({ record, feedback, onSubmit, onCancel }: FeedbackFormProps) {
  const [actualOutcome, setActualOutcome] = useState('');
  const [outcomeMatched, setOutcomeMatched] = useState<OutcomeMatched>('unknown');
  const [timingMatched, setTimingMatched] = useState<TimingMatched>('unknown');
  const [qualityTag, setQualityTag] = useState<FeedbackQuality>('unknown');
  const [privacyLevel, setPrivacyLevel] = useState<FeedbackPrivacyLevel>('private_raw');
  const [usefulParts, setUsefulParts] = useState('');
  const [wrongParts, setWrongParts] = useState('');
  const [userNote, setUserNote] = useState('');
  const [adminReviewNote, setAdminReviewNote] = useState('');

  useEffect(() => {
    setActualOutcome(feedback?.actualOutcome ?? '');
    setOutcomeMatched(feedback?.outcomeMatched ?? 'unknown');
    setTimingMatched(feedback?.timingMatched ?? 'unknown');
    setQualityTag(feedback?.qualityTag ?? 'unknown');
    setPrivacyLevel(feedback?.privacyLevel ?? 'private_raw');
    setUsefulParts(linesToText(feedback?.usefulParts));
    setWrongParts(linesToText(feedback?.wrongParts));
    setUserNote(feedback?.userNote ?? '');
    setAdminReviewNote(feedback?.adminReviewNote ?? '');
  }, [feedback, record?.id]);

  if (!record) return null;
  const currentRecord = record;

  function submitForm(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      recordId: currentRecord.id,
      resultType: currentRecord.resultType,
      createdAt: currentRecord.createdAt,
      feedbackAt: new Date().toISOString(),
      actualOutcome: actualOutcome.trim(),
      outcomeMatched,
      timingMatched,
      qualityTag,
      privacyLevel,
      usefulParts: textToLines(usefulParts),
      wrongParts: textToLines(wrongParts),
      userNote: userNote.trim(),
      adminReviewNote: adminReviewNote.trim(),
      originalResult: cloneResult(currentRecord.result),
    });
  }

  return (
    <div className="feedback-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="surface feedback-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="record-head">
        <div>
          <h2 id="feedback-title">{feedback ? '编辑反馈' : '填写反馈'}</h2>
          <span>
            {currentRecord.modeLabel} · {currentRecord.title || '未填写问题文本'}
          </span>
        </div>
      </div>
      <form className="feedback-form" onSubmit={submitForm}>
        <label className="field">
          <span>实际发生了什么</span>
          <textarea value={actualOutcome} onChange={(event) => setActualOutcome(event.target.value)} rows={4} required />
        </label>
        <div className="form-grid two">
          <label className="field">
            <span>整体是否匹配</span>
            <select value={outcomeMatched} onChange={(event) => setOutcomeMatched(event.target.value as OutcomeMatched)}>
              {OUTCOME_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>应期是否匹配</span>
            <select value={timingMatched} onChange={(event) => setTimingMatched(event.target.value as TimingMatched)}>
              {TIMING_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid two">
          <label className="field">
            <span>数据质量</span>
            <select value={qualityTag} onChange={(event) => setQualityTag(event.target.value as FeedbackQuality)}>
              {QUALITY_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>隐私级别</span>
            <select value={privacyLevel} onChange={(event) => setPrivacyLevel(event.target.value as FeedbackPrivacyLevel)}>
              {PRIVACY_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>哪些判断有用</span>
          <textarea value={usefulParts} onChange={(event) => setUsefulParts(event.target.value)} rows={3} placeholder="每行一条" />
        </label>
        <label className="field">
          <span>哪些判断不准</span>
          <textarea value={wrongParts} onChange={(event) => setWrongParts(event.target.value)} rows={3} placeholder="每行一条" />
        </label>
        <label className="field">
          <span>用户备注</span>
          <textarea value={userNote} onChange={(event) => setUserNote(event.target.value)} rows={3} />
        </label>
        <label className="field">
          <span>人工审核备注</span>
          <textarea value={adminReviewNote} onChange={(event) => setAdminReviewNote(event.target.value)} rows={3} placeholder="用于早期筛选：测试、噪声、重复、时间错误等。" />
        </label>
        <details className="feedback-json">
          <summary>原始 JSON</summary>
          <pre>{JSON.stringify(currentRecord.result, null, 2)}</pre>
        </details>
        <div className="button-row">
          <button className="primary-button" type="submit">
            {feedback ? '保存修改' : '提交反馈'}
          </button>
          <button className="secondary-button" type="button" onClick={onCancel}>
            收起
          </button>
        </div>
      </form>
      </section>
    </div>
  );
}
