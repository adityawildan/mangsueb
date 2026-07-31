
import React from 'react';
import { SparklesIcon } from './Icon';

interface ContextInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ContextInput: React.FC<ContextInputProps> = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-xs mx-auto">
      <label htmlFor="context-input" className="block text-sm font-medium text-gray-400 mb-2 text-center flex items-center justify-center gap-2">
        <SparklesIcon className="w-4 h-4 text-amber-400"/>
        Temporary Context / Terms
      </label>
      <textarea
        id="context-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="block w-full rounded-md border-0 bg-gray-900/50 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 resize-none"
        placeholder="e.g. Poin Penalty, Nama Produk..."
      />
      <p className="mt-2 text-[10px] text-gray-500 text-center leading-tight">
        Add specific words to ensure correct spelling for this file.
      </p>
    </div>
  );
};

export default ContextInput;
