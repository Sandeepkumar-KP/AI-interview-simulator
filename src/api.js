// src/api.js — Anthropic API integration layer

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";

export async function sendMessage({ apiKey, systemPrompt, messages, onChunk }) {
  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: !!onChunk,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new APIError(msg, response.status);
  }

  if (onChunk) {
    return streamResponse(response, onChunk);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

async function streamResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta") {
          const token = parsed.delta?.text ?? "";
          fullText += token;
          onChunk(token);
        }
      } catch {}
    }
  }

  return fullText;
}

export async function validateApiKey(apiKey) {
  try {
    await sendMessage({
      apiKey,
      systemPrompt: "You are a test assistant.",
      messages: [{ role: "user", content: "ping" }],
    });
    return true;
  } catch (err) {
    if (err instanceof APIError && err.status === 401) return false;
    throw err;
  }
}

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}
