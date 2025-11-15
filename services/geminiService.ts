import { GoogleGenAI } from "@google/genai";
import { BrainType, ChatMessage, Stage, StageExecution } from "../types";
import { ALL_BRAINS } from "../constants";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const callGemini = async (
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash',
  systemInstruction: string, 
  userPrompt: string, 
  temperature: number, 
  responseMimeType?: 'application/json',
  retries = 3, 
  delayMs = 1000
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
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
    console.error(`Gemini API call failed. Retries left: ${retries}. Error:`, error);
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delayMs));
      return callGemini(model, systemInstruction, userPrompt, temperature, responseMimeType, retries - 1, delayMs * 2);
    }
    console.error("Gemini API call failed after multiple retries:", error);
    throw new Error(`The AI cognitive core failed to respond after multiple attempts. Reason: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const formatHistory = (history: ChatMessage[]): string => {
  if (history.length === 0) return "No previous conversation.";
  return history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
}

const getBrain = (brainId: BrainType) => {
    const brain = ALL_BRAINS.find(b => b.id === brainId);
    if (!brain) throw new Error(`${brainId} brain not found`);
    return brain;
}

export const generateMultiBrainResponse = async (
  userPrompt: string,
  history: ChatMessage[],
  onUpdate: (update: { stage: string; data: any; brains?: BrainType[] }) => void
): Promise<string> => {
  const conversationHistory = formatHistory(history);
  const promptWithHistory = `PREVIOUS CONVERSATION:\n${conversationHistory}\n\nCURRENT USER PROMPT: "${userPrompt}"`;
  
  // === STAGE 0: GATEKEEPER ===
  onUpdate({ stage: "Analyzing prompt complexity...", data: null, brains: [] });
  const gatekeeper = getBrain(BrainType.Gatekeeper);
  try {
    const gatekeeperResponseJson = await callGemini(
      'gemini-2.5-flash',
      gatekeeper.systemInstruction,
      promptWithHistory,
      gatekeeper.temperature,
      'application/json'
    );
    const cleanedJson = gatekeeperResponseJson.replace(/```json\n|```/g, '').trim();
    const gatekeeperDecision = JSON.parse(cleanedJson);

    if (gatekeeperDecision.decision === 'simple' && gatekeeperDecision.response) {
      // Don't call onUpdate, just return the simple response directly.
      // The main App component will handle displaying it without a thinking process.
      return gatekeeperDecision.response;
    }
  } catch (error) {
    console.error("Gatekeeper brain failed, proceeding with complex flow. Error:", error);
    // If the gatekeeper fails for any reason, default to the complex flow.
  }


  // === STAGE 1: UNDERSTANDING THE QUESTION ===
  const stage1Title = "Step 1: Understanding the Question";
  const stage1Brains = [BrainType.Analyst, BrainType.Empath];
  onUpdate({ stage: stage1Title, data: null, brains: stage1Brains });
  
  const stage1Executions: StageExecution[] = await Promise.all(
    stage1Brains.map(async (brainId) => {
      const brain = getBrain(brainId);
      onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
      const response = await callGemini('gemini-2.5-pro', brain.systemInstruction, promptWithHistory, brain.temperature);
      return { brainId, response };
    })
  );
  let stage1Data: Stage = { title: stage1Title, executions: stage1Executions };
  onUpdate({ stage: stage1Title, data: stage1Data });

  const stage1Combined = stage1Executions.map(e => `--- PERSPECTIVE FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
  const director = getBrain(BrainType.Director);
  const problemStatement = await callGemini(
    'gemini-2.5-pro',
    director.systemInstruction,
    `Based on the user's prompt and these initial analyses, frame a single, clear, and concise problem statement or research question that will guide the entire inquiry. Your output must be ONLY the problem statement.\n\n${stage1Combined}`,
    director.temperature
  );
  stage1Data.summary = { brainId: BrainType.Director, response: problemStatement };
  onUpdate({ stage: "Defining the Core Problem...", data: stage1Data, brains: [BrainType.Director] });

  // === STAGE 2: BRAINSTORMING IDEAS ===
  const stage2Title = "Step 2: Brainstorming Ideas";
  const stage2Brains = [BrainType.Artist, BrainType.Visionary, BrainType.Empath];
  onUpdate({ stage: stage2Title, data: null, brains: stage2Brains });
  
  const stage2Executions: StageExecution[] = await Promise.all(
    stage2Brains.map(async (brainId) => {
      const brain = getBrain(brainId);
      onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
      const response = await callGemini('gemini-2.5-pro', brain.systemInstruction, `Core Problem: "${problemStatement}"`, brain.temperature);
      return { brainId, response };
    })
  );
  const stage2Data: Stage = { title: stage2Title, executions: stage2Executions };
  onUpdate({ stage: stage2Title, data: stage2Data });

  // === STAGE 3: BUILDING A DRAFT ===
  const stage3Title = "Step 3: Building a Draft";
  const stage3Brains = [BrainType.Critic, BrainType.Analyst];
  onUpdate({ stage: stage3Title, data: null, brains: stage3Brains });
  const stage2Combined = stage2Executions.map(e => `--- IDEA FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
  
  const stage3Executions: StageExecution[] = await Promise.all(
    stage3Brains.map(async (brainId) => {
      const brain = getBrain(brainId);
      onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
      const response = await callGemini('gemini-2.5-pro', brain.systemInstruction, `Evaluate these ideas in relation to the core problem: "${problemStatement}".\n\n${stage2Combined}`, brain.temperature);
      return { brainId, response };
    })
  );
  let stage3Data: Stage = { title: stage3Title, executions: stage3Executions };
  onUpdate({ stage: stage3Title, data: stage3Data });
  
  const stage3Combined = [...stage2Executions, ...stage3Executions].map(e => `--- INPUT FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
  let currentText = await callGemini(
    'gemini-2.5-pro',
    director.systemInstruction,
    `Core Problem: "${problemStatement}"\n\nSynthesize all the following perspectives (ideation, critical evaluation, analysis) into a coherent first draft that addresses the core problem.\n\n${stage3Combined}`,
    director.temperature
  );
  stage3Data.summary = { brainId: BrainType.Director, response: currentText };
  onUpdate({ stage: "Writing First Draft...", data: stage3Data, brains: [BrainType.Director] });

  // === STAGE 4: REVIEWING & IMPROVING ===
  const reviewerBrain = getBrain(BrainType.Skeptic);
  const refinerBrain = getBrain(BrainType.Editor);
  for (let i = 1; i <= 2; i++) {
    onUpdate({ stage: `Reviewing & Improving (${i}/2)...`, data: null, brains: [BrainType.Skeptic] });
    const critiquePrompt = `The original user prompt was: "${userPrompt}"\n\nBased on that, review the following text. Does it fully satisfy the user? Is it interesting, insightful, and not generic?\n\nText to review:\n\n${currentText}`;
    const critique = await callGemini('gemini-2.5-pro', reviewerBrain.systemInstruction, critiquePrompt, reviewerBrain.temperature);
    onUpdate({ stage: `Reviewing & Improving (${i}/2)...`, data: { critique }, brains: [BrainType.Skeptic] });

    onUpdate({ stage: `Improving the draft (${i}/2)...`, data: null, brains: [BrainType.Editor] });
    const refinedText = await callGemini(
      'gemini-2.5-pro',
      refinerBrain.systemInstruction,
      `Original Text:\n"${currentText}"\n\nCritique:\n"${critique}"`,
      refinerBrain.temperature
    );
    currentText = refinedText;
    onUpdate({ stage: `Improving the draft (${i}/2)...`, data: { critique, refinedText }, brains: [BrainType.Editor] });
  }

  // === STAGE 5: WRITING THE FINAL ANSWER ===
  onUpdate({ stage: "Step 5: Writing the Final Answer", data: null, brains: [BrainType.Writer] });
  const communicatorBrain = getBrain(BrainType.Writer);
  const communicatorPrompt = `---
ORIGINAL USER PROMPT:
"${userPrompt}"
---
KEY INSIGHTS (Use this as the primary source material for your response):
"${currentText}"
---
`;
  const finalResponse = await callGemini('gemini-2.5-pro', communicatorBrain.systemInstruction, communicatorPrompt, communicatorBrain.temperature);
  onUpdate({ stage: "Writing Final Answer...", data: { finalThesis: finalResponse }, brains: [BrainType.Writer] });

  return finalResponse;
};
