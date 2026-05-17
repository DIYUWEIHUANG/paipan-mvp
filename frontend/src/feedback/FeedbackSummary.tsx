import { buildAnonymizedFeedbackExport, buildPrivateRawFeedbackExport, privateRawExportWarning } from './storage';
import type { DivinationFeedback, FeedbackStats } from './types';

const OUTCOME_LABELS: Record<string, string> = {
  matched: '匹配',
  partial: '部分',
  missed: '未中',
  unknown: '未知',
};

const TIMING_LABELS: Record<string, string> = {
  early: '偏早',
  on_time: '准时',
  late: '偏晚',
  not_happened: '未发生',
  unknown: '未知',
};

const RESULT_TYPE_LABELS: Record<string, string> = {
  da_liuren: '大六壬',
  xiao_liuren: '小六壬',
  liu_yao: '六爻',
};

function CountRow({ title, values, labels }: { title: string; values: Record<string, number>; labels: Record<string, string> }) {
  return (
    <div className="feedback-count-block">
      <span>{title}</span>
      <div>
        {Object.entries(labels).map(([key, label]) => (
          <small key={key}>
            {label} {values[key] ?? 0}
          </small>
        ))}
      </div>
    </div>
  );
}

function exportStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function FeedbackSummary({ stats, feedbacks, recordCount }: { stats: FeedbackStats; feedbacks: DivinationFeedback[]; recordCount: number }) {
  function exportPrivateRaw() {
    if (!feedbacks.length) return;
    if (!window.confirm(privateRawExportWarning())) return;
    downloadJson(`private_feedback_${exportStamp()}.json`, buildPrivateRawFeedbackExport(feedbacks));
  }

  function exportAnonymized() {
    if (!feedbacks.length) return;
    downloadJson(`anonymized_feedback_${exportStamp()}.json`, buildAnonymizedFeedbackExport(feedbacks));
  }

  return (
    <section className="surface feedback-summary">
      <div className="record-head">
        <div>
          <h2>反馈统计</h2>
          <span>
            {recordCount} 个本地排盘 · {feedbacks.length} 条反馈 · {stats.total} 条有效
          </span>
        </div>
      </div>
      <div className="export-actions feedback-export-actions">
        <button className="secondary-button compact-button" type="button" onClick={exportPrivateRaw} disabled={!feedbacks.length}>
          导出 private_raw JSON
        </button>
        <button className="secondary-button compact-button" type="button" onClick={exportAnonymized} disabled={!feedbacks.length}>
          导出 anonymized JSON
        </button>
      </div>
      <div className="feedback-total">
        <span>有效反馈数 · 统计口径 qualityTag=valid</span>
        <strong>{stats.total}</strong>
      </div>
      <div className="feedback-count-grid">
        <CountRow title="匹配情况" values={stats.byOutcomeMatched} labels={OUTCOME_LABELS} />
        <CountRow title="应期情况" values={stats.byTimingMatched} labels={TIMING_LABELS} />
        <CountRow title="排盘类型" values={stats.byResultType} labels={RESULT_TYPE_LABELS} />
      </div>
    </section>
  );
}
