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

export interface FunctionAnalysis {
  name: string;
  startLine: number;
  endLine: number;
  body: string;
  complexity: TimeComplexity;
  details: {
    loopCount: number;
    nestedLoopDepth: number;
    recursionDetected: boolean;
    recursiveCallCount: number;
    functionCalls: Record<string, number>;
    divideAndConquer: boolean;
    logarithmicOperations: boolean;
    linearOperations: boolean;
    binarySearchPattern: boolean;
    recursiveBinarySearch: boolean;
  };
}

export interface AnalysisResult {
  overallComplexity: TimeComplexity;
  functions: FunctionAnalysis[];
  error?: string;
}

export function analyzeCode(code: string): AnalysisResult {
  try {
    const ast = acorn.parse(code, { 
      ecmaVersion: 2022, 
      sourceType: "module",
      locations: true 
    });

    const functions: FunctionAnalysis[] = [];
    let overallComplexity = TimeComplexity.CONSTANT;
    
    function analyzeFunction(name: string, node: any) {
      const startLine = node.loc?.start.line || 0;
      const endLine = node.loc?.end.line || 0;
      const bodyText = extractFunctionBody(node, code);
      
      const analysis: FunctionAnalysis = {
        name,
        startLine,
        endLine,
        body: bodyText,
        complexity: TimeComplexity.CONSTANT,
        details: initFunctionDetails()
      };
      
      const loopDepths = { currentLoopDepth: 0, maxLoopDepth: 0 };

      walk.recursive(node, {
        functionName: name,
        inLoop: false
      }, createVisitors(analysis, loopDepths));
      
      analysis.details.nestedLoopDepth = loopDepths.maxLoopDepth;
      analysis.complexity = determineComplexity(analysis);
      
      if (compareComplexity(analysis.complexity, overallComplexity) > 0) {
        overallComplexity = analysis.complexity;
      }
      
      functions.push(analysis);
    }
    
    walk.recursive(ast, {}, createFunctionVisitors(analyzeFunction));
    
    return {
      overallComplexity,
      functions
    };
    
  } catch (error: any) {
    return {
      overallComplexity: TimeComplexity.CONSTANT,
      functions: [],
      error: `Error parsing code: ${error.message}`
    };
  }
}

function extractFunctionBody(node: any, code: string): string {
  try {
    return code.substring(node.start, node.end);
  } catch (e) {
    return "";
  }
}

function initFunctionDetails() {
  return {
    loopCount: 0,
    nestedLoopDepth: 0,
    recursionDetected: false,
    recursiveCallCount: 0,
    functionCalls: {},
    divideAndConquer: false,
    logarithmicOperations: false,
    linearOperations: false,
    binarySearchPattern: false,
    recursiveBinarySearch: false
  };
}

function createVisitors(analysis: FunctionAnalysis, loopDepths: { currentLoopDepth: number, maxLoopDepth: number }) {
  return {
    CallExpression(node: any, state: any, callback: any) {
      handleCallExpression(node, state, callback, analysis);
    },
    
    ForStatement: createLoopVisitor(analysis, loopDepths),
    ForInStatement: createLoopVisitor(analysis, loopDepths),
    ForOfStatement: createLoopVisitor(analysis, loopDepths),
    WhileStatement: createLoopVisitor(analysis, loopDepths),
    DoWhileStatement: createLoopVisitor(analysis, loopDepths),
    
    BinaryExpression(node: any, state: any, callback: any) {
      handleBinaryExpression(node, state, callback, analysis);
    },
    
    MemberExpression(node: any, state: any, callback: any) {
      handleMemberExpression(node, state, callback, analysis);
    },
    
    UnaryExpression(node: any, state: any, callback: any) {
      handleUnaryExpression(node, state, callback, analysis);
    }
  };
}

