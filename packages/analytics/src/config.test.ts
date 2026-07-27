import { afterEach, describe, expect, it } from "vitest";
import { getModel, isLLMEnabled } from "./config.js";

const originalEnv = { ...process.env };

describe("isLLMEnabled", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each(["AI_PROVIDER", "AI_MODEL", "AI_API_KEY"])("requires %s", (missingVariable) => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "test-model";
    process.env.AI_API_KEY = "test-api-key";
    delete process.env[missingVariable];

    expect(isLLMEnabled()).toBe(false);
  });

  it("is enabled when every variable is configured", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "test-model";
    process.env.AI_API_KEY = "test-api-key";

    expect(isLLMEnabled()).toBe(true);
  });
});

describe("getModel", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each(["openai", "anthropic", "google", "moonshot"])("resolves the %s provider", (provider) => {
    process.env.AI_PROVIDER = provider;
    process.env.AI_MODEL = "test-model";
    process.env.AI_API_KEY = "test-api-key";

    expect(getModel().modelId).toBe("test-model");
  });

  it("uses the Chat Completions model for moonshot", () => {
    process.env.AI_PROVIDER = "moonshot";
    process.env.AI_MODEL = "kimi-k3";
    process.env.AI_API_KEY = "test-api-key";

    // The Responses API model reports "openai.responses"; Moonshot only serves
    // Chat Completions, so the provider must resolve to the chat model.
    expect(getModel().provider).toBe("openai.chat");
  });

  it("rejects an unknown provider", () => {
    process.env.AI_PROVIDER = "unknown";
    process.env.AI_MODEL = "test-model";
    process.env.AI_API_KEY = "test-api-key";

    expect(() => getModel()).toThrow("Unknown AI provider: unknown");
  });

  it.each(["AI_PROVIDER", "AI_MODEL"])("requires %s", (missingVariable) => {
    process.env.AI_PROVIDER = "moonshot";
    process.env.AI_MODEL = "kimi-k3";
    process.env.AI_API_KEY = "test-api-key";
    delete process.env[missingVariable];

    expect(() => getModel()).toThrow("AI_PROVIDER and AI_MODEL must be set");
  });
});
