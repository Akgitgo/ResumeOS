// Provider-agnostic AI completion with automatic fallback chain.
//
// Order is controlled by AI_PROVIDER_CHAIN env var (comma separated),
// e.g. "gemini,groq,ollama,claude". The first provider that is configured
// (has an API key, or is reachable for ollama) AND succeeds wins.
//
// This means: if Gemini's free quota is exhausted or its key is missing,
// we silently fall through to the next provider - the app never hard-fails
// just because one provider is down.

import { AiCompletionResult } from "../types";

type ProviderName = "gemini" | "groq" | "ollama" | "claude";

interface ProviderCallResult {
  ok: boolean;
  text?: string;
  model?: string;
  error?: string;
}

async function callGemini(prompt: string): Promise<ProviderCallResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "no_key" };
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) return { ok: false, error: `gemini_http_${res.status}` };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false, error: "gemini_empty_response" };
    return { ok: true, text: text.trim(), model };
  } catch (e: any) {
    return { ok: false, error: `gemini_exception_${e?.message || "unknown"}` };
  }
}

async function callGroq(prompt: string): Promise<ProviderCallResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, error: "no_key" };
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });
    if (!res.ok) return { ok: false, error: `groq_http_${res.status}` };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return { ok: false, error: "groq_empty_response" };
    return { ok: true, text: text.trim(), model };
  } catch (e: any) {
    return { ok: false, error: `groq_exception_${e?.message || "unknown"}` };
  }
}

async function callOllama(prompt: string): Promise<ProviderCallResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      // short timeout-ish guard via AbortController could be added if needed
    });
    if (!res.ok) return { ok: false, error: `ollama_http_${res.status}` };
    const data = await res.json();
    const text = data?.response;
    if (!text) return { ok: false, error: "ollama_empty_response" };
    return { ok: true, text: text.trim(), model };
  } catch (e: any) {
    return { ok: false, error: `ollama_exception_${e?.message || "unknown"}` };
  }
}

async function callClaude(prompt: string): Promise<ProviderCallResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "no_key" };
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { ok: false, error: `claude_http_${res.status}` };
    const data = await res.json();
    const text = data?.content?.find((c: any) => c.type === "text")?.text;
    if (!text) return { ok: false, error: "claude_empty_response" };
    return { ok: true, text: text.trim(), model };
  } catch (e: any) {
    return { ok: false, error: `claude_exception_${e?.message || "unknown"}` };
  }
}

const PROVIDER_FNS: Record<ProviderName, (p: string) => Promise<ProviderCallResult>> = {
  gemini: callGemini,
  groq: callGroq,
  ollama: callOllama,
  claude: callClaude,
};

export interface ProviderAttempt {
  provider: ProviderName;
  status: "success" | "error" | "skipped";
  error?: string;
}

export interface CompletionWithLog {
  result: AiCompletionResult | null;
  attempts: ProviderAttempt[];
}

// Tries each provider in AI_PROVIDER_CHAIN order until one succeeds.
// Returns both the winning result (or null if ALL providers failed) and a
// log of every attempt - useful for writing to ai_provider_logs and for
// surfacing "AI is degraded" warnings in the UI.
export async function generateCompletion(prompt: string): Promise<CompletionWithLog> {
  const chainEnv = process.env.AI_PROVIDER_CHAIN || "gemini,groq,ollama,claude";
  const chain = chainEnv
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is ProviderName => p in PROVIDER_FNS);

  const attempts: ProviderAttempt[] = [];

  for (const provider of chain) {
    const fn = PROVIDER_FNS[provider];
    const result = await fn(prompt);
    if (result.ok && result.text) {
      attempts.push({ provider, status: "success" });
      return {
        result: { text: result.text, provider, model: result.model || "unknown" },
        attempts,
      };
    }
    attempts.push({
      provider,
      status: result.error === "no_key" ? "skipped" : "error",
      error: result.error,
    });
  }

  return { result: null, attempts };
}
