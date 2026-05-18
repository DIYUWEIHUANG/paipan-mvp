import type { AppResult } from '../appTypes';
import type { NameWuxingApiResult } from '../personalization/types';
import type { DivinationFeedback, DivinationRecord, FeedbackStats } from './types';

export const ADMIN_TOKEN_STORAGE_KEY = 'paipan.adminToken.v1';

export type AdminRecord = DivinationRecord & {
  questionText: string;
  questionCategory: string;
  ruleVersion: string;
  result: AppResult;
};

export function apiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
}

export function hasRemoteBackend() {
  return Boolean(apiBaseUrl());
}

export function getStoredAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
}

export function setStoredAdminToken(token: string) {
  const normalized = token.trim();
  if (normalized) window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, normalized);
  else window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

async function requestJson<T>(path: string, init: RequestInit = {}, adminToken = ''): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured.');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (adminToken) headers.set('X-Admin-Token', adminToken);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchPublicStats() {
  if (!hasRemoteBackend()) return null;
  return requestJson<FeedbackStats>('/api/stats');
}

export async function syncRecordToBackend(record: DivinationRecord) {
  const token = getStoredAdminToken();
  if (!hasRemoteBackend() || !token) return false;
  await requestJson<AdminRecord>(
    '/api/records',
    {
      method: 'POST',
      body: JSON.stringify(record),
    },
    token,
  );
  return true;
}

export async function syncFeedbackToBackend(feedback: DivinationFeedback) {
  const token = getStoredAdminToken();
  if (!hasRemoteBackend() || !token) return false;
  await requestJson<DivinationFeedback>(
    '/api/feedbacks',
    {
      method: 'POST',
      body: JSON.stringify(feedback),
    },
    token,
  );
  return true;
}

export async function fetchAdminRecords(token = getStoredAdminToken()) {
  return requestJson<AdminRecord[]>('/api/admin/records', {}, token);
}

export async function fetchAdminFeedbacks(token = getStoredAdminToken()) {
  return requestJson<DivinationFeedback[]>('/api/admin/feedbacks', {}, token);
}

export async function fetchPrivateRawExport(token = getStoredAdminToken()) {
  return requestJson<unknown>('/api/admin/export/private_raw', {}, token);
}

export async function fetchAnonymizedExport(token = getStoredAdminToken()) {
  return requestJson<unknown>('/api/admin/export/anonymized', {}, token);
}

export async function analyzeNameWuxing(name: string, token = getStoredAdminToken()) {
  return requestJson<NameWuxingApiResult>(
    '/api/admin/name-wuxing',
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
    token,
  );
}
