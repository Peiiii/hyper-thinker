import { ChatMessage, BrainType, Stage, StageExecution } from "../types";
import { ALL_BRAINS } from "../constants";
import { getAIProvider } from "./providers/providerFactory";
import { AIProvider } from './providers/aiProvider';

const getBrain = (brainId: BrainType) => {
    const brain = ALL_BRAINS.find(b => b.id === brainId);
    if (!brain) throw new Error(`${brainId} brain not found`);
    return brain;
}

const formatHistory = (history: ChatMessage[]): string => {
  if (history.length === 0) return "No previous conversation.";
  return history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
}

class AIService {
    private provider: AIProvider;
    private onUpdate: (update: { stage: string; data: any; brains?: BrainType[] }) => void = () => {};

    constructor(provider: AIProvider) {
        this.provider = provider;
    }

    public async generateResponse(
        userPrompt: string,
        history: ChatMessage[],
        onUpdateCallback: (update: { stage: string; data: any; brains?: BrainType[] }) => void
    ): Promise<string> {
        this.onUpdate = onUpdateCallback;
        const conversationHistory = formatHistory(history);
        const promptWithHistory = `PREVIOUS CONVERSATION:\n${conversationHistory}\n\nCURRENT USER PROMPT: "${userPrompt}"`;

        // === STAGE 0: GATEKEEPER ===
        this.onUpdate({ stage: "Analyzing prompt complexity...", data: null, brains: [] });
        const gatekeeper = getBrain(BrainType.Gatekeeper);
        let decision = 'complex';
        let simpleResponse = '';

        try {
            const gatekeeperResponseJson = await this.provider.generateText({
              quality: 'fast',
              systemInstruction: gatekeeper.systemInstruction,
              userPrompt: promptWithHistory,
              temperature: gatekeeper.temperature,
              responseMimeType: 'application/json'
            });
            const cleanedJson = gatekeeperResponseJson.replace(/```json\n|```/g, '').trim();
            const gatekeeperDecision = JSON.parse(cleanedJson);
            decision = gatekeeperDecision.decision || 'complex';
            if (decision === 'simple' && gatekeeperDecision.response) {
              simpleResponse = gatekeeperDecision.response;
            }
        } catch (error) {
            console.error("Gatekeeper brain failed, proceeding with complex flow. Error:", error);
            decision = 'complex'; // Force complex on error
        }
        
        if (decision === 'simple') {
            return simpleResponse;
        }
        
        if (decision === 'medium') {
            return this._runMediumFlow(userPrompt, promptWithHistory);
        }
        
        // Default to complex
        return this._runComplexFlow(userPrompt, promptWithHistory);
    }

