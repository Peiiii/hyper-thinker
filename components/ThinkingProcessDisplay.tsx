
import React from 'react';
import { ThinkingProcess, BrainType } from '../types';
import { ALL_BRAINS } from '../constants';
import SimpleMarkdown from './SimpleMarkdown';

interface ThinkingProcessDisplayProps {
  process: ThinkingProcess;
}

const BrainCard: React.FC<{ brainId: BrainType; response: string }> = ({ brainId, response }) => {
  const brainInfo = ALL_BRAINS.find(b => b.id === brainId);
  if (!brainInfo || !response) return null;

  const Icon = brainInfo.icon;

  return (
    <details className="my-2 bg-black/20 rounded-md border border-gray-700/50 w-full">
      <summary className="cursor-pointer flex items-center justify-between p-3 font-semibold text-sm text-gray-300 list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center">
          {Icon && <Icon className="w-5 h-5 mr-2 flex-shrink-0" />}
          <span className="truncate">{brainInfo.name}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transform transition-transform duration-200 details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="prose prose-sm prose-invert max-w-none opacity-80 font-mono p-3 pt-2 border-t border-gray-700/50">
        <SimpleMarkdown text={response} />
      </div>
    </details>
  );
};

const TimelineItem: React.FC<{ title: string; children: React.ReactNode; isLast?: boolean }> = ({ title, children, isLast = false }) => (
  <div className="relative pl-8">
    {!isLast && <div className="absolute left-3 top-3 w-px h-full bg-gray-700/50"></div>}
    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
      <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
    </div>
    <div className="mb-8">
      <details>
        <summary className="cursor-pointer font-bold text-base text-cyan-300 mb-2 list-none [&::-webkit-details-marker]:hidden flex justify-between items-center">
            <span>{title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transform transition-transform duration-200 details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </summary>
        <div className="mt-2">
            {children}
        </div>
      </details>
    </div>
  </div>
);


const ThinkingProcessDisplay: React.FC<ThinkingProcessDisplayProps> = ({ process }) => {
  const { stages, reviewCycles, finalThesis } = process;
  const hasContent = stages.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <details className="mt-6 text-sm text-gray-400">
      <summary className="cursor-pointer font-semibold hover:text-white transition-colors">
        View Thinking Process
      </summary>
      <div className="mt-4 border-l-2 border-gray-800/50">
        {stages.map((stage) => (
          <TimelineItem key={stage.title} title={stage.title}>
            <div className="space-y-2">
              {stage.executions.map((exec) => (
                <BrainCard key={`${stage.title}-${exec.brainId}`} brainId={exec.brainId} response={exec.response} />
              ))}
              {stage.summary && (
                <div className="pl-4 border-l-2 border-purple-500/50">
                   <BrainCard brainId={stage.summary.brainId} response={stage.summary.response} />
                </div>
              )}
            </div>
          </TimelineItem>
        ))}

        {reviewCycles.length > 0 && (
          <TimelineItem title="Step 4: Reviewing & Improving">
              {reviewCycles.map((cycle, index) => (
                <div key={index} className="my-2">
                  <details className="bg-black/10 rounded-md border border-gray-700/30">
                      <summary className="cursor-pointer p-3 font-semibold text-gray-300 list-none [&::-webkit-details-marker]:hidden flex justify-between items-center">
                          <span>Round {index + 1}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transform transition-transform duration-200 details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                      </summary>
                      <div className="p-3 pt-0">
                          <BrainCard brainId={BrainType.Skeptic} response={cycle.critique} />
                          <BrainCard brainId={BrainType.Editor} response={cycle.refinedText} />
                      </div>
                  </details>
                </div>
              ))}
          </TimelineItem>
        )}
        
        {finalThesis && (
          <TimelineItem title="Step 5: Writing the Final Answer" isLast={true}>
            <BrainCard brainId={BrainType.Writer} response={finalThesis} />
          </TimelineItem>
        )}
      </div>
    </details>
  );
};

export default ThinkingProcessDisplay;
