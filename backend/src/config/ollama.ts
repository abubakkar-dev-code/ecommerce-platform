import { env } from "./env";
import ApiError from "../utils/api-error";

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaOptions = {
  format?: "json";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const ollamaChat = async (
  messages: OllamaMessage[],
  options: OllamaOptions = {},
): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollamaModel,
        messages,
        stream: false,
        ...(options.format ? { format: options.format } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ApiError(504, "Ollama did not respond before the request timed out");
    }
    if (error instanceof TypeError) {
      throw new ApiError(
        503,
        "Unable to connect to Ollama. Check that the local Ollama service is running.",
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new ApiError(503, `Ollama request failed with status ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(502, "Ollama returned an invalid response");
  }
  if (!isRecord(payload) || !isRecord(payload.message)) {
    throw new ApiError(502, "Ollama returned an invalid response");
  }

  const content = payload.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(502, "Ollama returned an empty response");
  }

  return content.trim();
};