    private async _runMediumFlow(
      userPrompt: string,
      promptWithHistory: string
    ): Promise<string> {
        // === STAGE 1: DRAFTING ===
        const stage1Title = "Step 1: Drafting the Core Answer";
        const stage1Brains = [BrainType.Analyst, BrainType.Visionary];
        this.onUpdate({ stage: stage1Title, data: null, brains: stage1Brains });
        
        const stage1Executions: StageExecution[] = await Promise.all(
            stage1Brains.map(async (brainId) => {
                const brain = getBrain(brainId);
                this.onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
                const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: promptWithHistory, temperature: brain.temperature });
                return { brainId, response };
            })
        );
        let stage1Data: Stage = { title: stage1Title, executions: stage1Executions };
        this.onUpdate({ stage: stage1Title, data: stage1Data });
    
        const stage1Combined = stage1Executions.map(e => `--- PERSPECTIVE FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        const director = getBrain(BrainType.Director);
        let currentText = await this.provider.generateText({
            quality: 'pro',
            systemInstruction: director.systemInstruction,
            userPrompt: `Based on the user's prompt and these initial analyses, synthesize a coherent first draft.\n\n${stage1Combined}`,
            temperature: director.temperature
        });
        stage1Data.summary = { brainId: BrainType.Director, response: currentText };
        this.onUpdate({ stage: "Writing First Draft...", data: stage1Data, brains: [BrainType.Director] });
    
        // === STAGE 2: REFINING ===
        this.onUpdate({ stage: "Step 2: Refining the Draft", data: null, brains: [BrainType.Critic] });
        const criticBrain = getBrain(BrainType.Critic); // Using Critic for a lighter review
        const refinerBrain = getBrain(BrainType.Editor);
        const critiquePrompt = `The original user prompt was: "${userPrompt}"\n\nReview the following text. Point out weaknesses, logical fallacies, and areas for improvement.\n\nText to review:\n\n${currentText}`;
        const critique = await this.provider.generateText({ quality: 'pro', systemInstruction: criticBrain.systemInstruction, userPrompt: critiquePrompt, temperature: criticBrain.temperature });
        this.onUpdate({ stage: `Critiquing the draft...`, data: { critique }, brains: [BrainType.Critic] });
    
        this.onUpdate({ stage: `Improving the draft...`, data: null, brains: [BrainType.Editor] });
        const refinedText = await this.provider.generateText({
          quality: 'pro',
          systemInstruction: refinerBrain.systemInstruction,
          userPrompt: `Original Text:\n"${currentText}"\n\nCritique:\n"${critique}"`,
          temperature: refinerBrain.temperature
        });
        currentText = refinedText;
        this.onUpdate({ stage: `Improving the draft...`, data: { critique, refinedText }, brains: [BrainType.Editor] });
    
        // === STAGE 3: WRITING THE FINAL ANSWER ===
        this.onUpdate({ stage: "Step 3: Writing the Final Answer", data: null, brains: [BrainType.Writer] });
        const communicatorBrain = getBrain(BrainType.Writer);
        const communicatorPrompt = `---
ORIGINAL USER PROMPT:
"${userPrompt}"
---
KEY INSIGHTS (Use this as the primary source material for your response):
"${currentText}"
---
`;
        const finalResponse = await this.provider.generateText({ quality: 'pro', systemInstruction: communicatorBrain.systemInstruction, userPrompt: communicatorPrompt, temperature: communicatorBrain.temperature });
        this.onUpdate({ stage: "Writing Final Answer...", data: { finalThesis: finalResponse }, brains: [BrainType.Writer] });
    
        return finalResponse;
    }

    private async _runComplexFlow(
        userPrompt: string,
        promptWithHistory: string,
    ): Promise<string> {
        // === STAGE 1: UNDERSTANDING THE QUESTION ===
        const stage1Title = "Step 1: Understanding the Question";
        const stage1Brains = [BrainType.Analyst, BrainType.Empath];
        this.onUpdate({ stage: stage1Title, data: null, brains: stage1Brains });
        
        const stage1Executions: StageExecution[] = await Promise.all(
          stage1Brains.map(async (brainId) => {
            const brain = getBrain(brainId);
            this.onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
            const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: promptWithHistory, temperature: brain.temperature });
            return { brainId, response };
          })
        );
        let stage1Data: Stage = { title: stage1Title, executions: stage1Executions };
        this.onUpdate({ stage: stage1Title, data: stage1Data });
    
        const stage1Combined = stage1Executions.map(e => `--- PERSPECTIVE FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        const director = getBrain(BrainType.Director);
        const problemStatement = await this.provider.generateText({
          quality: 'pro',
          systemInstruction: director.systemInstruction,
          userPrompt: `Based on the user's prompt and these initial analyses, frame a single, clear, and concise problem statement or research question that will guide the entire inquiry. Your output must be ONLY the problem statement.\n\n${stage1Combined}`,
          temperature: director.temperature
        });
        stage1Data.summary = { brainId: BrainType.Director, response: problemStatement };
        this.onUpdate({ stage: "Defining the Core Problem...", data: stage1Data, brains: [BrainType.Director] });
    
        // === STAGE 2: BRAINSTORMING IDEAS ===
        const stage2Title = "Step 2: Brainstorming Ideas";
        const stage2Brains = [BrainType.Artist, BrainType.Visionary, BrainType.Empath];
        this.onUpdate({ stage: stage2Title, data: null, brains: stage2Brains });
        
        const stage2Executions: StageExecution[] = await Promise.all(
          stage2Brains.map(async (brainId) => {
            const brain = getBrain(brainId);
            this.onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
            const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: `Core Problem: "${problemStatement}"`, temperature: brain.temperature });
            return { brainId, response };
          })
        );
        const stage2Data: Stage = { title: stage2Title, executions: stage2Executions };
        this.onUpdate({ stage: stage2Title, data: stage2Data });
    
        // === STAGE 3: BUILDING A DRAFT ===
        const stage3Title = "Step 3: Building a Draft";
        const stage3Brains = [BrainType.Critic, BrainType.Analyst];
        this.onUpdate({ stage: stage3Title, data: null, brains: stage3Brains });
        const stage2Combined = stage2Executions.map(e => `--- IDEA FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        
        const stage3Executions: StageExecution[] = await Promise.all(
          stage3Brains.map(async (brainId) => {
            const brain = getBrain(brainId);
            this.onUpdate({ stage: `${brain.name} is thinking...`, data: null, brains: [brain.id] });
            const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: `Evaluate these ideas in relation to the core problem: "${problemStatement}".\n\n${stage2Combined}`, temperature: brain.temperature });
            return { brainId, response };
          })
        );
        let stage3Data: Stage = { title: stage3Title, executions: stage3Executions };
        this.onUpdate({ stage: stage3Title, data: stage3Data });
        
        const stage3Combined = [...stage2Executions, ...stage3Executions].map(e => `--- INPUT FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        let currentText = await this.provider.generateText({
          quality: 'pro',
          systemInstruction: director.systemInstruction,
          userPrompt: `Core Problem: "${problemStatement}"\n\nSynthesize all the following perspectives (ideation, critical evaluation, analysis) into a coherent first draft that addresses the core problem.\n\n${stage3Combined}`,
          temperature: director.temperature
        });
        stage3Data.summary = { brainId: BrainType.Director, response: currentText };
        this.onUpdate({ stage: "Writing First Draft...", data: stage3Data, brains: [BrainType.Director] });
    
        // === STAGE 4: REVIEWING & IMPROVING ===
        const reviewerBrain = getBrain(BrainType.Skeptic);
        const refinerBrain = getBrain(BrainType.Editor);
        for (let i = 1; i <= 2; i++) {
          this.onUpdate({ stage: `Reviewing & Improving (${i}/2)...`, data: null, brains: [BrainType.Skeptic] });
          const critiquePrompt = `The original user prompt was: "${userPrompt}"\n\nBased on that, review the following text. Does it fully satisfy the user? Is it interesting, insightful, and not generic?\n\nText to review:\n\n${currentText}`;
          const critique = await this.provider.generateText({ quality: 'pro', systemInstruction: reviewerBrain.systemInstruction, userPrompt: critiquePrompt, temperature: reviewerBrain.temperature });
          this.onUpdate({ stage: `Reviewing & Improving (${i}/2)...`, data: { critique }, brains: [BrainType.Skeptic] });
    
          this.onUpdate({ stage: `Improving the draft (${i}/2)...`, data: null, brains: [BrainType.Editor] });
          const refinedText = await this.provider.generateText({
            quality: 'pro',
            systemInstruction: refinerBrain.systemInstruction,
            userPrompt: `Original Text:\n"${currentText}"\n\nCritique:\n"${critique}"`,
            temperature: refinerBrain.temperature
          });
          currentText = refinedText;
          this.onUpdate({ stage: `Improving the draft (${i}/2)...`, data: { critique, refinedText }, brains: [BrainType.Editor] });
        }
    
        // === STAGE 5: WRITING THE FINAL ANSWER ===
        this.onUpdate({ stage: "Step 5: Writing the Final Answer", data: null, brains: [BrainType.Writer] });
        const communicatorBrain = getBrain(BrainType.Writer);
        const communicatorPrompt = `---
ORIGINAL USER PROMPT:
"${userPrompt}"
---
KEY INSIGHTS (Use this as the primary source material for your response):
"${currentText}"
---
`;
        const finalResponse = await this.provider.generateText({ quality: 'pro', systemInstruction: communicatorBrain.systemInstruction, userPrompt: communicatorPrompt, temperature: communicatorBrain.temperature });
        this.onUpdate({ stage: "Writing Final Answer...", data: { finalThesis: finalResponse }, brains: [BrainType.Writer] });
    
        return finalResponse;
    }
}

export const generateMultiBrainResponse = async (
  userPrompt: string,
  history: ChatMessage[],
  onUpdate: (update: { stage: string; data: any; brains?: BrainType[] }) => void
): Promise<string> => {
  const provider = getAIProvider();
  const aiService = new AIService(provider);
  return aiService.generateResponse(userPrompt, history, onUpdate);
};