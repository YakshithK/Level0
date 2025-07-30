import React from "react";

const PlanTracker: React.FC<{ steps: any[]; currentStep: number }> = ({ steps, currentStep }) => {
  if (steps.length === 0) return null;

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-750 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Execution Plan</h3>
        <div className="text-sm text-gray-400">
          {currentStep}/{steps.length} steps
        </div>
      </div>
      
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const status = getStepStatus(idx);
          const stepText = typeof step === 'string' ? step : 
            step?.instruction || step?.description || step?.step || JSON.stringify(step);
          
          return (
            <div key={idx} className={`flex items-start space-x-4 p-3 rounded-lg transition-all duration-200 ${
              status === 'current' ? 'bg-blue-900/20 border border-blue-600/50' :
              status === 'completed' ? 'bg-green-900/20 border border-green-600/50' :
              'bg-gray-800 border border-gray-700'
            }`}>
              {getStepIcon(status)}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  status === 'current' ? 'text-blue-300' :
                  status === 'completed' ? 'text-green-300' :
                  'text-gray-400'
                }`}>
                  Step {idx + 1}
                </div>
                <div className={`mt-1 text-sm ${
                  status === 'current' ? 'text-white' :
                  status === 'completed' ? 'text-gray-300' :
                  'text-gray-500'
                }`}>
                  {stepText}
                </div>
                {typeof step === 'object' && step?.completed && (
                  <div className="mt-2 flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-400">Completed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentStep / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PlanTracker;
