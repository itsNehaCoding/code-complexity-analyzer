import React, { useState } from "react";
import { analyzeCode, explainComplexity, getOptimizationSuggestions, findBottlenecks, AnalysisResult } from "./utils/analyzer";

const App: React.FC = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [showBottlenecks, setShowBottlenecks] = useState(false);

  const handleAnalyze = () => {
    const analysis = analyzeCode(code);
    setResult(analysis);
    setShowExplanation(true);
    setShowOptimizations(false);
    setShowBottlenecks(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold">Code Complexity Analyzer 🚀</h1>
      <p className="text-gray-400 mt-2">Advanced analysis of algorithm complexity and patterns</p>

      <textarea
        className="w-full max-w-3xl mt-4 p-4 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm"
        rows={10}
        placeholder="Paste your Javascript function here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        className="mt-4 px-6 py-3 rounded-md bg-blue-600 text-black hover:bg-blue-700 transition-colors">
  Analyze Code
      </button>

      {result && (
        <div className="mt-6 bg-gray-800 p-6 rounded-md w-full max-w-3xl">
          {result.error ? (
            <div className="text-red-500">
              <h2 className="text-xl font-bold">Error</h2>
              <p>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Analysis Results</h2>
                <span className={`px-3 py-1 rounded-full ${getComplexityColor(result.overallComplexity)}`}>
                  {result.overallComplexity}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold mb-2">Code Structure</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Functions Analyzed: {result.functions.length}</li>
                    <li>Complexity: {result.overallComplexity}</li>
                  </ul>
                </div>
              </div>
              
              {/* Per-function Analysis */}
              <div className="mt-4">
                <h3 className="font-bold mb-2">Function Analysis</h3>
                <div className="space-y-3">
                  {result.functions.map((func, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{func.name}</h4>
                        <span className={`px-2 py-1 text-sm rounded-full ${getComplexityColor(func.complexity)}`}>
                          {func.complexity}
                        </span>
                      </div>
                      <div className="mt-2 text-sm space-y-1">
                        <p>Loops: {func.details.loopCount}</p>
                        <p>Nested Loop Depth: {func.details.nestedLoopDepth}</p>
                        {func.details.recursionDetected && (
                          <p className="text-yellow-400">⚠️ Contains recursion</p>
                        )}
                        {func.details.divideAndConquer && (
                          <p className="text-blue-400">🔄 Uses divide and conquer</p>
                        )}
                        {func.details.logarithmicOperations && (
                          <p className="text-green-400">📉 Uses logarithmic operations</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.functions.some(f => f.details.recursionDetected) && (
                <div className="mt-4 bg-yellow-900 bg-opacity-30 p-4 rounded-md border border-yellow-700">
                  <h3 className="font-bold text-yellow-400">Recursion Detected</h3>
                  <p className="mt-2 text-sm">
                    Recursive functions found: {result.functions.filter(f => f.details.recursionDetected).map(f => f.name).join(", ")}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="px-4 py-2 bg-gray-700 text-black rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  {showExplanation ? "Hide" : "Show"} Explanation
                </button>
                <button
                  onClick={() => setShowOptimizations(!showOptimizations)}
                  className="px-4 py-2 bg-gray-700 text-black rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  {showOptimizations ? "Hide" : "Show"} Optimization Tips
                </button>
                <button
                  onClick={() => setShowBottlenecks(!showBottlenecks)}
                  className="px-4 py-2 bg-gray-700 text-black rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  {showBottlenecks ? "Hide" : "Show"} Bottlenecks
                </button>
              </div>

              {showExplanation && (
                <div className="mt-4 bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold mb-2">Complexity Explanation</h3>
                  <p className="text-sm">{explainComplexity(result.overallComplexity)}</p>
                </div>
              )}

              {showOptimizations && (
                <div className="mt-4 bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold mb-2">Optimization Suggestions</h3>
                  {getOptimizationSuggestions(result).length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {getOptimizationSuggestions(result).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-200">No specific optimizations suggested</p>
                  )}
                </div>
              )}

              {showBottlenecks && (
                <div className="mt-4 bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold mb-2">Performance Bottlenecks</h3>
                  {findBottlenecks(result).length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {findBottlenecks(result).map((bottleneck, index) => (
                        <li key={index}>{bottleneck}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-200">No significant bottlenecks detected</p>
                  )}
                </div>
              )}

              {/* Function call frequency table */}
              {result.functions.some(f => Object.keys(f.details.functionCalls).length > 0) && (
                <div className="mt-4 bg-gray-700 p-4 rounded-md">
                  <h3 className="font-bold mb-2">Function Call Frequency</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-2">Function</th>
                          <th className="text-right py-2">Calls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.functions.flatMap(func => 
                          Object.entries(func.details.functionCalls).map(([calledFunc, count]) => ({
                            caller: func.name,
                            calledFunc,
                            count
                          }))
                        )
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map((item, index) => (
                          <tr key={index} className="border-b border-gray-600">
                            <td className="py-2">{item.calledFunc} <span className="text-gray-400">(called by {item.caller})</span></td>
                            <td className="text-right py-2">{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on complexity
function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case "O(1)":
      return "bg-green-600 text-white";
    case "O(log n)":
      return "bg-green-500 text-white";
    case "O(n)":
      return "bg-blue-500 text-white";
    case "O(n log n)":
      return "bg-yellow-500 text-black";
    case "O(n²)":
      return "bg-orange-500 text-white";
    case "O(n³)":
      return "bg-red-500 text-white";
    case "O(2^n)":
      return "bg-red-600 text-white";
    case "O(n!)":
      return "bg-purple-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export default App;