import React from 'react';
import { QuoteIcon } from './Icon';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-4xl">
      <div className="glass-card rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center text-white shope-glow">
            <QuoteIcon className="w-4 h-4" />
          </div>
          <span className="text-base font-normal text-white">Mang Sueb-title</span>
        </div>
        
        <div className="flex items-center">
           <span className="text-[9px] font-normal text-secondary px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20 uppercase tracking-widest">
             FLASH ENGINE v3.1
           </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;