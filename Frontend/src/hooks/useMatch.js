import { useCallback, useState } from "react";
import { matchRole } from "../lib/api";

export function useMatch() {
  const [jobRole, setJobRole] = useState("");
  const [resume, setResume] = useState(null);
  const [result, setResult] = useState(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  const match = useCallback(async () => {
    if (!jobRole) {
      setError("Pick a target job role first");
      return null;
    }
    setMatching(true);
    setError("");
    try {
      const res = await matchRole({ role: jobRole, resume });
      setResult(res);
      return res;
    } catch (err) {
      setError(err.message || "Could not complete the match");
      return null;
    } finally {
      setMatching(false);
    }
  }, [jobRole, resume]);

  const clear = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  return {
    jobRole,
    setJobRole,
    resume,
    setResume,
    result,
    matching,
    error,
    match,
    clear,
  };
}
