import type { AppResult } from '../appTypes';
import type { LlmEnhancePayload, LlmInterpretation } from '../interpretation/llmInterpretation';
import type { NameWuxingApiResult } from '../personalization/types';
import type { DivinationFeedback, DivinationRecord, FeedbackStats } from './types';

export const ADMIN_TOKEN_STORAGE_KEY = 'paipan.adminToken.v1';
const REQUEST_TIMEOUT_MS = 20_000;

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

function isHttpsPageWithHttpBackend(baseUrl: string) {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' && baseUrl.startsWith('http://');
}

function backendRequestError(baseUrl: string, error: unknown) {
  if (isHttpsPageWithHttpBackend(baseUrl)) {
    return new Error('私有后端请求被浏览器拦截：当前页面是 HTTPS，但 VITE_API_BASE_URL 是 HTTP。请给后端配置 HTTPS 域名或反向代理后，将 GitHub Variables 中的 VITE_API_BASE_URL 改为 https://...。');
  }
  if (error instanceof TypeError) {
    return new Error('私有后端请求失败：请检查后端是否在线、CORS 是否允许当前页面，以及 VITE_API_BASE_URL 是否正确。');
  }
  return error instanceof Error ? error : new Error(String(error));
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
  if (isHttpsPageWithHttpBackend(baseUrl)) throw backendRequestError(baseUrl, new TypeError('mixed content'));
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (adminToken) headers.set('X-Admin-Token', adminToken);

  let response: Response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('私有后端请求超时：请检查服务器 8002 端口是否正在运行，并确认防火墙/安全组已放行。');
    }
    throw backendRequestError(baseUrl, error);
  } finally {
    window.clearTimeout(timeout);
  }
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

export async function enhanceInterpretation(payload: LlmEnhancePayload, token = getStoredAdminToken()) {
  return requestJson<LlmInterpretation>(
    '/api/admin/interpret/enhance',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}
