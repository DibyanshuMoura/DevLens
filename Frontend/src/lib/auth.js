const TOKEN_KEY = "devlens_token";

export function decodeJwtPayload(token) {
  const segment = token.split(".")[1];
  if (!segment) throw new Error("Malformed token");
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(padded));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      clearToken();
      return null;
    }
    if (!res.ok) return undefined;
    const { user } = await res.json();
    return user ?? null;
  } catch {
    return undefined;
  }
}

export function readCachedUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = decodeJwtPayload(token);
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearToken();
      return null;
    }
    return {
      login: payload.login,
      avatar: payload.avatar,
      profile: payload.profile,
    };
  } catch {
    return null;
  }
}

export function authErrorMessage() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("authError");
  if (!err) return null;
  params.delete("authError");
  params.delete("token");
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}`,
  );
  return err;
}

export function consumeTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return null;
  setToken(token);
  params.delete("token");
  params.delete("authError");
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}`,
  );
  try {
    const payload = decodeJwtPayload(token);
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return {
      login: payload.login,
      avatar: payload.avatar,
      profile: payload.profile,
    };
  } catch {
    return null;
  }
}
