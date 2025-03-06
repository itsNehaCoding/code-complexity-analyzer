import * as acorn from "acorn";

export function analyzeCode(code: string) {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020 });
    let loopCount = 0;
    let recursionDetected = false;

    function traverse(node: any) {
      if (!node) return;

      if (node.type === "FunctionDeclaration") {
        const functionName = node.id.name;
        const functionBody = code.substring(node.body.start, node.body.end);
        if (functionBody.includes(functionName)) recursionDetected = true;
      }

      if (node.type === "ForStatement" || node.type === "WhileStatement") {
        loopCount++;
      }

      for (const key in node) {
        if (typeof node[key] === "object") traverse(node[key]);
      }
    }

    traverse(ast);

    let complexity = "O(1)"; // Default constant time
    if (recursionDetected) complexity = "O(2^n) (Recursion)";
    else if (loopCount === 1) complexity = "O(n)";
    else if (loopCount > 1) complexity = "O(n^2)";

    return { complexity, loopCount, recursionDetected };
  } catch (error) {
    return { error: "Invalid JavaScript Code" };
  }
}
