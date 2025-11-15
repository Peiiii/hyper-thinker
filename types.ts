import type { FC } from 'react';

export enum BrainType {
  Analyst = 'The Analyst',
  Artist = 'The Artist',
  Critic = 'The Critic',
  Empath = 'The Empath',
  Visionary = 'The Visionary',
  Director = 'The Director',
  Skeptic = 'The Skeptic',
  Editor = 'The Editor',
  Writer = 'The Writer',
  Gatekeeper = 'The Gatekeeper',
}

export interface Brain {
  id: BrainType;
  name: string;
  description: string;
  color: string;
  icon?: FC<{ className?: string }>;
  systemInstruction: string;
  temperature: number;
}

export interface StageExecution {
  brainId: BrainType;
  response: string;
}

export interface Stage {
  title: string;
  executions: StageExecution[];
  summary?: StageExecution;
}

export interface ReviewRefineCycle {
  critique: string;
  refinedText: string;
}

export interface ThinkingProcess {
  stages: Stage[];
  reviewCycles: ReviewRefineCycle[];
  finalThesis: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  thinkingProcess?: ThinkingProcess;
  isError?: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
}
