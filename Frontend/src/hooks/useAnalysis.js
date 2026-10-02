import { useCallback, useEffect, useState } from "react";
import { fetchRoles, analyzeProfile, fetchSavedAnalysis } from "../lib/api";

const EMPTY = [];

export function useAnalysis(login) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(Boolean(login));
  const [error, setError] = useState("");
  const [roles, setRoles] = useState(EMPTY);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await analyzeProfile();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || "Could not analyze your profile");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!login) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const { analysis, needsAnalysis } = await fetchSavedAnalysis();
        if (cancelled) return;
        if (analysis && !needsAnalysis) {
          setData(analysis);
          return;
        }
        const result = await analyzeProfile();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load your profile");
      } finally {
        if (!cancelled) setInitialising(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [login]);

  useEffect(() => {
    let cancelled = false;
    fetchRoles()
      .then(({ roles: list }) => {
        if (!cancelled) setRoles(list || EMPTY);
      })
      .catch(() => {
        if (!cancelled) setRoles(EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    roles,
    loading: loading || initialising,
    error,
    refresh: run,
  };
}
