export type QualityTier = 'fast' | 'pro';

export interface GenerateTextOptions {
  quality: QualityTier;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  responseMimeType?: 'application/json';
}

export interface AIProvider {
  generateText(options: GenerateTextOptions, retries?: number, delayMs?: number): Promise<string>;
}
