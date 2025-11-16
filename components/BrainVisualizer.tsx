import React, { useRef, useState, useLayoutEffect } from 'react';
import { Brain, BrainType } from '../types';

interface BrainVisualizerProps {
  brains: Brain[];
  activeBrains: BrainType[];
  isLoading: boolean;
}

const BrainVisualizer: React.FC<BrainVisualizerProps> = ({ brains, activeBrains, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(100);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver to dynamically update radius on container size change
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const brainSize = 56; // w-14 or 3.5rem
        const padding = 8; // Reduced padding to increase orbit radius
        // Calculate radius to be half of the smaller dimension, minus half a brain and padding
        const newRadius = Math.max(50, (Math.min(width, height) / 2) - (brainSize / 2) - padding);
        setRadius(newRadius);
      }
    });

    resizeObserver.observe(container);

    // Cleanup observer on component unmount
    return () => resizeObserver.disconnect();
  }, []); // Empty dependency array means this effect runs once on mount to set up the observer


  const isBrainActive = (brainId: BrainType) => isLoading && (activeBrains.includes(brainId) || activeBrains.length === 0);

  const getBrainStyle = (brain: Brain) => {
    const isActive = isBrainActive(brain.id);
    const baseStyle = "w-full h-full rounded-full border-2 flex items-center justify-center backdrop-blur-sm bg-gray-800/50 transition-all duration-500 group";
    
    if (isActive) {
      return `${baseStyle} ${brain.color} shadow-lg shadow-cyan-500/50 animate-pulse`;
    }
    return `${baseStyle} border-gray-600`;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      {/* Central Core */}
      <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isLoading ? 'bg-cyan-500/20 border-2 border-cyan-400 animate-pulse' : 'bg-gray-800 border-2 border-gray-600'}`}>
        <div className="w-32 h-32 bg-gray-900 rounded-full animate-ping absolute opacity-50" style={{ animationDuration: '2s' }}></div>
        <span className="text-2xl font-semibold text-cyan-300 z-10 font-mono">CORE</span>
      </div>

      {/* Orbiting Brains */}
      {brains.map((brain, index) => {
        const Icon = brain.icon;
        return (
          <div 
            key={brain.id} 
            className={`brain-orbit brain-orbit-${index + 1}`}
            style={{ '--orbit-radius': `${radius}px` } as React.CSSProperties}
          >
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