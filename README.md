# 🚀 Code Complexity Analyzer

The **Code Complexity Analyzer** is a React + TypeScript web app that estimates the **time complexity (Big-O Notation)** of JavaScript/TypeScript functions. It helps developers quickly analyze and optimize their code for performance.

## 🔥 Features

- 📌 **Estimates Big-O Complexity** (O(1), O(n), O(n²), O(2ⁿ), etc.)
- ⚡ **Detects Loops and Recursion**
- 🛠️ **Fast Parsing using AST (Abstract Syntax Tree)**
- 🎨 **Modern UI with Tailwind CSS**
- 🔍 **Handles Syntax Errors Gracefully**


## 🚀 Installation & Running Locally

Make sure you have **Node.js (>= 16.x)** installed.

```sh
# 1️⃣ Clone the repository
git clone https://github.com/itsNehaCoding/code-complexity-analyzer.git

# 2️⃣ Navigate to the project folder
cd code-complexity-analyzer

# 3️⃣ Install dependencies
npm install

# 4️⃣ Start the development server
npm run dev
Now open http://localhost:5173/ in your browser! 🎉

🛠️ How It Works
1️⃣ Paste your JavaScript/TypeScript function in the textarea
2️⃣ Click "Analyze Code"
3️⃣ Get an estimated complexity result (O(1), O(n), O(n²), etc.)

Example:

Input Function:
js
Copy
Edit
function sumArray(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}
Output:
vbnet
Copy
Edit
Estimated Complexity: O(n)
Reason: Single loop iterating through the array.
🔄 Upcoming Work
✅ Enhance Complexity Detection

ts
Copy
Edit
// Add support for detecting logarithmic complexities (O(log n))
if (node.type === "BinaryExpression" && node.operator === "/") {
   complexity = "O(log n)";
}
✅ Add Function Call Graph Visualization

tsx
Copy
Edit
{/* Future feature: Show function execution flow */}
<FunctionGraph code={code} />
✅ Improve UI with Dark Mode & Code Editor

tsx
Copy
Edit
const [darkMode, setDarkMode] = useState(false);
📌 Contributing
Got ideas or found a bug? Feel free to open an issue or contribute! 😊

🏆 Author
Neha Bhele
🔗 GitHub: @itsNehaCoding

