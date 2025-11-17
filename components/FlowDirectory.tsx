import React from 'react';
import { ALL_BRAINS, MEDIUM_FLOW_STAGES_VISUAL, COMPLEX_FLOW_STAGES_VISUAL, FlowStageInfo } from '../constants';
import { BrainType } from '../types';
import { ChevronRightIcon } from './Icons';

const BrainIcon: React.FC<{ brainId: BrainType }> = ({ brainId }) => {
  const brain = ALL_BRAINS.find(b => b.id === brainId);
  if (!brain || !brain.icon) return null;
  const Icon = brain.icon;
  return (
    <div className="relative group">
      <div className={`p-1 rounded-full border ${brain.color} bg-gray-900`}>
        <Icon className="w-4 h-4 text-gray-300" />
      </div>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
        {brain.name}
      </div>
    </div>
  );
};

const FlowStep: React.FC<{ stage: FlowStageInfo }> = ({ stage }) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex space-x-1 mb-1 h-8 items-center">
      {stage.brains.map(brainId => <BrainIcon key={brainId} brainId={brainId} />)}
    </div>
    <p className="text-xs font-medium text-gray-300">{stage.name}</p>
  </div>
);

const FlowChart: React.FC<{ stages: FlowStageInfo[] }> = ({ stages }) => (
  <div className="flex items-center justify-start space-x-2 overflow-x-auto p-2 -m-2 pt-10">
    {stages.map((stage, index) => (
      <React.Fragment key={stage.name}>
        <FlowStep stage={stage} />
        {index < stages.length - 1 && (
          <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
        )}
      </React.Fragment>
    ))}
  </div>
);

const FlowDirectory: React.FC = () => {
  const simpleFlowStage: FlowStageInfo = { name: "Direct Answer", brains: [BrainType.Gatekeeper] };
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Thinking Flows</h3>
      <div className="space-y-4">
        {/* Simple Flow */}
        <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
          <h4 className="font-semibold text-white">Simple Flow</h4>
          <p className="text-sm text-gray-400 mt-1 mb-3 leading-snug">
            For direct questions. Bibo provides an immediate response.
          </p>
          <div className="flex justify-center pt-10">
            <FlowStep stage={simpleFlowStage} />
          </div>
        </div>
        
        {/* Medium Flow */}
        <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
          <h4 className="font-semibold text-white">Medium Flow</h4>
          <p className="text-sm text-gray-400 mt-1 mb-3 leading-snug">
            For prompts that need analysis, like summaries or comparisons.
          </p>
          <FlowChart stages={MEDIUM_FLOW_STAGES_VISUAL} />
        </div>

        {/* Complex Flow */}
        <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
          <h4 className="font-semibold text-white">Complex Flow</h4>
          <p className="text-sm text-gray-400 mt-1 mb-3 leading-snug">
            For open-ended questions requiring multiple perspectives.
          </p>
          <FlowChart stages={COMPLEX_FLOW_STAGES_VISUAL} />
        </div>
      </div>
    </div>
  );
};

export default FlowDirectory;