function createLoopVisitor(analysis: FunctionAnalysis, loopDepths: { currentLoopDepth: number, maxLoopDepth: number }) {
  return function(node: any, state: any, callback: any) {
    analysis.details.loopCount++;
    loopDepths.currentLoopDepth++;
    loopDepths.maxLoopDepth = Math.max(loopDepths.maxLoopDepth, loopDepths.currentLoopDepth);
    
    const oldInLoop = state.inLoop;
    state.inLoop = true;
    
    visitLoopChildren(node, state, callback);
    
    state.inLoop = oldInLoop;
    loopDepths.currentLoopDepth--;
  };
}

function visitLoopChildren(node: any, state: any, callback: any) {
  if (node.init) callback(node.init, state);
  if (node.test) callback(node.test, state);
  if (node.update) callback(node.update, state);
  if (node.left) callback(node.left, state);
  if (node.right) callback(node.right, state);
  if (node.body) callback(node.body, state);
}

function handleCallExpression(node: any, state: any, callback: any, analysis: FunctionAnalysis) {
  if (node.callee.type === "Identifier") {
    const calleeName = node.callee.name;
    analysis.details.functionCalls[calleeName] = 
      (analysis.details.functionCalls[calleeName] || 0) + 1;
      
    if (calleeName === state.functionName) {
      analysis.details.recursionDetected = true;
      analysis.details.recursiveCallCount++;
      
      if (isRecursiveBinarySearch(node, analysis)) {
        analysis.details.recursiveBinarySearch = true;
        analysis.details.logarithmicOperations = true;
        analysis.details.divideAndConquer = false;
      }
    }
  }
  
  if (isLinearArrayMethod(node)) {
    analysis.details.linearOperations = true;
    
    if (analysis.details.recursionDetected) {
      analysis.details.divideAndConquer = true;
    }
  }
  else if (isDivideAndConquerArrayMethod(node) && analysis.details.recursionDetected) {
    analysis.details.divideAndConquer = true;
  }
  
  if (isMathOperation(node)) {
    analysis.details.logarithmicOperations = true;
  }
  
  if (node.arguments) {
    node.arguments.forEach((arg: any) => callback(arg, state));
  }
  
  if (node.callee.type !== "Identifier") {
    callback(node.callee, state);
  }
}

function isRecursiveBinarySearch(node: any, analysis: FunctionAnalysis): boolean {
  if (node.arguments.length < 3) return false;
  
  const hasRequiredPatterns = 
    analysis.body.includes("Math.floor") && 
    analysis.body.includes("/2") && 
    analysis.body.includes("return") && 
    !analysis.body.includes("concat") && 
    !analysis.body.includes("push");
  
  if (!hasRequiredPatterns) return false;
  
  return node.arguments.some((arg: any) => {
    return arg.type === "BinaryExpression" && 
           (arg.operator === "+" || arg.operator === "-") &&
           arg.right.type === "Literal" && 
           arg.right.value === 1;
  });
}

function isLinearArrayMethod(node: any): boolean {
  if (node.callee.type !== "MemberExpression" || 
      node.callee.property.type !== "Identifier") {
    return false;
  }
  
  const methodName = node.callee.property.name;
  return ["filter", "map", "reduce", "forEach", "find", "some", "every", "flatMap"].includes(methodName);
}

function isDivideAndConquerArrayMethod(node: any): boolean {
  if (node.callee.type !== "MemberExpression" || 
      node.callee.property.type !== "Identifier") {
    return false;
  }
  
  const methodName = node.callee.property.name;
  return ["slice", "concat", "splice"].includes(methodName);
}

function isMathOperation(node: any): boolean {
  return node.callee.type === "MemberExpression" && 
         node.callee.object.type === "Identifier" && 
         node.callee.object.name === "Math" &&
         node.callee.property.type === "Identifier" && 
         ["log", "floor", "ceil"].includes(node.callee.property.name);
}

