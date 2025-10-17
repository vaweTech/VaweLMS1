"use client";
import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";
import CheckAuth from "../../lib/CheckAuth";

// Default starter code snippets for each language
const defaultSnippets = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`,
  python: `print("Hello, Python!")`,
  c: `#include <stdio.h>
int main() {
    printf("Hello, C!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}`,
  javascript: `console.log("Hello, JavaScript!");`,
  mysql: `-- MySQL Query Example
SELECT 'Hello, MySQL!' AS message;

-- Create and query a sample table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

INSERT INTO users VALUES (1, 'John Doe');
SELECT * FROM users;`,
  sql: `-- SQL Query Example
SELECT 'Hello, SQL!' AS message;

-- Create and query a sample table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

INSERT INTO products VALUES (1, 'Product A', 99.99);
SELECT * FROM products;`,
  r: `# R Programming Example
print("Hello, R!")

# Simple calculation
x <- c(1, 2, 3, 4, 5)
mean_value <- mean(x)
cat("Mean:", mean_value, "\\n")`
};

export default function CompilerPage() {
  const [lang, setLang] = useState("cpp");
  const [code, setCode] = useState(defaultSnippets.cpp);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    setCode(defaultSnippets[newLang] || "");
  };

  const runCode = async () => {
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          source: code,
          stdin: stdin
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOutput(data.stdout || data.stderr || "No output");
      } else {
        setOutput("Error: " + data.error);
      }
    } catch (err) {
      setOutput("Request failed: " + err.message);
    }
  };

  return (
    <CheckAuth>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Online Compiler</h1>

        {/* Language Selector */}
        <select
          value={lang}
          onChange={handleLangChange}
          className="border p-2 sm:p-3 rounded mb-4 text-sm sm:text-base w-full sm:w-auto"
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="javascript">JavaScript</option>
          <option value="r">R</option>
          <option value="mysql">MySQL</option>
          <option value="sql">SQL (SQLite)</option>
        </select>

        {/* Code Editor */}
        <div className="mb-4">
          <CodeEditor language={lang} code={code} setCode={setCode} />
        </div>

        {/* Standard Input */}
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Standard input (optional)"
          className="w-full h-16 sm:h-20 border border-gray-300 rounded p-2 sm:p-3 mt-4 text-sm sm:text-base"
        />

        {/* Run Button */}
        <button
          onClick={runCode}
          className="bg-blue-500 text-white px-4 py-2 sm:py-3 rounded mt-4 hover:bg-blue-600 text-sm sm:text-base font-medium"
        >
          Run Code
        </button>

        {/* Output */}
        <pre className="bg-gray-100 p-3 sm:p-4 mt-4 rounded whitespace-pre-wrap text-xs sm:text-sm">{output}</pre>
      </div>
    </CheckAuth>
  );
}