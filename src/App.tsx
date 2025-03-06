import React, { useState } from "react";
import { analyzeCode } from "./utils/analyzer";

const App: React.FC = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ complexity?: string; error?: string } | null>(null);

  const handleAnalyze = () => {
    const analysis = analyzeCode(code);
    setResult(analysis);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold">Code Complexity Analyzer 🚀</h1>
      <textarea
        className="w-full max-w-2xl mt-4 p-2 bg-gray-800 border border-gray-600 rounded-md"
        rows={6}
        placeholder="Paste your JS/TS function here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        onClick={handleAnalyze}
        className="mt-4 px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Analyze Code
      </button>

      {result && (
        <div className="mt-6 bg-gray-800 p-4 rounded-md w-full max-w-2xl">
          {result.error ? (
            <p className="text-red-500">{result.error}</p>
          ) : (
            <p className="text-green-400">Estimated Complexity: {result.complexity}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
