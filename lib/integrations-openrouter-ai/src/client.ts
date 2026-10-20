import OpenAI from "openai";

const direct = Boolean(process.env.OPENROUTER_API_KEY);
const baseURL = direct ? "https://openrouter.ai/api/v1" : process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
const apiKey = direct ? process.env.OPENROUTER_API_KEY : process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;

if (!baseURL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENROUTER_BASE_URL must be set. Did you forget to provision the OpenRouter AI integration?",
  );
}

if (!apiKey) {
  throw new Error(
    "AI_INTEGRATIONS_OPENROUTER_API_KEY must be set. Did you forget to provision the OpenRouter AI integration?",
  );
}

export const openrouter = new OpenAI({
  baseURL,
  apiKey,
});
