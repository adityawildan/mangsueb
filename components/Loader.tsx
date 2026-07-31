
import React, { useState, useEffect } from 'react';

const STATUS_TEXTS = [
  "Mang Sueb mengucap niat",
  "Mang Sueb sedang mendengar...",
  "Mang Sueb menuliskan naskah",
  "inamaqoli...",
  "Mang Sueb bingung",
  "Mang Sueb termenung",
  "Mang Sueb ketiduran",
  "Mang Sueb ngelindur",
  "Mang Sueb buka kamus...",
  "Mang Sueb buka tafsir...",
  "Mang Sueb mau tobat",
  "Mang Sueb tempatnya salah",
  "udah ah ncek!",
  "Mang Sueb mencoba lagi"
];

const LONG_PROCESS_TEXTS = [
  "Audio lumayan panjang nih...",
  "Sabar, Mang Sueb lagi fokus",
  "Hampir selesai, jangan di-refresh",
  "Lagi ngerapihin timestamp Adobe",
  "Dikit lagi ncek, sabar ya..."
];

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % STATUS_TEXTS.length);
    }, 2800);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 98 ? prev + Math.random() * 0.8 : prev));
      setElapsed(prev => prev + 0.2);
    }, 200);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const getStatus = () => {
    if (message) return message;
    if (elapsed > 30) {
      return LONG_PROCESS_TEXTS[Math.floor((elapsed / 5) % LONG_PROCESS_TEXTS.length)];
    }
    return STATUS_TEXTS[textIndex];
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-md animate-blur-fade">
      <div className="relative mb-10 flex items-center justify-center">
        <div className="absolute inset-0 bg-secondary/10 blur-[80px] rounded-full scale-150"></div>
        
        <div className="loader-wrapper scale-[1.2]">
            <div className="box-wrap">
                <div className="box one"></div>
                <div className="box two"></div>
                <div className="box three"></div>
                <div className="box four"></div>
                <div className="box five"></div>
                <div className="box six"></div>
            </div>
        </div>
      </div>
      
      <div className="min-h-[80px] flex flex-col items-center w-full px-8">
        <h3 key={getStatus()} className="text-sm font-normal text-white mb-4 tracking-widest uppercase animate-blur-fade">
          {getStatus()}
        </h3>
        
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-2">
            <div 
                className="h-full bg-secondary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(238,77,45,0.6)]"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <div className="flex justify-between w-full">
            <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                Studio_Proc_v3.1
            </div>
            <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                {Math.floor(elapsed)}s
            </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
