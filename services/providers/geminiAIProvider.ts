import { GoogleGenAI } from "@google/genai";
import { AIProvider, GenerateTextOptions, QualityTier } from "./aiProvider";

const modelMap: Record<QualityTier, 'gemini-2.5-pro' | 'gemini-2.5-flash'> = {
  fast: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
};

export class GeminiAIProvider implements AIProvider {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateText(
    { quality, systemInstruction, userPrompt, temperature, responseMimeType }: GenerateTextOptions,
    retries = 3,
    delayMs = 1000
  ): Promise<string> {
    const model = modelMap[quality];

    try {
      const response = await this.ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
              systemInstruction: systemInstruction,
              temperature: temperature,
              topP: 0.95,
              responseMimeType,
          }
      });
      if (!response.text) {
          throw new Error("Received empty response from API");
      }
      return response.text;
    } catch (error) {
      console.error(`Gemini API call failed for model ${model}. Retries left: ${retries}. Error:`, error);
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delayMs));
        return this.generateText({ quality, systemInstruction, userPrompt, temperature, responseMimeType }, retries - 1, delayMs * 2);
      }
      console.error(`Gemini API call failed for model ${model} after multiple retries:`, error);
      throw new Error(`The AI cognitive core failed to respond after multiple attempts. Reason: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
