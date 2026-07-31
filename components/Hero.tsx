import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-44 pb-8 px-4 text-center animate-blur-fade">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-semibold text-white leading-[1.05] mb-6 tracking-tight">
          Mamang Sueb <br />
          <span className="text-secondary opacity-95">Terbaik Sedunia</span>
        </h1>
      </div>
    </div>
  );
};

export default Hero;