import { useCallback, useEffect, useState } from "react";
import { fetchHistory, clearHistory as clearHistoryApi } from "../lib/api";
import { getToken } from "../lib/auth";

export function useHistory(reloadKey) {
  const [history, setHistory] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setHistory([]);
      return;
    }
    try {
      const { snapshots } = await fetchHistory();
      setHistory(snapshots || []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then(({ snapshots }) => {
        if (!cancelled) setHistory(snapshots || []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const clear = useCallback(async () => {
    if (!window.confirm("Delete all snapshots? This cannot be undone.")) {
      return;
    }
    setError("");
    setClearing(true);
    try {
      await clearHistoryApi();
      setHistory([]);
    } catch {
      setError("Couldn't clear snapshots — try again.");
    } finally {
      setClearing(false);
    }
  }, []);

  return { history, clearing, error, clear, refresh };
}
