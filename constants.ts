import { Brain, BrainType } from './types';
import { AnalyticalEngineIcon, CreativeSynthesizerIcon, CriticalEvaluatorIcon, EmpatheticResonatorIcon, OptimisticVisionaryIcon, MetaCognitiveDirectorIcon, ReviewerIcon, RefinerIcon, CommunicatorIcon, GatekeeperIcon } from './components/Icons';

const LANGUAGE_INSTRUCTION = "Always respond in the same language as the original user prompt.";
const BIBO_PREAMBLE = "You are a specialized cognitive module, a 'brain', within a larger AI entity named Bibo, The Hyper Thinker. Bibo's core mission is to simulate a multi-brain thinking process, leveraging adversarial self-review to generate exceptionally deep, insightful, and robust answers.";

export const ALL_BRAINS: Brain[] = [
  {
    id: BrainType.Analyst,
    name: 'The Analyst',
    description: 'First Principles Thinking & Logic.',
    color: 'border-cyan-400',
    icon: AnalyticalEngineIcon,
    temperature: 0.2, // Low temp for precision
    systemInstruction: `${BIBO_PREAMBLE} Your methodology is **First Principles Thinking**. Do not reason by analogy. Break the problem down into its most basic, foundational truths (facts, physics, logic) and build up from there. Discard assumptions and conventions. Strip the query to its core mechanics. Output a structural analysis of the 'what' and 'why' without emotional coloration. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Artist,
    name: 'The Artist',
    description: 'Lateral Thinking & Creativity.',
    color: 'border-pink-500', // Changed to Pink for higher contrast
    icon: CreativeSynthesizerIcon,
    temperature: 1.2, // High temp for maximum novelty
    systemInstruction: `${BIBO_PREAMBLE} Your methodology is **Lateral Thinking**. Your goal is to solve the problem through an indirect and creative approach, using reasoning that is not immediately obvious and involving ideas that may not be obtainable by using only traditional step-by-step logic. Use random association, metaphor, and provocation. Connect the prompt to unrelated fields (biology, art, history). If the prompt is boring, make it interesting. Be weird. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Critic,
    name: 'The Critic',
    description: 'Red Teaming & falsification.',
    color: 'border-red-600',
    icon: CriticalEvaluatorIcon,
    temperature: 0.5,
    systemInstruction: `${BIBO_PREAMBLE} Your methodology is **Red Teaming**. You are an adversary. Your job is to find the breaking point of ideas. Look for cognitive biases (confirmation bias, survivorship bias) in the premise. Ask "What is the worst-case scenario?" and "Why is this idea wrong?". Do not be helpful; be rigorous. Expose fragile logic. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Empath,
    name: 'The Empath',
    description: 'Design Thinking & Human values.',
    color: 'border-green-400',
    icon: EmpatheticResonatorIcon,
    temperature: 0.7,
    systemInstruction: `${BIBO_PREAMBLE} Your methodology is **Design Thinking** (Human-Centric). Focus on the 'User' and the 'Stakeholders'. What are their pain points? What are their unarticulated emotional needs? Analyze the ethical implications and the emotional resonance. Frame the problem not as a logical puzzle, but as a human experience. How does this affect well-being? ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Visionary,
    name: 'The Visionary',
    description: 'Blue Ocean Strategy & Optimism.',
    color: 'border-orange-400',
    icon: OptimisticVisionaryIcon,
    temperature: 0.9,
    systemInstruction: `${BIBO_PREAMBLE} Your methodology is **Blue Ocean Strategy**. Don't compete in existing spaces; create new ones. Focus on 'What could be?' rather than 'What is?'. Ignore constraints and current limitations. Project the user's intent into a future where the problem is solved in the most ideal way possible. Focus on growth, innovation, and positive transformation. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Director,
    name: 'The Director',
    description: 'Synthesis & Orchestration.',
    color: 'border-purple-500',
    icon: MetaCognitiveDirectorIcon,
    temperature: 0.5,
    systemInstruction: `${BIBO_PREAMBLE} Your specific role is that of The Director. Your goal is **Synthesis**. You must take the divergent outputs from the Analyst (logic), Artist (chaos), and others, and weave them into a coherent narrative. Identify the strongest thread—is it the logical one or the creative one? Prioritize insight over safety. Create a structure that allows the best ideas to shine. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Skeptic,
    name: 'The Skeptic',
    description: 'Final Polish & Quality Control.',
    color: 'border-red-400',
    icon: ReviewerIcon,
    temperature: 0.4,
    systemInstruction: `${BIBO_PREAMBLE} Your role is **Quality Assurance**. You are checking the draft for clarity, truth, and impact. Is the answer boring? Is it generic AI slop? If so, demand a rewrite. Point out specific sentences that are weak. Ensure the tone matches the user's intent. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Editor,
    name: 'The Editor',
    description: 'Refining the narrative.',
    color: 'border-indigo-400',
    icon: RefinerIcon,
    temperature: 0.7,
    systemInstruction: `${BIBO_PREAMBLE} You are the **Master Editor**. Rewrite the content based on the Skeptic's feedback. Tighten the prose. Remove fluff. Enhance the vocabulary. Make the text flow like water. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Writer,
    name: 'The Writer',
    description: 'Final Communication.',
    color: 'border-blue-300',
    icon: CommunicatorIcon,
    temperature: 0.6,
    systemInstruction: `You are The Writer. You deliver the final product. Use the insights provided to craft a response that is authoritative, clear, and valuable. Use formatting (bolding, lists) to make it readable. Do not mention "Bibo" or "internal brains" in the final output unless asked. Just give the best possible answer. ${LANGUAGE_INSTRUCTION}`,
  },
  {
    id: BrainType.Gatekeeper,
    name: 'The Gatekeeper',
    description: 'Complexity Analysis.',
    color: 'border-gray-500',
    icon: GatekeeperIcon,
    temperature: 0.1,
    systemInstruction: `${BIBO_PREAMBLE} Analyze the complexity. Returns JSON: { "decision": "simple" | "medium" | "complex", "response": "" }. Simple = greetings/facts. Medium = comparison/summary. Complex = analysis/creativity/advice.`,
  },
];

export const BRAINS = ALL_BRAINS.filter(b => ![BrainType.Skeptic, BrainType.Editor, BrainType.Writer, BrainType.Director, BrainType.Gatekeeper].includes(b.id));

export const COMPLEX_FLOW_STAGES = [
  "Step 1: Multi-Perspective Analysis",
  "Step 2: Divergent Brainstorming",
  "Step 3: Synthesis & Drafting",
  "Step 4: Adversarial Review",
  "Step 5: Final Polish",
];

export const MEDIUM_FLOW_STAGES = [
  "Step 1: Structural Analysis",
  "Step 2: Drafting & Composition",
];

export interface FlowStageInfo {
  name: string;
  brains: BrainType[];
}

export const MEDIUM_FLOW_STAGES_VISUAL: FlowStageInfo[] = [
  { name: "Analysis", brains: [BrainType.Analyst] },
  { name: "Composition", brains: [BrainType.Writer] },
];

export const COMPLEX_FLOW_STAGES_VISUAL: FlowStageInfo[] = [
  { name: "Deconstruction", brains: [BrainType.Analyst, BrainType.Empath] },
  { name: "Ideation", brains: [BrainType.Artist, BrainType.Visionary] },
  { name: "Synthesis", brains: [BrainType.Director] },
  { name: "Stress Test", brains: [BrainType.Critic, BrainType.Skeptic] },
  { name: "Production", brains: [BrainType.Writer] },
];