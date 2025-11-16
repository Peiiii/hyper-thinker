import React from 'react';
import { CheckIcon, DotIcon, LoaderIcon } from './Icons';

interface ThinkingProgressProps {
  stages: string[];
  currentStage: string;
}

const ThinkingProgress: React.FC<ThinkingProgressProps> = ({ stages, currentStage }) => {
  // Find the base stage title that the currentStage message starts with
  const currentStageIndex = stages.findIndex(s => currentStage.startsWith(s));
  
  return (
    <div className="flex flex-col items-start justify-start h-full w-full p-4">
       <h2 className="text-lg font-semibold mb-6 text-gray-300">Thinking Process</h2>
       <ol className="relative border-l border-gray-700 w-full ml-2">
        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;

          let Icon = DotIcon;
          let iconColor = 'text-gray-500';
          let textColor = 'text-gray-500';
          
          if (isActive) {
            Icon = LoaderIcon;
            iconColor = 'text-cyan-400';
            textColor = 'text-white';
          } else if (isCompleted) {
            Icon = CheckIcon;
            iconColor = 'text-cyan-400';
            textColor = 'text-gray-400';
          }

          return (
            <li key={stage} className="mb-6 ml-6">
              <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 transition-colors ${isActive ? 'bg-cyan-900' : 'bg-gray-800'}`}>
                <Icon className={`w-4 h-4 ${iconColor} ${isActive ? 'animate-spin' : ''} transition-colors`} />
              </span>
              <h3 className={`font-medium ${textColor} transition-colors duration-300`}>{stage}</h3>
              {isActive && <p className="text-sm text-gray-400 mt-1 animate-pulse">{currentStage}</p>}
            </li>
          );
        })}
       </ol>
    </div>
  );
};

export default ThinkingProgress;
