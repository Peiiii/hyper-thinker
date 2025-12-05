import { ChatMessage, BrainType, Stage, StageExecution } from "../types";
import { ALL_BRAINS } from "../constants";
import { getAIProvider } from "./providers/providerFactory";
import { AIProvider } from './providers/aiProvider';
import { ThinkingMode } from "../stores/chatStore";

const getBrain = (brainId: BrainType) => {
    const brain = ALL_BRAINS.find(b => b.id === brainId);
    if (!brain) throw new Error(`${brainId} brain not found`);
    return brain;
}

const formatHistory = (history: ChatMessage[]): string => {
  if (history.length === 0) return "No previous conversation.";
  return history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
}

type OnUpdateCallback = (update: {
  stage: string;
  data: any;
  brains?: BrainType[];
  flowType?: 'complex' | 'medium' | null;
}) => void;

class AIService {
    private provider: AIProvider;
    private onUpdate: OnUpdateCallback = () => {};

    constructor(provider: AIProvider) {
        this.provider = provider;
    }

    public async generateResponse(
        userPrompt: string,
        history: ChatMessage[],
        onUpdateCallback: OnUpdateCallback,
        thinkingMode: ThinkingMode = 'auto'
    ): Promise<string> {
        this.onUpdate = onUpdateCallback;
        const conversationHistory = formatHistory(history);
        const promptWithHistory = `PREVIOUS CONVERSATION:\n${conversationHistory}\n\nCURRENT USER PROMPT: "${userPrompt}"`;

        if (thinkingMode === 'simple') {
            this.onUpdate({ stage: "Generating a direct answer...", data: null, brains: [], flowType: null });
            return this._runSimpleFlow(promptWithHistory);
        }

        if (thinkingMode === 'medium') {
            this.onUpdate({ stage: "Prompt complexity: Medium. Starting analysis...", data: null, brains: [], flowType: 'medium' });
            return this._runMediumFlow(userPrompt, promptWithHistory);
        }
        
        if (thinkingMode === 'complex') {
            this.onUpdate({ stage: "Prompt complexity: Complex. Initiating deep thought...", data: null, brains: [], flowType: 'complex' });
            return this._runComplexFlow(userPrompt, promptWithHistory);
        }

        // === STAGE 0: GATEKEEPER (Auto mode) ===
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
            this.onUpdate({ stage: "Prompt complexity: Medium. Starting analysis...", data: null, brains: [], flowType: 'medium' });
            return this._runMediumFlow(userPrompt, promptWithHistory);
        }
        
