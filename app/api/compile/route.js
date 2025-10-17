import { NextResponse } from "next/server";

export async function POST(req) {
  const { language, source, stdin } = await req.json();

  const provider = (process.env.CODE_RUN_PROVIDER || "judge0").toLowerCase();

  // Normalize output helper so UI can always read stdout/stderr/status
  const normalize = (payload) => {
    return {
      stdout: payload?.stdout || payload?.compile_output || "",
      stderr: payload?.stderr || payload?.message || payload?.exception || "",
      status:
        payload?.status?.description ||
        payload?.status ||
        (payload?.stderr || payload?.exception ? "Error" : "Success"),
      raw: payload || null,
    };
  };

  try {
    if (provider === "onecompiler") {
      // OneCompiler via RapidAPI
      const ONECOMPILER_RAPIDAPI_KEY = process.env.ONECOMPILER_RAPIDAPI_KEY;
      const ONECOMPILER_RAPIDAPI_HOST = process.env.ONECOMPILER_RAPIDAPI_HOST || "onecompiler-apis.p.rapidapi.com";
      const ONECOMPILER_URL = process.env.ONECOMPILER_URL || "https://onecompiler-apis.p.rapidapi.com/api/v1/run";

      if (!ONECOMPILER_RAPIDAPI_KEY) {
        return NextResponse.json(
          { error: "Missing OneCompiler environment variables" },
          { status: 500 }
        );
      }

      // Choose filename by language
      const fileNameByLang = {
        java: "Main.java",
        python: "main.py",
        c: "main.c",
        cpp: "main.cpp",
        javascript: "main.js",
        nodejs: "main.js",
        mysql: "main.sql",
        sql: "main.sql",
        r: "main.r",
      };
      const languageForOC = language === "javascript" ? "nodejs" : language;
      const fileName = fileNameByLang[languageForOC] || "main.txt";

      const ocRes = await fetch(ONECOMPILER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": ONECOMPILER_RAPIDAPI_KEY,
          "x-rapidapi-host": ONECOMPILER_RAPIDAPI_HOST,
        },
        body: JSON.stringify({
          language: languageForOC,
          version: "latest",
          files: [
            {
              name: fileName,
              content: source || "",
            },
          ],
          stdin: stdin || "",
        }),
      });

      const ocJson = await ocRes.json();
      return NextResponse.json(normalize(ocJson));
    }

    // Default: Judge0 via RapidAPI
    const langMap = {
      c: 50,
      cpp: 54,
      java: 62,
      python: 71,
      javascript: 63,
      r: 80,
      sql: 82,      // SQLite
      mysql: 82,    // Using SQLite for MySQL queries (Judge0)
    };
    const language_id = langMap[language] || 62; // fallback Java

    const JUDGE0_URL = process.env.JUDGE0_URL;
    const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
    const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

    if (!JUDGE0_URL || !JUDGE0_RAPIDAPI_KEY || !JUDGE0_RAPIDAPI_HOST) {
      return NextResponse.json(
        { error: "Missing Judge0 environment variables" },
        { status: 500 }
      );
    }

    const submissionRes = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": JUDGE0_RAPIDAPI_KEY,
          "X-RapidAPI-Host": JUDGE0_RAPIDAPI_HOST,
        },
        body: JSON.stringify({
          source_code: source,
          stdin: stdin || "",
          language_id,
        }),
      }
    );

    const result = await submissionRes.json();
    return NextResponse.json(normalize(result));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
