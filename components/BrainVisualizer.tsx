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

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const brainSize = 56;
        const padding = 12;
        const newRadius = Math.max(50, (Math.min(width, height) / 2) - (brainSize / 2) - padding);
        setRadius(newRadius);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const isBrainActive = (brainId: BrainType) => isLoading && (activeBrains.includes(brainId) || activeBrains.length === 0);

  const getBrainStyle = (brain: Brain) => {
    const isActive = isBrainActive(brain.id);
    const baseStyle = "w-full h-full rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-all duration-500 group";
    
    if (isActive) {
      return `${baseStyle} ${brain.color} bg-gray-800/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-110 z-10`;
    }
    return `${baseStyle} border-gray-700 bg-gray-900/40 opacity-70 scale-100`;
  };

  // Determine active color for the core
  const activeBrainObj = brains.find(b => activeBrains.includes(b.id));
  // Extract tailwind color class (e.g., 'border-cyan-400') -> convert to approx CSS color for shadow if needed, 
  // but for simplicity we'll just toggle specific classes or use inline styles if we parsed it.
  // We'll stick to class switching for robustness.
  
  let coreBorderColor = 'border-gray-600';
  let coreShadow = 'shadow-none';
  let coreBg = 'bg-gray-800';

  if (isLoading) {
    if (activeBrainObj) {
      // Use the active brain's color
      coreBorderColor = activeBrainObj.color;
      coreShadow = 'shadow-[0_0_30px_rgba(255,255,255,0.1)]'; // Generic glow, refined by border color
      coreBg = 'bg-gray-900';
    } else {
      // Generic loading state
      coreBorderColor = 'border-cyan-400';
      coreShadow = 'shadow-[0_0_20px_rgba(34,211,238,0.3)]';
      coreBg = 'bg-cyan-900/20';
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-visible">
       {/* Background Grid Effect */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-transparent to-transparent pointer-events-none"></div>

      {/* Central Core */}
      <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${coreBorderColor} border-4 ${coreShadow} ${coreBg} z-20`}>
        {isLoading && (
            <div className={`absolute inset-0 rounded-full border-4 ${coreBorderColor} opacity-50 animate-ping`}></div>
        )}
        <div className="text-center">
            <span className={`text-xl font-bold tracking-wider ${isLoading ? 'text-white' : 'text-gray-500'} font-mono transition-colors duration-500`}>
                {activeBrainObj ? "LINKED" : "CORE"}
            </span>
             {activeBrainObj && (
                <div className="text-[10px] text-gray-300 uppercase tracking-widest mt-1 animate-pulse">Processing</div>
             )}
        </div>
      </div>

      {/* Orbiting Brains */}
      {brains.map((brain, index) => {
        const Icon = brain.icon;
        const isActive = isBrainActive(brain.id);
        
        return (
          <div 
            key={brain.id} 
            className={`brain-orbit brain-orbit-${index + 1}`}
            style={{ '--orbit-radius': `${radius}px` } as React.CSSProperties}
          >
            <div className={getBrainStyle(brain)}>
              {Icon && <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-gray-500'}`} />}
              
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/90 text-white rounded border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 pointer-events-none">
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