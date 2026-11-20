"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaChat = void 0;
const env_1 = require("./env");
const api_error_1 = __importDefault(require("../utils/api-error"));
const isRecord = (value) => typeof value === "object" && value !== null;
const ollamaChat = async (messages, options = {}) => {
    let response;
    try {
        response = await fetch(`${env_1.env.ollamaBaseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: env_1.env.ollamaModel,
                messages,
                stream: false,
                ...(options.format ? { format: options.format } : {}),
            }),
            signal: AbortSignal.timeout(60_000),
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            throw new api_error_1.default(504, "Ollama did not respond before the request timed out");
        }
        if (error instanceof TypeError) {
            throw new api_error_1.default(503, "Unable to connect to Ollama. Check that the local Ollama service is running.");
        }
        throw error;
    }
    if (!response.ok) {
        throw new api_error_1.default(503, `Ollama request failed with status ${response.status}`);
    }
    let payload;
    try {
        payload = await response.json();
    }
    catch {
        throw new api_error_1.default(502, "Ollama returned an invalid response");
    }
    if (!isRecord(payload) || !isRecord(payload.message)) {
        throw new api_error_1.default(502, "Ollama returned an invalid response");
    }
    const content = payload.message.content;
    if (typeof content !== "string" || !content.trim()) {
        throw new api_error_1.default(502, "Ollama returned an empty response");
    }
    return content.trim();
};
exports.ollamaChat = ollamaChat;
