import React from "react";

const PromptInput: React.FC<{ value: string; onChange: (v: string) => void; onSubmit: () => void }> = ({ value, onChange, onSubmit }) => (
  <div className="w-full p-2 bg-gray-800 flex items-center">
    <input
      type="text"
      className="flex-1 p-2 rounded bg-gray-700 text-white"
      placeholder="What do you want to change?"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === "Enter" && onSubmit()}
    />
    <button
      className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
      onClick={onSubmit}
    >
      Send
    </button>
  </div>
);

export default PromptInput;