function handleBinaryExpression(node: any, state: any, callback: any, analysis: FunctionAnalysis) {
  if (node.operator === "/" || node.operator === "/=") {
    if (analysis.details.recursionDetected) {
      analysis.details.divideAndConquer = true;
    }
    else if (node.right.type === "Literal") {
      if (isBinarySearchPattern(state, analysis, node)) {
        analysis.details.binarySearchPattern = true;
        analysis.details.logarithmicOperations = true;
      }
      else if (isRecursiveBinarySearchPattern(analysis, node)) {
        analysis.details.recursiveBinarySearch = true;
        analysis.details.logarithmicOperations = true;
        analysis.details.divideAndConquer = false;
      }
      else {
        analysis.details.divideAndConquer = true;
      }
    }
  }
  
  if (isComparisonOperator(node.operator) && analysis.details.recursionDetected && state.inLoop) {
    analysis.details.divideAndConquer = true;
  }
  
  if (node.left) callback(node.left, state);
  if (node.right) callback(node.right, state);
}

function isBinarySearchPattern(state: any, analysis: FunctionAnalysis, node: any): boolean {
  return state.inLoop && 
         !analysis.details.recursionDetected && 
         (analysis.body.includes("=") || analysis.body.includes("+=") || analysis.body.includes("-=")) && 
         (analysis.body.includes("<") || analysis.body.includes(">")) && 
         node.right.value === 2;
}

function isRecursiveBinarySearchPattern(analysis: FunctionAnalysis, node: any): boolean {
  return analysis.details.recursionDetected && 
         node.right.value === 2 && 
         (analysis.body.includes("<") || analysis.body.includes(">")) && 
         analysis.body.includes("return") && 
         (analysis.body.includes("mid") || analysis.body.includes("middle") || 
          analysis.body.includes("left") || analysis.body.includes("right"));
}

function isComparisonOperator(operator: string): boolean {
  return ["<", ">", "<=", ">="].includes(operator);
}

function handleMemberExpression(node: any, state: any, callback: any, analysis: FunctionAnalysis) {
  if (node.computed && analysis.details.recursionDetected) {
    analysis.details.divideAndConquer = true;
  }
  
  if (node.property && node.property.type === "Identifier" && analysis.details.recursionDetected) {
    const methodName = node.property.name;
    if (["filter", "map", "reduce", "slice", "concat", "splice"].includes(methodName)) {
      analysis.details.divideAndConquer = true;
    }
  }
  
  if (node.object) callback(node.object, state);
  if (node.property) callback(node.property, state);
}

function handleUnaryExpression(node: any, state: any, callback: any, analysis: FunctionAnalysis) {
  if ([">>>", ">>", "<<"].includes(node.operator)) {
    if (state.inLoop || analysis.details.recursionDetected) {
      analysis.details.divideAndConquer = true;
    }
  }
  
  if (node.argument) callback(node.argument, state);
}

function createFunctionVisitors(analyzeFunction: Function) {
  return {
    FunctionDeclaration(node: any) {
      if (node.id && node.id.name) {
        analyzeFunction(node.id.name, node.body);
      }
    },
    
    VariableDeclarator(node: any) {
      if (node.id && node.id.type === "Identifier" && 
          (node.init?.type === "FunctionExpression" || 
           node.init?.type === "ArrowFunctionExpression")) {
        analyzeFunction(node.id.name, node.init.body);
      }
    },
    
    MethodDefinition(node: any) {
      if (node.key && node.key.type === "Identifier") {
        analyzeFunction(node.key.name, node.value.body);
      }
    },
    
    ArrowFunctionExpression(node: any) {
      if (node.parent?.type === "VariableDeclarator" && 
          node.parent.id.type === "Identifier") {
        analyzeFunction(node.parent.id.name, node.body);
      } else {
        analyzeFunction("anonymous", node.body);
      }
    }
  };
}

