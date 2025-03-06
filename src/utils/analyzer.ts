import * as acorn from "acorn";
import * as walk from "acorn-walk";

export enum TimeComplexity {
  CONSTANT = "O(1)",
  LOGARITHMIC = "O(log n)",
  LINEAR = "O(n)",
  LINEARITHMIC = "O(n log n)",
  QUADRATIC = "O(n²)",
  CUBIC = "O(n³)",
  EXPONENTIAL = "O(2^n)",
  FACTORIAL = "O(n!)"
}

export interface AnalysisResult {
  complexity: string;
  details: {
    loopCount: number;
    nestedLoopDepth: number;
    recursionDetected: boolean;
    recursiveFunctions: string[];
    functionCalls: { [name: string]: number };
    expressionComplexity: number;
  };
  error?: string;
}

export function analyzeCode(code: string): AnalysisResult {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: "module" });

    const analysis: AnalysisResult = {
      complexity: TimeComplexity.CONSTANT,
      details: {
        loopCount: 0,
        nestedLoopDepth: 0,
        recursionDetected: false,
        recursiveFunctions: [],
        functionCalls: {},
        expressionComplexity: 0
      }
    };

    const functionStack: string[] = [];
    let maxLoopDepth = 0;
    let currentLoopDepth = 0;
    const functionDeclarations = new Set<string>();

    walk.recursive(ast, {}, {
      FunctionDeclaration(node: any, state: any, c) {
        if (node.id && node.id.name) {
          functionDeclarations.add(node.id.name);
          functionStack.push(node.id.name);
          c(node.body, state);
          functionStack.pop();
        }
      },
      VariableDeclarator(node: any, state: any, c) {
        // Handle function expressions or arrow functions assigned to variables
        if (node.id.type === "Identifier" && (node.init?.type === "FunctionExpression" || node.init?.type === "ArrowFunctionExpression")) {
          functionDeclarations.add(node.id.name);
          functionStack.push(node.id.name);
          c(node.init.body, state);
          functionStack.pop();
        }
      },
      CallExpression(node: any) {
        if (node.callee.type === "Identifier") {
          const functionName = node.callee.name;
          analysis.details.functionCalls[functionName] = (analysis.details.functionCalls[functionName] || 0) + 1;

          if (functionStack.includes(functionName)) {
            analysis.details.recursionDetected = true;
            if (!analysis.details.recursiveFunctions.includes(functionName)) {
              analysis.details.recursiveFunctions.push(functionName);
            }
          }

          // Detect multiple self-calls (Exponential complexity)
          if (functionStack.length > 0 && functionStack[functionStack.length - 1] === functionName) {
            const selfCallCount = node.arguments.length; // Rough estimation
            if (selfCallCount > 1) {
              analysis.complexity = TimeComplexity.EXPONENTIAL;
            }
          }
        }
      }
    });


    analysis.details.nestedLoopDepth = maxLoopDepth;
    analysis.complexity = determineComplexity(analysis);
    return analysis;
  } catch (error: any) {
    return { complexity: "Unknown", details: { loopCount: 0, nestedLoopDepth: 0, recursionDetected: false, recursiveFunctions: [], functionCalls: {}, expressionComplexity: 0 }, error: error.message };
  }
}

function determineComplexity(analysis: AnalysisResult): string {
  if (analysis.details.recursionDetected) return TimeComplexity.EXPONENTIAL;
  if (analysis.details.nestedLoopDepth >= 3) return TimeComplexity.CUBIC;
  if (analysis.details.nestedLoopDepth === 2) return TimeComplexity.QUADRATIC;
  if (analysis.details.loopCount > 0) return TimeComplexity.LINEAR;
  return TimeComplexity.CONSTANT;
}


// Export additional utility functions
export function explainComplexity(complexity: string): string {
  const explanations: Record<TimeComplexity, string> = {
    [TimeComplexity.CONSTANT]: "Constant time complexity means the execution time doesn't change regardless of input size.",
    [TimeComplexity.LOGARITHMIC]: "Logarithmic time complexity grows very slowly as input size increases, common in divide-and-conquer algorithms.",
    [TimeComplexity.LINEAR]: "Linear time complexity means execution time grows proportionally to input size.",
    [TimeComplexity.LINEARITHMIC]: "Linearithmic time complexity (n log n) is common in efficient sorting algorithms like mergesort.",
    [TimeComplexity.QUADRATIC]: "Quadratic time complexity means execution time grows with the square of input size, common in nested loops.",
    [TimeComplexity.CUBIC]: "Cubic time complexity means execution time grows with the cube of input size, seen in triple-nested loops.",
    [TimeComplexity.EXPONENTIAL]: "Exponential time complexity grows extremely quickly with input size, common in naive recursive solutions.",
    [TimeComplexity.FACTORIAL]: "Factorial time complexity grows even faster than exponential, common in algorithms generating all permutations."
  };

  return explanations[complexity as TimeComplexity] ||
    "Unknown complexity pattern. Analysis may be incomplete.";
}

export function getOptimizationSuggestions(analysis: AnalysisResult): string[] {
  const suggestions: string[] = [];

  // Recursion optimization
  if (analysis.details.recursionDetected) {
    suggestions.push("Consider using dynamic programming or memoization to optimize recursive functions.");
    suggestions.push("Evaluate if tail recursion can be used or if the recursive solution can be rewritten iteratively.");
  }

  // Loop optimizations
  if (analysis.details.nestedLoopDepth > 1) {
    suggestions.push("Consider if nested loops can be reduced or eliminated using more efficient data structures.");
    suggestions.push("Look for opportunities to break early from loops when a condition is met.");
  }

  return suggestions;
}

// Helper function to analyze and provide examples of bottlenecks
export function findBottlenecks(analysis: AnalysisResult): string[] {
  const bottlenecks: string[] = [];

  if (analysis.details.nestedLoopDepth > 1) {
    bottlenecks.push(`Nested loops with depth ${analysis.details.nestedLoopDepth} create a performance bottleneck.`);
  }

  if (analysis.details.recursionDetected && analysis.details.recursiveFunctions.length > 0) {
    bottlenecks.push(`Recursive functions without optimization: ${analysis.details.recursiveFunctions.join(", ")}`);
  }

  // Find most called functions
  const functionCalls = analysis.details.functionCalls;
  const sortedFunctions = Object.entries(functionCalls)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (sortedFunctions.length > 0) {
    bottlenecks.push(`Most frequently called functions: ${sortedFunctions.map(([name, count]) => `${name} (${count} calls)`).join(", ")}`);
  }

  return bottlenecks;
}