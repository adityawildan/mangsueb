import React, { useState, useCallback } from 'react';
import { AppStatus, SubtitleSegment } from './types';
import { generateTranscription, alignSubtitles } from './services/geminiService';
import { convertToSRT } from './utils/srtConverter';
import FileUpload from './components/FileUpload';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import Loader from './components/Loader';
import LanguageSelector from './components/LanguageSelector';
import TermReplacement, { ReplacementTerm } from './components/TermReplacement';
import { FileIcon } from './components/Icon';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Background from './components/Background';

// Only one engine in use — no picker needed, just call it directly.
const ENGINE = 'gemini-2.5-flash';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.Idle);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('Bahasa Indonesia');
  const [replacements, setReplacements] = useState<ReplacementTerm[]>([]);
  const [srtContent, setSrtContent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResyncing, setIsResyncing] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState<string>('');

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.mp3')) {
        setErrorMessage('Only .mp3 files are supported. Please convert your file to .mp3 format before uploading.');
        setStatus(AppStatus.Error);
        setFile(null);
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) { 
        setErrorMessage('File size exceeds 50MB studio limit.');
        setStatus(AppStatus.Error);
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setStatus(AppStatus.FileSelected);
      setErrorMessage('');
    }
  };

  const applyReplacements = (segments: SubtitleSegment[], terms: ReplacementTerm[]) => {
    if (terms.length === 0) return segments;
    return segments.map(segment => {
        let text = segment.text;
        terms.forEach(term => {
            if (term.from.trim() && term.to.trim()) {
                const escapedFrom = term.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedFrom, 'gi');
                text = text.replace(regex, term.to);
            }
        });
        return { ...segment, text: text.replace(/[\r\n]+/g, ' ') };
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setStatus(AppStatus.Processing);
    setErrorMessage('');
    setLoaderMessage('');

    try {
      const transcriptionResult = await generateTranscription(file, language, ENGINE, setLoaderMessage);
      if (transcriptionResult && transcriptionResult.length > 0) {
        const processedSegments = applyReplacements(transcriptionResult, replacements);
        const srt = convertToSRT(processedSegments);
        setSrtContent(srt);
        setStatus(AppStatus.Success);
      } else {
        throw new Error('Processing failed. Engine could not extract meaningful content.');
      }
    } catch (error: any) {
      console.error(error);
      let message = error instanceof Error ? error.message : 'Processing Interrupted.';
      
      if (message.toLowerCase().includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('exhausted') || message.toLowerCase().includes('overloaded') || message.toLowerCase().includes('limit')) {
          message = "STUDIO QUOTA EXHAUSTED: Google AI Studio rates are currently overloaded or have reached their limits. Please wait a few moments and try again.";
      }
      
      setErrorMessage(message);
      setStatus(AppStatus.Error);
    }
  }, [file, language, replacements]);

  const handleResync = useCallback(async (lines: string[]) => {
    if (!file) return;
    setIsResyncing(true);
    try {
        const newSegments = await alignSubtitles(file, lines, language, ENGINE);
        if (newSegments && newSegments.length > 0) {
            const newSrt = convertToSRT(newSegments);
            setSrtContent(newSrt);
        }
    } catch (e) {
        alert("Resync Error: " + (e instanceof Error ? e.message : "Internal system fault"));
    } finally {
        setIsResyncing(false);
    }
  }, [file, language]);

  const handleDownload = () => {
    if (!srtContent) return;
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = file ? file.name.split('.').slice(0, -1).join('.') : 'mang_suebtitle_output';
    a.download = `${fileName}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleReset = () => {
    setFile(null);
    setSrtContent('');
    setErrorMessage('');
    setStatus(AppStatus.Idle);
  };

  const renderMainContent = () => {
    switch (status) {
      case AppStatus.Processing:
        return <div className="mt-8"><Loader message={loaderMessage} /></div>;
      case AppStatus.Success:
        return (
          <TranscriptionDisplay 
            srtContent={srtContent} 
            onSrtContentChange={setSrtContent}
            onDownload={handleDownload}
            onReset={handleReset}
            onResync={handleResync}
            isResyncing={isResyncing}
          />
        );
      case AppStatus.Error:
        return (
          <div className="glass-card p-12 rounded-[2.5rem] text-center max-w-xl w-full mt-12 border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-normal text-white mb-4">Studio Fault Detected</h3>
            <p className="text-slate-400 mb-8 text-sm px-4">{errorMessage}</p>
            
            <div className="flex flex-col gap-3">
                <button 
                  onClick={handleReset} 
                  className="w-full py-4 bg-secondary text-white font-normal rounded-2xl transition-all hover:brightness-110 uppercase tracking-widest text-[10px]"
                >
                  Discard & Start Over
                </button>
            </div>
          </div>
        );
      case AppStatus.FileSelected:
         return (
            <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl mt-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center p-6 bg-white/5 rounded-2xl border border-white/10 mb-8">
                    <div className="w-14 h-14 bg-secondary/30 rounded-xl flex items-center justify-center mr-5">
                      <FileIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <span className="font-normal text-lg text-white block truncate mb-1">{file?.name}</span>
                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest opacity-60">
                            {(file!.size / (1024 * 1024)).toFixed(2)} MB • Ready to sequence
                        </span>
                    </div>
                </div>

                <div className="space-y-8 mb-10">
                    <LanguageSelector 
                        selectedLanguage={language} 
                        onLanguageChange={setLanguage} 
                    />
                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    <TermReplacement 
                        replacements={replacements}
                        onReplacementsChange={setReplacements}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleReset} className="flex-1 py-4 text-slate-500 font-normal hover:text-white rounded-xl transition-all text-xs uppercase tracking-widest">
                      Discard
                    </button>
                    <button onClick={handleGenerate} className="flex-[2] py-4 bg-secondary text-white font-bold rounded-xl shadow-xl shadow-secondary/10 hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">
                      Generate Sequence
                    </button>
                </div>
            </div>
         );
      default:
        return <div className="mt-8 w-full"><FileUpload onFileChange={handleFileChange} /></div>;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <Background />
      <Navbar />
      
      {status === AppStatus.Idle && <Hero />}

      <main id="transcribe" className={`flex-1 w-full flex flex-col items-center justify-center px-4 transition-all duration-700 ${status === AppStatus.Idle ? 'pb-12' : 'pt-24 pb-24'}`}>
        {renderMainContent()}
      </main>

      <footer className="w-full max-w-5xl mx-auto border-t border-white/5 py-12 px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-600 text-[10px] font-normal uppercase tracking-widest">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-1 rounded-full bg-secondary animate-pulse"></div>
                <p>Engine: {ENGINE.toUpperCase()}</p>
              </div>
              <p>Mang Sueb-title &copy; 2024. Ada untuk anda.</p>
          </div>
      </footer>
    </div>
  );
};

export default App;