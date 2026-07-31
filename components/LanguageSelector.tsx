
import React from 'react';
import { LanguageIcon } from './Icon';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = ['Bahasa Indonesia', 'English'];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="w-full">
      <div className="flex items-center space-x-3 mb-6">
        <LanguageIcon className="w-4 h-4 text-secondary opacity-70" />
        <label className="text-[11px] font-normal text-slate-300">Sequence Language</label>
      </div>
      <div className="flex gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`flex-1 py-4 px-6 rounded-2xl text-sm font-normal border-2 transition-all ${
              selectedLanguage === lang 
              ? 'bg-secondary/10 text-white border-secondary/40 shadow-xl shadow-secondary/10' 
              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
