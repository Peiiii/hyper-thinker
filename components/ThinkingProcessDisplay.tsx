import React from 'react';
import { ThinkingProcess, BrainType } from '../types';
import { ALL_BRAINS } from '../constants';
import MarkdownDisplay from './MarkdownDisplay';

interface ThinkingProcessDisplayProps {
  process: ThinkingProcess;
  isStreaming?: boolean;
}

const BrainCard: React.FC<{ brainId: BrainType; response: string }> = ({ brainId, response }) => {
  const brainInfo = ALL_BRAINS.find(b => b.id === brainId);
  if (!brainInfo || !response) return null;

  const Icon = brainInfo.icon;
  // Dynamic border color based on brain type
  const borderColor = brainInfo.color.replace('border-', 'border-').replace('text-', 'border-'); 

  return (
    <div className={`my-3 bg-gray-900/40 rounded-lg border-l-2 ${borderColor} border-t border-r border-b border-gray-800/50 overflow-hidden group`}>
      <details className="w-full">
        <summary className="cursor-pointer flex items-center justify-between p-3 select-none hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md bg-gray-800 ${brainInfo.color.replace('border-', 'text-')}`}>
                {Icon && <Icon className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200 leading-none">{brainInfo.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{brainInfo.description}</span>
            </div>
            </div>
            <div className="text-gray-600 group-hover:text-gray-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 details-arrow transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </summary>
        <div className="p-4 pt-0 text-sm border-t border-gray-800/50 bg-black/20">
            <div className="mt-3">
                <MarkdownDisplay text={response} className="prose prose-sm prose-invert max-w-none text-gray-300/90 leading-relaxed font-mono text-xs" />
            </div>
        </div>
      </details>
    </div>
  );
};

const TimelineItem: React.FC<{ title: string; children: React.ReactNode; isLast?: boolean; isOpen?: boolean }> = ({ title, children, isLast = false, isOpen = false }) => (
  <div className="relative pl-6 pb-2">
    {/* Timeline Line */}
    {!isLast && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-gray-700 to-transparent"></div>}
    
    {/* Timeline Dot */}
    <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center z-10 shadow-sm">
      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`}></div>
    </div>

    <div className="mb-6">
      <details open={isOpen} className="group/stage">
        <summary className="cursor-pointer flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden hover:text-cyan-300 transition-colors">
            <h4 className="font-mono text-sm font-semibold text-gray-400 group-open/stage:text-cyan-400 transition-colors">{title}</h4>
        </summary>
        <div className="mt-2 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
            {children}
        </div>
      </details>
    </div>
  </div>
);


const ThinkingProcessDisplay: React.FC<ThinkingProcessDisplayProps> = ({ process, isStreaming = false }) => {
  const { stages } = process;
  if (stages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-800 pt-4">
        <details className="text-sm" open={isStreaming}>
            <summary className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-all text-xs font-medium border border-gray-700/50">
                {isStreaming ? (
                    <>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        Live Thinking Stream
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Process Log
                    </>
                )}
            </summary>
            
            <div className="mt-6 ml-1">
                {stages.map((stage, index) => (
                <TimelineItem 
                    key={stage.title} 
                    title={stage.title}
                    isLast={index === stages.length - 1}
                    isOpen={isStreaming && index === stages.length - 1}
                >
                    <div className="space-y-1">
                    {stage.executions.map((exec, idx) => (
                        <BrainCard key={`${stage.title}-${exec.brainId}-${idx}`} brainId={exec.brainId} response={exec.response} />
                    ))}
                    {stage.summary && (
                        <div className="mt-3 pl-3 border-l-2 border-purple-500/30">
                           <div className="text-[10px] uppercase text-purple-400 font-bold mb-1 ml-1">Stage Synthesis</div>
                           <BrainCard brainId={stage.summary.brainId} response={stage.summary.response} />
                        </div>
                    )}
                    </div>
                </TimelineItem>
                ))}
            </div>
        </details>
    </div>
  );
};

export default ThinkingProcessDisplay;