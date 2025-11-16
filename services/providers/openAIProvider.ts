import { AIProvider, GenerateTextOptions, QualityTier } from "./aiProvider";

const modelMap: Record<QualityTier, 'gpt-4o' | 'gpt-3.5-turbo'> = {
  fast: 'gpt-3.5-turbo',
  pro: 'gpt-4o',
};

export class OpenAIProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  async generateText(
    { quality, systemInstruction, userPrompt, temperature, responseMimeType }: GenerateTextOptions,
    retries = 3,
    delayMs = 1000
  ): Promise<string> {
    const model = modelMap[quality];
    const endpoint = `${this.baseUrl}/chat/completions`;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      ...(responseMimeType === 'application/json' && { response_format: { type: 'json_object' } }),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Received empty response from API");
      }
      return content;

    } catch (error) {
      console.error(`OpenAI API call failed for model ${model}. Retries left: ${retries}. Error:`, error);
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delayMs));
        return this.generateText({ quality, systemInstruction, userPrompt, temperature, responseMimeType }, retries - 1, delayMs * 2);
      }
      console.error(`OpenAI API call failed for model ${model} after multiple retries:`, error);
      throw new Error(`The AI cognitive core failed to respond after multiple attempts. Reason: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
