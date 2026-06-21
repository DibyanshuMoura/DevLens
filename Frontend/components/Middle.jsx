import React, { useState, useRef } from "react";
import Loading from "./Loading";

const Middle = () => {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [data, setData] = useState(null);
  const [username, setUsername] = useState("");

  async function handleAnalyze() {
    setData(null);
    setFetchError("");

    if (username.trim() === "") {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    try {
      setLoading(true);

      const githubUsername = username.trim();

      setUsername("");
      inputRef.current?.blur();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/analyze?username=${githubUsername}`,
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze profile");
      }

      setData(result);
    } catch (err) {
      setFetchError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function render(arr = []) {
    return arr.map((item, index) => <li key={index}>{item}</li>);
  }

  return (
    <main className="w-full flex items-center justify-center flex-1 flex-col gap-3 px-6">
      <input
        type="text"
        className="p-2 border text-center outline-0 mt-5"
        placeholder="github username"
        value={username}
        ref={inputRef}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            handleAnalyze();
          }
        }}
      />

      <button
        className="px-18 py-2 bg-black text-white hover:bg-gray-800 cursor-pointer 
        disabled:cursor-not-allowed"
        onClick={handleAnalyze}
        disabled={loading}
      >
        Analyze
      </button>

      {loading && <Loading />}

      {error && (
        <p className="text-gray-500">Please enter a GitHub username.</p>
      )}

      {fetchError && <p className="text-gray-500 text-center">{fetchError}</p>}

      {data && (
        <div className="w-full max-w-xl border p-5 flex flex-col gap-5 mb-5 bg-[#e6e6e6]">
          <div className="flex items-center flex-col gap-3">
            <img
              src={data.dp}
              alt={data.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border"
            />

            <a
              href={data.id}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl hover:underline break-all text-center"
            >
              {data.name}
            </a>
          </div>

          <div>
            <h3 className="font-medium mb-2">Strengths</h3>
            <ul className="list-disc pl-5 wrap-break-word">
              {render(data.res?.strengths)}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Weaknesses</h3>
            <ul className="list-disc pl-5 wrap-break-word">
              {render(data.res?.weaknesses)}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Improvements</h3>
            <ul className="list-disc pl-5 wrap-break-word">
              {render(data.res?.improvements)}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
};

export default Middle;
