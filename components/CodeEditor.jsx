"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeEditor({ language = "java", starterCode = "" }) {
  const [code, setCode] = useState(starterCode || getDefaultStarter(language));
  const [output, setOutput] = useState("");

  // ✅ Update code when language changes
  useEffect(() => {
    setCode(starterCode || getDefaultStarter(language));
  }, [language, starterCode]);

  async function runCode() {
    setOutput("Running...");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, source: code, stdin: "" }),
      });
      const data = await res.json();
      const stdout = data.stdout || data.compile_output || data.stderr || "";
      setOutput(stdout);
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  }

  return (
    <div>
      <div className="h-64 sm:h-80 lg:h-96 border rounded">
        <MonacoEditor
          height="100%"
          language={mapLanguage(language)}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{ fontSize: 12, minimap: { enabled: false } }}
          path="main.js"
        />
      </div>
      <button
        onClick={runCode}
        className="mt-4 bg-green-600 text-white px-4 py-2 sm:py-3 rounded text-sm sm:text-base font-medium"
      >
        Run
      </button>
      <pre className="mt-4 p-2 sm:p-3 bg-black text-white rounded text-xs sm:text-sm">{output}</pre>
    </div>
  );
}

function getDefaultStarter(lang) {
  if (lang === "java")
    return `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}`;
  if (lang === "python") return `print("Hello, Python!")`;
  if (lang === "c") return `#include <stdio.h>\nint main(){\n  printf("Hello, C!\\n");\n  return 0;\n}`;
  if (lang === "cpp") return `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, C++!" << endl;\n  return 0;\n}`;
  if (lang === "javascript") return `console.log("Hello, JavaScript!");`;
  if (lang === "r") return `# R Programming Example\nprint("Hello, R!")\n\n# Simple calculation\nx <- c(1, 2, 3, 4, 5)\nmean_value <- mean(x)\ncat("Mean:", mean_value, "\\n")`;
  if (lang === "mysql") return `-- MySQL Query Example\nSELECT 'Hello, MySQL!' AS message;\n\n-- Create and query a sample table\nCREATE TABLE IF NOT EXISTS users (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);\n\nINSERT INTO users VALUES (1, 'John Doe');\nSELECT * FROM users;`;
  if (lang === "sql") return `-- SQL Query Example\nSELECT 'Hello, SQL!' AS message;\n\n-- Create and query a sample table\nCREATE TABLE IF NOT EXISTS products (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  price DECIMAL(10,2)\n);\n\nINSERT INTO products VALUES (1, 'Product A', 99.99);\nSELECT * FROM products;`;
  return "";
}

function mapLanguage(lang) {
  if (lang === "java") return "java";
  if (lang === "python") return "python";
  if (lang === "c") return "c";
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  if (lang === "r") return "r";
  if (lang === "mysql" || lang === "sql") return "sql";
  return "plaintext";
}
