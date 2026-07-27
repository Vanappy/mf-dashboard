import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

type Provider = "openai" | "anthropic" | "google" | "moonshot";

// `LanguageModel` also allows a bare model-id string, which no provider returns.
type ResolvedModel = Exclude<LanguageModel, string>;

const MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1";

const providers: Record<Provider, (model: string) => ResolvedModel> = {
  openai: (model) => createOpenAI({ apiKey: process.env.AI_API_KEY })(model),
  anthropic: (model) => createAnthropic({ apiKey: process.env.AI_API_KEY })(model),
  google: (model) => createGoogleGenerativeAI({ apiKey: process.env.AI_API_KEY })(model),
  // Moonshot (Kimi) serves a Chat Completions-compatible API only. The default
  // OpenAI model targets the Responses API, which returns 404 there, so the
  // Chat Completions model must be selected explicitly.
  moonshot: (model) =>
    createOpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL ?? MOONSHOT_BASE_URL,
    }).chat(model),
};

export function isLLMEnabled(): boolean {
  return !!(process.env.AI_PROVIDER && process.env.AI_MODEL && process.env.AI_API_KEY);
}

export function getModel() {
  const provider = process.env.AI_PROVIDER as Provider;
  const model = process.env.AI_MODEL;

  if (!provider || !model) {
    throw new Error("AI_PROVIDER and AI_MODEL must be set");
  }

  if (!providers[provider]) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  return providers[provider](model);
}
