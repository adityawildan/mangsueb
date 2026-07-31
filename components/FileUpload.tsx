import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icon';

interface FileUploadProps {
  onFileChange: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-blur-fade [animation-delay:150ms]">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative glass-card rounded-[2rem] p-10 transition-all duration-700 border-2 border-dashed flex flex-col items-center group heavy-glow-hover ${
          isDragging ? 'border-secondary bg-secondary/10 scale-[1.01] shadow-[0_0_60px_rgba(238,77,45,0.4)]' : 'border-white/5 shadow-2xl'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileSelect}
          accept=".mp3,audio/mpeg,audio/mp3"
        />
        
        <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-secondary text-white' : 'bg-white/5 text-secondary'}`}>
          <UploadIcon className={`w-8 h-8 ${isDragging ? 'animate-bounce' : 'group-hover:scale-110'}`} />
        </div>
        
        <h3 className="text-xl font-normal text-white mb-1.5">Import MP3</h3>
        <p className="text-slate-400 font-normal mb-8 text-center max-w-xs text-[11px] opacity-60">
          Drop berkas MP3 buat ngasih kerjaan Mang Sueb
        </p>
        
        <div className="px-7 py-3 glass-card border-white/10 rounded-xl text-[9px] font-normal text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all cursor-pointer">
          Open File
        </div>
      </div>
      
       <div className="mt-6 grid grid-cols-3 gap-3 opacity-30">
         {[
           { label: 'SUPPORT', val: 'MP3 ONLY' },
           { label: 'LIMIT', val: '50 MB' },
           { label: 'CORE', val: 'PRO v3.1' }
         ].map((stat, i) => (
           <div key={i} className="text-center">
             <div className="text-[7px] font-normal text-slate-400 mb-0.5 uppercase tracking-tighter">{stat.label}</div>
             <div className="text-[9px] font-normal text-slate-200">{stat.val}</div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default FileUpload;