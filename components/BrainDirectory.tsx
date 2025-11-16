
import React from 'react';
import { BRAINS } from '../constants';
import { Brain } from '../types';

const BrainDirectory: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Meet the Brains</h3>
      <ul className="space-y-3">
        {BRAINS.map((brain: Brain) => (
          <li key={brain.id} className="flex items-start space-x-3 p-3 bg-gray-800/40 rounded-lg border border-transparent hover:border-gray-700/80 transition-colors">
            <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-full border-2 ${brain.color} bg-gray-900/30`}>
              {brain.icon && <brain.icon className="w-5 h-5 text-gray-300" />}
            </div>
            <div>
              <h4 className="font-semibold text-white">{brain.name}</h4>
              <p className="text-sm text-gray-400 leading-snug">{brain.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BrainDirectory;
