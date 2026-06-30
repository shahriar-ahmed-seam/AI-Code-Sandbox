import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const LANGUAGE_NAMES: Record<string, string> = {
  python: "Python 3.12",
  node: "JavaScript (Node.js 20)",
  go: "Go 1.22",
};

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return trimmed;
}

function systemPrompt(language: string): string {
  const name = LANGUAGE_NAMES[language] ?? language;
  return [
    `You are an expert ${name} programmer powering a code sandbox.`,
    `Generate a single, complete, runnable ${name} program that fulfills the user's request.`,
    `Rules:`,
    `- Output ONLY the source code. No markdown fences, no comments explaining your reasoning, no prose.`,
    `- The program must run as-is and print a meaningful result to stdout.`,
    `- Use only the standard library (no network access, no third-party packages).`,
    `- Keep it concise and correct.`,
  ].join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured (missing OPENROUTER_API_KEY)." },
      { status: 501 },
    );
  }

  let body: { prompt?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  const language = (body.language ?? "python").trim().toLowerCase();
  if (!prompt) {
    return NextResponse.json({ error: "Describe what you want to build." }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt is too long." }, { status: 413 });
  }

  const models = (process.env.OPENROUTER_MODELS ?? "qwen/qwen3-coder:free")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  let lastStatus = 502;
  let lastError = "All models are busy. Free models are rate-limited — try again in a moment.";

  for (const model of models) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "AI-Code-Sandbox",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 800,
          messages: [
            { role: "system", content: systemPrompt(language) },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429) {
        lastStatus = 429;
        lastError = "Rate limited by the free model tier. Try again in a few seconds.";
        continue;
      }
      if (!res.ok) {
        lastStatus = 502;
        lastError = `Model "${model}" is unavailable.`;
        continue;
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      const code = stripFences(content);
      if (!code) {
        lastError = "The model returned an empty response.";
        continue;
      }
      return NextResponse.json({ code, model });
    } catch {
      lastStatus = 502;
      lastError = "Could not reach the AI provider.";
    }
  }

  return NextResponse.json({ error: lastError }, { status: lastStatus });
}
