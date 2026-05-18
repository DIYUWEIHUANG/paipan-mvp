import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AppMode, AppResult, LiurenMode } from './appTypes';
import { InputPanel } from './components/InputPanel';
import { Layout } from './components/Layout';
import { RecordPanel } from './components/RecordPanel';
import { ResultPanel } from './components/ResultPanel';
import { AdminPanel } from './feedback/AdminPanel';
import { FeedbackForm } from './feedback/FeedbackForm';
import { FeedbackSummary } from './feedback/FeedbackSummary';
import { calculateFeedbackStats, createFeedbackMap, loadFeedbacks, loadRecords, MAX_RECORDS, saveFeedbacks, saveRecords, upsertFeedback } from './feedback/storage';
import { fetchPublicStats, hasRemoteBackend, syncFeedbackToBackend, syncRecordToBackend } from './feedback/remote';
import type { DivinationFeedback, DivinationRecord, FeedbackStats } from './feedback/types';
import './styles.css';

function resultModeLabel(result: AppResult) {
  if (result.type === 'da_liuren') return '大六壬';
  if (result.type === 'liu_yao') return '六爻';
  return '小六壬';
}

function resultTitle(result: AppResult) {
  if (result.type === 'da_liuren') {
    return result.input.questionText || result.input.question_text || `${result.four_pillars.day}日 ${result.four_pillars.hour}时`;
  }
  if (result.type === 'liu_yao') {
    return result.input.question_text || `${result.base_hexagram.name} → ${result.changed_hexagram.name}`;
  }
  return result.input.question_text || result.final_palace;
}

function feedbacksForRecords(feedbacks: DivinationFeedback[], records: DivinationRecord[]) {
  const recordIds = new Set(records.map((record) => record.id));
  return feedbacks.filter((feedback) => recordIds.has(feedback.recordId));
}

function App() {
  const [mode, setMode] = useState<AppMode>('liuren');
  const [liurenMode, setLiurenMode] = useState<LiurenMode>('daliuren');
  const [result, setResult] = useState<AppResult | null>(null);
  const [records, setRecords] = useState<DivinationRecord[]>(loadRecords);
  const [feedbacks, setFeedbacks] = useState<DivinationFeedback[]>(() => feedbacksForRecords(loadFeedbacks(), records));
  const [activeFeedbackRecordId, setActiveFeedbackRecordId] = useState<string | null>(null);
  const [remoteStats, setRemoteStats] = useState<FeedbackStats | null>(null);

  const recentRecords = records.slice(0, MAX_RECORDS);
  const feedbacksByRecordId = useMemo(() => createFeedbackMap(feedbacks), [feedbacks]);
  const activeFeedbackRecord = activeFeedbackRecordId ? records.find((record) => record.id === activeFeedbackRecordId) ?? null : null;
  const activeFeedback = activeFeedbackRecord ? feedbacksByRecordId[activeFeedbackRecord.id] : undefined;
  const localFeedbackStats = useMemo(() => calculateFeedbackStats(feedbacks), [feedbacks]);
  const feedbackStats = remoteStats ?? localFeedbackStats;
  const statsSource = remoteStats ? '私有后端 /api/stats' : hasRemoteBackend() ? '私有后端未连接，暂用本地统计' : '本地 localStorage';

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    saveFeedbacks(feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    void refreshPublicStats();
  }, []);

  async function refreshPublicStats() {
    try {
      setRemoteStats(await fetchPublicStats());
    } catch {
      setRemoteStats(null);
    }
  }

  function handleResult(nextResult: AppResult) {
    setResult(nextResult);
    const record: DivinationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      resultType: nextResult.type,
      modeLabel: resultModeLabel(nextResult),
      createdAt: new Date().toISOString(),
      title: resultTitle(nextResult),
      result: nextResult,
    };
    setRecords((current) => [record, ...current]);
    void syncRecordToBackend(record).then(refreshPublicStats).catch(() => undefined);
  }

  function handleClearRecords() {
    setRecords([]);
    setFeedbacks([]);
    setActiveFeedbackRecordId(null);
  }

  function handleSubmitFeedback(feedback: DivinationFeedback) {
    if (!records.some((record) => record.id === feedback.recordId)) return;
    setFeedbacks((current) => upsertFeedback(current, feedback));
    void syncFeedbackToBackend(feedback).then(refreshPublicStats).catch(() => undefined);
    setActiveFeedbackRecordId(null);
  }

  return (
    <Layout>
      <div className="control-stack">
        <InputPanel
          mode={mode}
          liurenMode={liurenMode}
          onModeChange={setMode}
          onLiurenModeChange={setLiurenMode}
          onResult={handleResult}
          onClear={() => setResult(null)}
        />
        <RecordPanel records={recentRecords} feedbacksByRecordId={feedbacksByRecordId} onLoad={setResult} onFeedback={(record) => setActiveFeedbackRecordId(record.id)} onClear={handleClearRecords} />
        <FeedbackForm record={activeFeedbackRecord} feedback={activeFeedback} onSubmit={handleSubmitFeedback} onCancel={() => setActiveFeedbackRecordId(null)} />
        <FeedbackSummary stats={feedbackStats} feedbacks={feedbacks} recordCount={records.length} statsSource={statsSource} />
        <AdminPanel localRecords={records} localFeedbacks={feedbacks} onLoad={setResult} onSynced={refreshPublicStats} />
      </div>
      <ResultPanel result={result} liurenMode={liurenMode} />
    </Layout>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