        // Default to complex
        this.onUpdate({ stage: "Prompt complexity: Complex. Initiating deep thought...", data: null, brains: [], flowType: 'complex' });
        return this._runComplexFlow(userPrompt, promptWithHistory);
    }

    private async _runSimpleFlow(
        promptWithHistory: string
    ): Promise<string> {
        const simpleWriterInstruction = `You are Bibo, The Hyper Thinker. A user has requested a simple, direct answer. Answer their question clearly and concisely without any complex analysis. Get straight to the point. Always respond in the same language as the original user prompt.`;
        const response = await this.provider.generateText({
            quality: 'fast',
            systemInstruction: simpleWriterInstruction,
            userPrompt: promptWithHistory,
            temperature: 0.5,
        });
        return response;
    }


    private async _runMediumFlow(
      userPrompt: string,
      promptWithHistory: string
    ): Promise<string> {
        // === STAGE 1: ANALYSIS ===
        const stage1Title = "Step 1: Structural Analysis";
        this.onUpdate({ stage: stage1Title, data: null, brains: [BrainType.Analyst], flowType: 'medium' });
        
        const analystBrain = getBrain(BrainType.Analyst);
        const analysis = await this.provider.generateText({ 
            quality: 'pro', 
            systemInstruction: analystBrain.systemInstruction, 
            userPrompt: promptWithHistory, 
            temperature: analystBrain.temperature 
        });

        const stage1Execution: StageExecution = { brainId: BrainType.Analyst, response: analysis };
        const stage1Data: Stage = { title: stage1Title, executions: [stage1Execution] };
        this.onUpdate({ stage: "Analyzing...", data: stage1Data, brains: [BrainType.Analyst], flowType: 'medium' });

    
        // === STAGE 2: COMPOSITION ===
        const stage2Title = "Step 2: Drafting & Composition";
        this.onUpdate({ stage: stage2Title, data: null, brains: [BrainType.Writer], flowType: 'medium' });
        const writerBrain = getBrain(BrainType.Writer);
        const writerPrompt = `---
ORIGINAL USER PROMPT:
"${userPrompt}"
---
KEY INSIGHTS (Use this as the primary source material for your response):
"${analysis}"
---
`;
        const finalResponse = await this.provider.generateText({ 
            quality: 'pro', 
            systemInstruction: writerBrain.systemInstruction, 
            userPrompt: writerPrompt, 
            temperature: writerBrain.temperature 
        });
        
        const stage2Data: Stage = { 
          title: stage2Title, 
          executions: [{ brainId: BrainType.Writer, response: finalResponse }] 
        };
        this.onUpdate({ stage: "Composing final answer...", data: stage2Data, brains: [BrainType.Writer], flowType: 'medium' });
    
        return finalResponse;
    }

    private async _runComplexFlow(
        userPrompt: string,
        promptWithHistory: string,
    ): Promise<string> {
        // === STAGE 1: DECONSTRUCTION (Understand) ===
        const stage1Title = "Step 1: Multi-Perspective Analysis";
        const stage1Brains = [BrainType.Analyst, BrainType.Empath];
        this.onUpdate({ stage: stage1Title, data: null, brains: stage1Brains, flowType: 'complex' });
        
        const stage1Executions: StageExecution[] = await Promise.all(
          stage1Brains.map(async (brainId) => {
            const brain = getBrain(brainId);
            this.onUpdate({ stage: `${brain.name} is deconstructing...`, data: null, brains: [brain.id], flowType: 'complex' });
            const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: promptWithHistory, temperature: brain.temperature });
            return { brainId, response };
          })
        );
        let stage1Data: Stage = { title: stage1Title, executions: stage1Executions };
        this.onUpdate({ stage: stage1Title, data: stage1Data, flowType: 'complex' });
    
        // Summary of Understanding
        const stage1Combined = stage1Executions.map(e => `--- PERSPECTIVE FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        const director = getBrain(BrainType.Director);
        const problemStatement = await this.provider.generateText({
          quality: 'fast',
          systemInstruction: director.systemInstruction,
          userPrompt: `The user asked: "${userPrompt}".\n\nAnalyst and Empath have analyzed this. Frame a SINGLE research question that bridges the logical facts and the human needs.\n\n${stage1Combined}`,
          temperature: 0.4
        });
        stage1Data.summary = { brainId: BrainType.Director, response: problemStatement };
        this.onUpdate({ stage: "Defining Core Thesis...", data: stage1Data, brains: [BrainType.Director], flowType: 'complex' });
    
        // === STAGE 2: IDEATION (Divergent) ===
        const stage2Title = "Step 2: Divergent Brainstorming";
        const stage2Brains = [BrainType.Artist, BrainType.Visionary, BrainType.Critic]; // Critic added early to challenge premises
        this.onUpdate({ stage: stage2Title, data: null, brains: stage2Brains, flowType: 'complex' });
        
        const stage2Executions: StageExecution[] = await Promise.all(
          stage2Brains.map(async (brainId) => {
            const brain = getBrain(brainId);
            this.onUpdate({ stage: `${brain.name} is ideating...`, data: null, brains: [brain.id], flowType: 'complex' });
            const response = await this.provider.generateText({ quality: 'pro', systemInstruction: brain.systemInstruction, userPrompt: `Core Problem: "${problemStatement}".\n\nGenerate ideas/critiques based on your specific methodology (Lateral Thinking, Blue Ocean, or Red Teaming).`, temperature: brain.temperature });
            return { brainId, response };
          })
        );
        const stage2Data: Stage = { title: stage2Title, executions: stage2Executions };
        this.onUpdate({ stage: stage2Title, data: stage2Data, flowType: 'complex' });
    
        // === STAGE 3: SYNTHESIS (Convergent) ===
        const stage3Title = "Step 3: Synthesis & Drafting";
        this.onUpdate({ stage: stage3Title, data: null, brains: [BrainType.Director], flowType: 'complex' });
        
        const stage2Combined = stage2Executions.map(e => `--- INPUT FROM ${e.brainId.toUpperCase()} ---\n${e.response}\n`).join('\n');
        let currentText = await this.provider.generateText({
          quality: 'pro',
          systemInstruction: director.systemInstruction,
          userPrompt: `Core Problem: "${problemStatement}"\n\nSynthesize these divergent inputs. Balance the creative (Artist/Visionary) with the critical (Critic). Create a unified, deep draft response.\n\n${stage2Combined}`,
          temperature: director.temperature
        });
        
        let stage3Data: Stage = { title: stage3Title, executions: [], summary: { brainId: BrainType.Director, response: currentText } };
        this.onUpdate({ stage: "Synthesizing First Draft...", data: stage3Data, brains: [BrainType.Director], flowType: 'complex' });
    
        // === STAGE 4: ADVERSARIAL REVIEW ===
        const stage4Title = "Step 4: Adversarial Review";
        const stage4Data: Stage = { title: stage4Title, executions: [] };
        const reviewerBrain = getBrain(BrainType.Skeptic);
        const refinerBrain = getBrain(BrainType.Editor);
        
        // Single pass of intense scrutiny is usually enough if the system instructions are good
        this.onUpdate({ stage: "Skeptic is reviewing...", data: stage4Data, brains: [BrainType.Skeptic], flowType: 'complex' });
        const critiquePrompt = `Original Prompt: "${userPrompt}"\n\nDraft Response:\n${currentText}\n\nBe ruthless. Does this answer uniqueness criteria? Is it boring?`;
        const critique = await this.provider.generateText({ quality: 'pro', systemInstruction: reviewerBrain.systemInstruction, userPrompt: critiquePrompt, temperature: reviewerBrain.temperature });
        stage4Data.executions.push({ brainId: BrainType.Skeptic, response: critique });
        
        this.onUpdate({ stage: "Editor is polishing...", data: stage4Data, brains: [BrainType.Editor], flowType: 'complex' });
        const refinedText = await this.provider.generateText({
            quality: 'pro',
            systemInstruction: refinerBrain.systemInstruction,
            userPrompt: `Original Draft:\n"${currentText}"\n\nCritique:\n"${critique}"\n\nRewrite to perfection.`,
            temperature: refinerBrain.temperature
        });
        currentText = refinedText;
        stage4Data.executions.push({ brainId: BrainType.Editor, response: refinedText });
        this.onUpdate({ stage: "Review Complete", data: stage4Data, brains: [BrainType.Editor], flowType: 'complex' });
    
        // === STAGE 5: FINAL OUTPUT ===
        const stage5Title = "Step 5: Final Polish";
        this.onUpdate({ stage: stage5Title, data: null, brains: [BrainType.Writer], flowType: 'complex' });
        const communicatorBrain = getBrain(BrainType.Writer);
        const communicatorPrompt = `---
ORIGINAL USER PROMPT:
"${userPrompt}"
---
FINAL SYNTHESIZED CONTENT:
"${currentText}"
---
`;
        const finalResponse = await this.provider.generateText({ quality: 'pro', systemInstruction: communicatorBrain.systemInstruction, userPrompt: communicatorPrompt, temperature: communicatorBrain.temperature });
        const stage5Data: Stage = {
          title: stage5Title,
          executions: [{ brainId: BrainType.Writer, response: finalResponse }],
        };
        this.onUpdate({ stage: "Finalizing...", data: stage5Data, brains: [BrainType.Writer], flowType: 'complex' });
    
        return finalResponse;
    }
}

export const generateMultiBrainResponse = async (
  userPrompt: string,
  history: ChatMessage[],
  onUpdate: OnUpdateCallback,
  thinkingMode: ThinkingMode
): Promise<string> => {
  const provider = getAIProvider();
  const aiService = new AIService(provider);
  return aiService.generateResponse(userPrompt, history, onUpdate, thinkingMode);
};