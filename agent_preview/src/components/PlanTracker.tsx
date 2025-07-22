import React from "react";

const PlanTracker: React.FC<{ steps: any[]; currentStep: number }> = ({ steps }) => (
  <div className="bg-blue-600 p-4 rounded shadow w-full max-w-xl mx-auto mt-4">
    <h2 className="font-bold mb-2">Plan Progress</h2>
    <ol className="list-decimal pl-4">
      {steps.map((step, idx) => (
        <li key={idx} className="mb-2 p-2 rounded text-white">
          {typeof step === 'string' ? (
            step
          ) : step && typeof step === 'object' ? (
            <div>
              {step.step !== undefined && <div><strong>Step:</strong> {step.step}</div>}
              {step.instruction && <div><strong>Instruction:</strong> {step.instruction}</div>}
              {step.expected_outcome && <div><strong>Expected Outcome:</strong> {step.expected_outcome}</div>}
              {step.description && <div><strong>Description:</strong> {step.description}</div>}
            </div>
          ) : (
            JSON.stringify(step)
          )}
        </li>
      ))}
    </ol>
  </div>
);

export default PlanTracker;
