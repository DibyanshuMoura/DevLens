import { useEffect, useState } from "react";
import { fetchActivity } from "../lib/api";

export function useCommitActivity(login) {
  const [result, setResult] = useState({
    activity: null,
    loadedFor: null,
    error: null,
  });

  useEffect(() => {
    if (!login) return undefined;

    let cancelled = false;
    fetchActivity()
      .then((res) => {
        if (!cancelled) {
          setResult({
            activity: res?.activity ?? null,
            loadedFor: login,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ activity: null, loadedFor: login, error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [login]);

  return {
    activity: result.activity,
    loading: Boolean(login) && result.loadedFor !== login,
    error: result.error,
  };
}
