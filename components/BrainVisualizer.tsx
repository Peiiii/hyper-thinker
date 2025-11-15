
import React from 'react';
import { Brain, BrainType } from '../types';

interface BrainVisualizerProps {
  brains: Brain[];
  activeBrains: BrainType[];
  isLoading: boolean;
}

const BrainVisualizer: React.FC<BrainVisualizerProps> = ({ brains, activeBrains, isLoading }) => {
  const isBrainActive = (brainId: BrainType) => isLoading && (activeBrains.includes(brainId) || activeBrains.length === 0);

  const getBrainStyle = (brain: Brain) => {
    const isActive = isBrainActive(brain.id);
    const baseStyle = "absolute w-14 h-14 rounded-full border-2 flex items-center justify-center backdrop-blur-sm bg-gray-800/50 transition-all duration-500 group";
    
    if (isActive) {
      return `${baseStyle} ${brain.color} shadow-lg shadow-cyan-500/50 animate-pulse`;
    }
    return `${baseStyle} border-gray-600`;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Core */}
      <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isLoading ? 'bg-cyan-500/20 border-2 border-cyan-400 animate-pulse' : 'bg-gray-800 border-2 border-gray-600'}`}>
        <div className="w-32 h-32 bg-gray-900 rounded-full animate-ping absolute opacity-50" style={{ animationDuration: '2s' }}></div>
        <span className="text-2xl font-semibold text-cyan-300 z-10 font-mono">CORE</span>
      </div>

      {/* Orbiting Brains */}
      {brains.map((brain, index) => {
        const Icon = brain.icon;
        return (
          <div key={brain.id} className={`brain-orbit brain-orbit-${index + 1}`} style={{ transformOrigin: 'center' }}>
            <div className={getBrainStyle(brain)}>
              {Icon && <Icon className={`w-7 h-7 transition-colors duration-300 ${isBrainActive(brain.id) ? 'text-cyan-300' : 'text-gray-500 group-hover:text-white'}`} />}
              <div className="absolute -bottom-7 px-2 py-1 text-xs bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {brain.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BrainVisualizer;