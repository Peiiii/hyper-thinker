import { AIProvider } from './aiProvider';
import { GeminiAIProvider } from './geminiAIProvider';
import { OpenAIProvider } from './openAIProvider';


// This factory pattern allows for easy extension to other providers in the future.
// It checks for available API keys and initializes the appropriate provider.
export function getAIProvider(): AIProvider {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiApiBase = process.env.OPENAI_API_BASE; // Optional: for custom endpoints
  const geminiApiKey = process.env.API_KEY;

  if (openaiApiKey) {
    console.log("Using OpenAI Provider.");
    return new OpenAIProvider(openaiApiKey, openaiApiBase);
  }

  if (geminiApiKey) {
    console.log("Using Gemini Provider.");
    return new GeminiAIProvider(geminiApiKey);
  }

  throw new Error("No AI provider API key found. Please set OPENAI_API_KEY or API_KEY in your environment variables.");
}