function determineComplexity(analysis: FunctionAnalysis): TimeComplexity {
  const { 
    loopCount, 
    nestedLoopDepth, 
    recursionDetected, 
    divideAndConquer,
    logarithmicOperations
  } = analysis.details;
  
  if (analysis.details.recursiveBinarySearch) {
    return TimeComplexity.LOGARITHMIC;
  }
  
  if (isRecursiveBinarySearchByStructure(analysis)) {
    return TimeComplexity.LOGARITHMIC;
  }
  
  if (recursionDetected) {
    if (isRecursiveLogarithmicAlgorithm(analysis)) {
      return TimeComplexity.LOGARITHMIC;
    }
    
    if (isDivideAndConquerAlgorithm(analysis)) {
      return TimeComplexity.LINEARITHMIC;
    }
    
    if (hasMultipleRecursiveCalls(analysis)) {
      return TimeComplexity.EXPONENTIAL;
    }
    
    if (isFactorialComplexity(analysis, nestedLoopDepth)) {
      return TimeComplexity.FACTORIAL;
    }
    
    return TimeComplexity.EXPONENTIAL;
  }
  
  if (nestedLoopDepth >= 3) {
    return TimeComplexity.CUBIC;
  }
  
  if (nestedLoopDepth === 2) {
    return TimeComplexity.QUADRATIC;
  }
  
  if (analysis.details.binarySearchPattern) {
    return TimeComplexity.LOGARITHMIC;
  }
  
  if (divideAndConquer && loopCount > 0) {
    return TimeComplexity.LINEARITHMIC;
  }
  
  if (loopCount > 0 || analysis.details.linearOperations) {
    return TimeComplexity.LINEAR;
  }
  
  if (divideAndConquer || logarithmicOperations) {
    return TimeComplexity.LOGARITHMIC;
  }
  
  return TimeComplexity.CONSTANT;
}

function isRecursiveBinarySearchByStructure(analysis: FunctionAnalysis): boolean {
  return analysis.details.recursionDetected && 
         (analysis.body.includes("/2") || analysis.body.includes("/ 2")) && 
         (analysis.body.includes("<") || analysis.body.includes(">") || 
          analysis.body.includes("===") || analysis.body.includes("==")) && 
         !analysis.body.includes("concat") && 
         !analysis.body.includes("push") && 
         !analysis.body.includes("splice") && 
         analysis.body.includes("return");
}

function isRecursiveLogarithmicAlgorithm(analysis: FunctionAnalysis): boolean {
  return (analysis.body.includes("Math.floor") || 
          analysis.body.includes("Math.ceil") || 
          analysis.body.includes("parseInt") || 
          analysis.body.includes(">>1") || 
          analysis.body.includes(">>>1")) && 
         analysis.body.includes("/2") && 
         analysis.body.includes("return") && 
         (analysis.body.includes("<") || analysis.body.includes(">") || 
          analysis.body.includes("===") || analysis.body.includes("==")) && 
         analysis.details.recursiveCallCount <= 2;
}

function isDivideAndConquerAlgorithm(analysis: FunctionAnalysis): boolean {
  const hasArrayMethodCalls = analysis.body.includes('.filter(') || 
                              analysis.body.includes('.map(') || 
                              analysis.body.includes('.reduce(') || 
                              analysis.body.includes('.slice(');
  
  return analysis.details.divideAndConquer || 
         hasArrayMethodCalls ||
         analysis.details.loopCount > 0 || 
         Object.keys(analysis.details.functionCalls).some(name => 
           name !== analysis.name && 
           analysis.details.functionCalls[name] > 0);
}

function hasMultipleRecursiveCalls(analysis: FunctionAnalysis): boolean {
  return Object.entries(analysis.details.functionCalls).some(([name, count]) => 
    name === analysis.name && count >= 2 && !analysis.details.recursiveBinarySearch);
}

function isFactorialComplexity(analysis: FunctionAnalysis, nestedLoopDepth: number): boolean {
  return nestedLoopDepth > 0 && Object.keys(analysis.details.functionCalls).length > 2;
}

