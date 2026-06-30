export interface GenerateResult {
  code: string;
  model: string;
}

export async function generateCode(prompt: string, language: string): Promise<GenerateResult> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, language }),
    });
  } catch {
    throw new Error("Could not reach the generator. Check your connection.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? "Generation failed.");
  }
  return data as GenerateResult;
}
