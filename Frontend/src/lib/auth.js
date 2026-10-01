const TOKEN_KEY = "devlens_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Validate a stored token against the backend; returns the user or null. */
export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("unauthorized");
    const { user } = await res.json();
    return user;
  } catch {
    clearToken();
    return null;
  }
}

export function authErrorMessage() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("authError");
  if (!err) return null;
  // Strip consumed params so a refresh doesn't resurface the error.
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

/** Consume ?token=... after OAuth redirect. Returns user payload or null. */
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
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { login: payload.login, avatar: payload.avatar, profile: payload.profile };
  } catch {
    return null;
  }
}