function compareComplexity(a: TimeComplexity, b: TimeComplexity): number {
  const order = [
    TimeComplexity.CONSTANT,
    TimeComplexity.LOGARITHMIC,
    TimeComplexity.LINEAR,
    TimeComplexity.LINEARITHMIC,
    TimeComplexity.QUADRATIC,
    TimeComplexity.CUBIC,
    TimeComplexity.EXPONENTIAL,
    TimeComplexity.FACTORIAL
  ];
  
  return order.indexOf(a) - order.indexOf(b);
}

export function explainComplexity(complexity: TimeComplexity): string {
  switch (complexity) {
    case TimeComplexity.CONSTANT:
      return "O(1) - Constant time: The execution time is independent of input size.";
    case TimeComplexity.LOGARITHMIC:
      return "O(log n) - Logarithmic time: The execution time grows logarithmically with input size.";
    case TimeComplexity.LINEAR:
      return "O(n) - Linear time: The execution time grows linearly with input size.";
    case TimeComplexity.LINEARITHMIC:
      return "O(n log n) - Linearithmic time: The execution time grows by n log n with input size.";
    case TimeComplexity.QUADRATIC:
      return "O(n²) - Quadratic time: The execution time grows with the square of input size.";
    case TimeComplexity.CUBIC:
      return "O(n³) - Cubic time: The execution time grows with the cube of input size.";
    case TimeComplexity.EXPONENTIAL:
      return "O(2^n) - Exponential time: The execution time doubles with each additional input element.";
    case TimeComplexity.FACTORIAL:
      return "O(n!) - Factorial time: The execution time grows factorially with input size.";
    default:
      return "Unknown complexity";
  }
}

export function getOptimizationSuggestions(result: AnalysisResult): string[] {
  const suggestions: string[] = [];
  
  result.functions.forEach(func => {
    if (func.complexity === TimeComplexity.FACTORIAL || func.complexity === TimeComplexity.EXPONENTIAL) {
      suggestions.push(`Function ${func.name}: Consider using dynamic programming or memoization to optimize recursive solutions.`);
    }
    
    if (func.complexity === TimeComplexity.CUBIC) {
      suggestions.push(`Function ${func.name}: Consider reducing the nested loop depth or using more efficient data structures.`);
    }
    
    if (func.complexity === TimeComplexity.QUADRATIC && func.details.loopCount > 1) {
      suggestions.push(`Function ${func.name}: Look for opportunities to reduce nested loops to improve efficiency.`);
    }
    
    if (func.details.recursionDetected) {
      suggestions.push(`Function ${func.name}: Evaluate if recursion can be replaced with iteration for better performance.`);
    }
  });
  
  return suggestions;
}

export function findBottlenecks(result: AnalysisResult): string[] {
  const bottlenecks: string[] = [];
  
  result.functions.forEach(func => {
    if (func.complexity === TimeComplexity.FACTORIAL || func.complexity === TimeComplexity.EXPONENTIAL) {
      bottlenecks.push(`Critical bottleneck in ${func.name}: ${func.complexity} complexity will cause exponential slowdown with larger inputs.`);
    }
    
    if (func.complexity === TimeComplexity.CUBIC) {
      bottlenecks.push(`Major bottleneck in ${func.name}: Nested loops with depth ${func.details.nestedLoopDepth} create cubic complexity.`);
    }
    
    if (func.complexity === TimeComplexity.QUADRATIC) {
      bottlenecks.push(`Significant bottleneck in ${func.name}: Nested loops with depth ${func.details.nestedLoopDepth} create quadratic complexity.`);
    }
    
    if (func.details.recursionDetected) {
      bottlenecks.push(`Potential bottleneck in ${func.name}: Recursive function calls without optimization.`);
    }
  });
  
  return bottlenecks;
}