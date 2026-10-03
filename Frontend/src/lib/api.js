import { getToken } from "./auth";

/* Fall back to same-origin when unset. Defaulting to a literal localhost would
   ship a build that only ever works on the machine that compiled it. */
export const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      body,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    /* A raw fetch TypeError surfaces as "Failed to fetch", which says nothing
       about what to do next. Multipart uploads are the usual trigger: a body
       that is too big, or a connection cut mid-upload, never yields a
       response to read. */
    throw new ApiError(
      `Could not reach the server (${API_URL || window.location.origin}). ` +
        `Check your connection, and if this was an upload, try a smaller PDF.`,
      0,
    );
  }

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
  if (resume) formData.append("resume", resume, resume.name);
  return request("/match", { method: "POST", body: formData });
}

export function fetchHistory() {
  return request("/auth/history");
}

export function clearHistory() {
  return request("/auth/history", { method: "DELETE" });
}
