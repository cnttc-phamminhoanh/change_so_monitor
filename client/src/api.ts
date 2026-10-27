import type { SoDashboardResponse } from './types';

interface ApiErrorBody {
  error?: { message?: string };
}

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error?.message) message = body.error.message;
    } catch {
      /* body was not JSON: keep the status text */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
};

export interface SoRange {
  from: string;
  to: string;
}

export const getDashboard = (range: SoRange): Promise<SoDashboardResponse> => {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const qs = params.toString();
  return getJson<SoDashboardResponse>(`/api/so-monitor/dashboard${qs ? `?${qs}` : ''}`);
};
