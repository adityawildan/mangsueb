
import React from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from './Icon';

export interface ReplacementTerm {
    id: string;
    from: string;
    to: string;
}

interface TermReplacementProps {
  replacements: ReplacementTerm[];
  onReplacementsChange: (replacements: ReplacementTerm[]) => void;
  description?: string | null;
}

const TermReplacement: React.FC<TermReplacementProps> = ({ 
    replacements, 
    onReplacementsChange,
    description = "Studio logic replaces global sequence matches post-process."
}) => {
  const addTerm = () => {
    onReplacementsChange([...replacements, { id: Date.now().toString(), from: '', to: '' }]);
  };

  const updateTerm = (id: string, field: 'from' | 'to', value: string) => {
    onReplacementsChange(replacements.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTerm = (id: string) => {
    onReplacementsChange(replacements.filter(t => t.id !== id));
  };

  return (
    <div className="w-full">
      <div className="flex items-center space-x-3 mb-6">
        <SparklesIcon className="w-4 h-4 text-secondary opacity-70" />
        <label className="text-[11px] font-normal text-slate-300">Context Replacements</label>
      </div>
      
      <div className="space-y-4">
        {replacements.map((term) => (
          <div key={term.id} className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
            <div className="flex-1 grid grid-cols-2 gap-3 p-2 bg-white/5 border border-white/5 rounded-2xl shadow-sm">
              <input
                type="text"
                value={term.from}
                onChange={(e) => updateTerm(term.id, 'from', e.target.value)}
                placeholder="Original"
                className="bg-transparent text-slate-200 text-sm font-normal border-none px-4 py-3 outline-none placeholder:text-slate-600"
              />
              <input
                type="text"
                value={term.to}
                onChange={(e) => updateTerm(term.id, 'to', e.target.value)}
                placeholder="Replace with"
                className="bg-white/5 text-secondary text-sm font-normal border-none px-4 py-3 rounded-xl outline-none placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={() => removeTerm(term.id)}
              className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addTerm}
        className="mt-6 w-full flex items-center justify-center gap-3 text-[11px] font-normal text-slate-500 hover:text-slate-300 border border-dashed border-white/10 hover:border-white/20 rounded-2xl py-5 transition-all"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Add Replacement Parameter</span>
      </button>
      
      {description && (
        <p className="mt-4 text-[10px] text-slate-500 font-normal text-center">
          {description}
        </p>
      )}
    </div>
  );
};

export default TermReplacement;
