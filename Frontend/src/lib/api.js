import { getToken } from "./auth";

export const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      payload?.message || `Request failed (${res.status})`,
      res.status,
    );
  }
  return payload;
}

export function fetchRoles() {
  return request("/roles");
}

export function fetchActivity() {
  return request("/activity");
}

export function analyzeProfile() {
  return request("/analyze", { method: "POST" });
}

export function fetchSavedAnalysis() {
  return request("/analysis");
}

export function matchRole({ role, resume = null }) {
  const formData = new FormData();
  formData.append("role", role);
  if (resume) formData.append("resume", resume);
  return request("/match", { method: "POST", body: formData });
}

export function fetchHistory() {
  return request("/auth/history");
}

export function clearHistory() {
  return request("/auth/history", { method: "DELETE" });
}
