import { Clock3, Trash2 } from 'lucide-react';
import type { AppResult } from '../appTypes';
import type { DivinationFeedback, DivinationRecord, FeedbackQuality } from '../feedback/types';

type RecordPanelProps = {
  records: DivinationRecord[];
  feedbacksByRecordId: Record<string, DivinationFeedback | undefined>;
  onLoad: (result: AppResult) => void;
  onFeedback: (record: DivinationRecord) => void;
  onClear: () => void;
};

function formatRecordTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const QUALITY_LABELS: Record<FeedbackQuality, string> = {
  valid: '有效',
  test: '测试',
  noise: '噪声',
  invalid_datetime: '时间无效',
  meaningless_question: '问题无意义',
  duplicate: '重复',
  unknown: '未审核',
};

export function RecordPanel({ records, feedbacksByRecordId, onLoad, onFeedback, onClear }: RecordPanelProps) {
  return (
    <section className="surface record-panel">
      <div className="record-head">
        <div>
          <h2>问卦记录</h2>
          <span>{records.length ? `${records.length} 条本地记录` : '暂无记录'}</span>
        </div>
        <button className="icon-button" type="button" onClick={onClear} aria-label="清空问卦记录" disabled={!records.length}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="record-list">
        {records.length ? (
          records.map((record) => {
            const feedback = feedbacksByRecordId[record.id];
            const loadRecord = () => onLoad(record.result);
            return (
              <article
                className="record-item"
                key={record.id}
                role="button"
                tabIndex={0}
                onClick={loadRecord}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    loadRecord();
                  }
                }}
              >
                <span className="record-meta">
                  <Clock3 size={14} aria-hidden="true" />
                  {formatRecordTime(record.createdAt)} · {record.modeLabel}
                </span>
                <strong>{record.title || '未填写问题文本'}</strong>
                <div className="record-status-row">
                  <span className={feedback ? 'feedback-badge done' : 'feedback-badge'}>{feedback ? '已有反馈' : '未反馈'}</span>
                  <span className={`quality-badge ${feedback?.qualityTag === 'valid' ? 'valid' : ''}`}>数据质量：{QUALITY_LABELS[feedback?.qualityTag ?? 'unknown']}</span>
                  {feedback && <small>更新于 {formatRecordTime(feedback.feedbackAt)}</small>}
                </div>
                <div className="record-actions">
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      loadRecord();
                    }}
                  >
                    查看结果
                  </button>
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFeedback(record);
                    }}
                  >
                    {feedback ? '编辑反馈' : '填写反馈'}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p>生成排盘后会自动保存在此浏览器。</p>
        )}
      </div>
    </section>
  );
}
