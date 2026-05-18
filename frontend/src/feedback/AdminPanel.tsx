import { useEffect, useState } from 'react';
import type { AppResult } from '../appTypes';
import type { DivinationFeedback, DivinationRecord } from './types';
import {
  fetchAdminFeedbacks,
  fetchAdminRecords,
  fetchAnonymizedExport,
  fetchPrivateRawExport,
  getStoredAdminToken,
  hasRemoteBackend,
  setStoredAdminToken,
  syncFeedbackToBackend,
  syncRecordToBackend,
  type AdminRecord,
} from './remote';

type AdminPanelProps = {
  localRecords: DivinationRecord[];
  localFeedbacks: DivinationFeedback[];
  onLoad: (result: AppResult) => void;
  onSynced: () => void;
};

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

export function AdminPanel({ localRecords, localFeedbacks, onLoad, onSynced }: AdminPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<DivinationFeedback[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEnabled(hasRemoteBackend());
    setToken(getStoredAdminToken());
  }, []);

  async function refreshAdminData(nextToken = token) {
    if (!enabled || !nextToken.trim()) return;
    setMessage('正在读取私有后端数据...');
    try {
      const [nextRecords, nextFeedbacks] = await Promise.all([fetchAdminRecords(nextToken), fetchAdminFeedbacks(nextToken)]);
      setRecords(nextRecords);
      setFeedbacks(nextFeedbacks);
      setMessage(`已读取 ${nextRecords.length} 条 raw 记录、${nextFeedbacks.length} 条反馈。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function saveToken() {
    setStoredAdminToken(token);
    setMessage(token.trim() ? '管理员 token 已保存到本地浏览器。' : '管理员 token 已清除。');
  }

  async function syncLocalData() {
    if (!enabled || !token.trim()) return;
    setStoredAdminToken(token);
    setMessage('正在同步本地记录和反馈...');
    try {
      for (const record of localRecords) await syncRecordToBackend(record);
      for (const feedback of localFeedbacks) await syncFeedbackToBackend(feedback);
      await refreshAdminData(token);
      onSynced();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function exportPrivateRaw() {
    if (!window.confirm('该文件包含问题原文、出生时间和反馈数据，请勿上传 GitHub。')) return;
    try {
      downloadJson(`private_feedback_${exportStamp()}.json`, await fetchPrivateRawExport(token));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function exportAnonymized() {
    try {
      downloadJson(`anonymized_feedback_${exportStamp()}.json`, await fetchAnonymizedExport(token));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="surface admin-panel">
      <div className="record-head">
        <div>
          <h2>管理员模式</h2>
          <span>{enabled ? '私有后端已配置' : '未配置 VITE_API_BASE_URL'}</span>
        </div>
      </div>
      <div className="admin-grid">
        <label className="field">
          <span>X-Admin-Token</span>
          <input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="只保存在本地浏览器" disabled={!enabled} />
        </label>
        <div className="record-actions admin-actions">
          <button className="secondary-button compact-button" type="button" onClick={saveToken} disabled={!enabled}>
            保存 token
          </button>
          <button className="secondary-button compact-button" type="button" onClick={() => refreshAdminData()} disabled={!enabled || !token.trim()}>
            刷新 raw
          </button>
          <button className="secondary-button compact-button" type="button" onClick={syncLocalData} disabled={!enabled || !token.trim()}>
            同步本地数据
          </button>
          <button className="secondary-button compact-button" type="button" onClick={exportPrivateRaw} disabled={!enabled || !token.trim()}>
            导出 raw
          </button>
          <button className="secondary-button compact-button" type="button" onClick={exportAnonymized} disabled={!enabled || !token.trim()}>
            导出匿名
          </button>
        </div>
      </div>
      {message && <p className="admin-message">{message}</p>}
      {enabled && (
        <div className="admin-raw-list">
          <div>
            <span>raw 记录</span>
            <strong>{records.length}</strong>
          </div>
          <div>
            <span>raw 反馈</span>
            <strong>{feedbacks.length}</strong>
          </div>
          {records.slice(0, 8).map((record) => (
            <button className="record-item admin-record-item" type="button" onClick={() => onLoad(record.result)} key={record.id}>
              <span className="record-meta">{record.createdAt} · {record.resultType} · {record.ruleVersion}</span>
              <strong>{record.questionText || record.title || '未填写问题文本'}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
