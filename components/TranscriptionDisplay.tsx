
import React, { useState, useEffect, useRef } from 'react';
import { SubtitleSegment } from '../types';
import { parseSRT, convertToSRT, normalizeTimestamp, timecodeToMs, msToTimecode } from '../utils/srtConverter';
import { ReplaceIcon, PlusIcon, TrashIcon, ScissorsIcon } from './Icon';
import TermReplacement, { ReplacementTerm } from './TermReplacement';

interface TranscriptionDisplayProps {
  srtContent: string;
  onSrtContentChange: (newContent: string) => void;
  onDownload: () => void;
  onReset: () => void;
  onResync: (lines: string[]) => void;
  isResyncing: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
    srtContent, 
    onSrtContentChange, 
    onDownload, 
    onReset,
    onResync,
    isResyncing
}) => {
  const [mode, setMode] = useState<'visual' | 'raw'>('visual');
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [showReplaceTool, setShowReplaceTool] = useState(false);
  const [postReplacements, setPostReplacements] = useState<ReplacementTerm[]>([]);
  
  const lastParsedSrtRef = useRef<string>('');

  useEffect(() => {
    if (srtContent !== lastParsedSrtRef.current) {
      const parsed = parseSRT(srtContent);
      setSegments(parsed);
      lastParsedSrtRef.current = srtContent;
    }
  }, [srtContent]);

  const updateSegmentsAndSrt = (newSegments: SubtitleSegment[]) => {
    const newSrt = convertToSRT(newSegments);
    lastParsedSrtRef.current = newSrt;
    setSegments(newSegments);
    onSrtContentChange(newSrt);
  };

  const handleSegmentChange = (index: number, field: keyof SubtitleSegment, value: string) => {
    const newSegments = [...segments];
    let sanitizedValue = value;
    if (field === 'text') {
        sanitizedValue = value.replace(/[\r\n]+/g, ' ');
    }
    newSegments[index] = { ...newSegments[index], [field]: sanitizedValue };
    if (field === 'text') {
      updateSegmentsAndSrt(newSegments);
    } else {
       setSegments(newSegments);
    }
  };

  const handleTimeBlur = (index: number, field: 'start' | 'end') => {
    const newSegments = [...segments];
    newSegments[index][field] = normalizeTimestamp(newSegments[index][field]);
    updateSegmentsAndSrt(newSegments);
  };

  const addNewSegment = (atIndex?: number) => {
    const newSegment: SubtitleSegment = {
      start: atIndex !== undefined && segments[atIndex] ? segments[atIndex].end : '00:00:00,000',
      end: atIndex !== undefined && segments[atIndex] ? segments[atIndex].end : '00:00:01,000',
      text: ''
    };
    let newSegments;
    if (atIndex !== undefined) {
      newSegments = [...segments.slice(0, atIndex + 1), newSegment, ...segments.slice(atIndex + 1)];
    } else {
      newSegments = [...segments, newSegment];
    }
    updateSegmentsAndSrt(newSegments);
  };

  const handleResyncClick = () => {
    const lines = segments.map(s => s.text).filter(t => t.trim() !== '');
    if (lines.length === 0) return;
    onResync(lines);
  };

  const removeSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    updateSegmentsAndSrt(newSegments);
  };

  const splitSegment = (index: number) => {
    const segment = segments[index];
    const words = segment.text.trim().split(/\s+/);
    if (words.length <= 1) return;

    const mid = Math.ceil(words.length / 2);
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');

    const startMs = timecodeToMs(segment.start);
    const endMs = timecodeToMs(segment.end);
    const midMs = startMs + Math.floor((endMs - startMs) / 2);

    const newSegments = [...segments];
    newSegments[index] = { ...segment, text: text1, end: msToTimecode(midMs) };
    newSegments.splice(index + 1, 0, { 
        start: msToTimecode(midMs + 1), 
        end: segment.end, 
        text: text2 
    });
    
    updateSegmentsAndSrt(newSegments);
  };

  const applyBatchReplacements = () => {
    if (postReplacements.length === 0) return;
    const newSegments = segments.map(segment => {
        let text = segment.text;
        postReplacements.forEach(term => {
            if (term.from.trim() && term.to.trim()) {
                const escapedFrom = term.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedFrom, 'gi');
                text = text.replace(regex, term.to);
            }
        });
        return { ...segment, text: text.replace(/[\r\n]+/g, ' ') };
    });
    updateSegmentsAndSrt(newSegments);
    setShowReplaceTool(false);
    setPostReplacements([]);
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center animate-blur-fade">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-5 gap-3">
            <div className="glass-card px-5 py-3 rounded-xl border-white/10">
                <h2 className="text-xl font-normal text-white leading-none">Studio Sequence</h2>
                <p className="text-slate-400 text-[9px] font-normal uppercase mt-2 opacity-50 tracking-widest">{segments.length} Adobe-Ready Segments</p>
            </div>
            <div className="flex glass-card p-1 rounded-xl shadow-lg border-white/10">
                <button
                    onClick={() => setMode('visual')}
                    className={`px-5 py-2 text-[10px] font-normal rounded-lg transition-all ${
                        mode === 'visual' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    Visual Editor
                </button>
                <button
                    onClick={() => setMode('raw')}
                    className={`px-5 py-2 text-[10px] font-normal rounded-lg transition-all ${
                        mode === 'raw' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    Raw Source
                </button>
            </div>
        </div>
      
      {mode === 'visual' ? (
        <>
            <div className="w-full flex justify-end items-center gap-2 mb-4">
                <button
                    onClick={() => setShowReplaceTool(!showReplaceTool)}
                    className={`text-[10px] font-normal flex items-center px-4 py-2 rounded-lg transition-all border ${
                        showReplaceTool ? 'bg-secondary/10 text-secondary border-secondary/20' : 'glass-card text-slate-500 border-white/5 hover:border-white/20'
                    }`}
                >
                    <ReplaceIcon className="w-3.5 h-3.5 mr-2" />
                    Global Patch
                </button>
                <button
                    onClick={handleResyncClick}
                    disabled={isResyncing}
                    className="text-[10px] font-normal flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/10"
                >
                    {isResyncing ? 'Re-Syncing...' : 'AI Re-Sync Sequence'}
                </button>
            </div>

            {showReplaceTool && (
                <div className="w-full glass-card rounded-2xl p-6 mb-6 border-secondary/20 bg-secondary/[0.02]">
                     <TermReplacement replacements={postReplacements} onReplacementsChange={setPostReplacements} />
                     <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                         <button onClick={applyBatchReplacements} className="bg-secondary text-white text-[10px] py-2 px-6 rounded-xl hover:brightness-110 transition-all uppercase tracking-widest">Execute Patch</button>
                     </div>
                </div>
            )}

            <div className={`w-full h-[520px] overflow-y-auto pr-2 space-y-4 mb-6 transition-opacity duration-500 ${isResyncing ? 'opacity-20 pointer-events-none' : ''}`}>
                {segments.map((segment, idx) => (
                    <div key={idx} className="group/container relative flex flex-row items-stretch w-full animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 20}ms` }}>
                        {/* Gutter Icon - Simplified to remove sequence numbers */}
                        <div className="flex flex-col items-center justify-center px-3 bg-white/[0.04] border-y border-l border-white/10 rounded-l-2xl min-w-[40px] z-10 select-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/container:bg-secondary transition-colors"></div>
                        </div>

                        {/* Segment Card Content */}
                        <div className="flex-1 glass-card p-3 px-6 rounded-r-2xl border-y border-r border-white/10 group-hover/container:border-white/20 group-hover/container:bg-white/[0.02] transition-all flex flex-col lg:flex-row gap-4 items-center group-focus-within/container:border-secondary/30 group-focus-within/container:bg-secondary/[0.01]">
                            {/* Time Column */}
                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 shrink-0">
                                <input 
                                    type="text" 
                                    value={segment.start}
                                    onChange={(e) => handleSegmentChange(idx, 'start', e.target.value)}
                                    onBlur={() => handleTimeBlur(idx, 'start')}
                                    className="bg-transparent text-[11px] text-white/80 w-24 text-center focus:outline-none focus:text-white font-mono"
                                />
                                <span className="text-[10px] text-slate-700 font-black">→</span>
                                <input 
                                    type="text" 
                                    value={segment.end}
                                    onChange={(e) => handleSegmentChange(idx, 'end', e.target.value)}
                                    onBlur={() => handleTimeBlur(idx, 'end')}
                                    className="bg-transparent text-[11px] text-white/80 w-24 text-center focus:outline-none focus:text-white font-mono"
                                />
                            </div>

                            {/* Text Column - CLEAN SUBTITLE DATA */}
                            <div className="flex-1 w-full min-w-0 border-l border-white/5 pl-4 relative">
                                <textarea 
                                    value={segment.text}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.preventDefault();
                                    }}
                                    onChange={(e) => handleSegmentChange(idx, 'text', e.target.value)}
                                    className={`w-full bg-transparent font-normal focus:outline-none resize-none text-[16px] p-1 leading-relaxed overflow-hidden whitespace-nowrap placeholder:text-slate-800 transition-colors ${
                                        segment.text.trim().split(/\s+/).filter(Boolean).length > 12 ? 'text-red-400' : 'text-white/95'
                                    }`}
                                    rows={1}
                                    spellCheck={false}
                                    placeholder="Transcription content..."
                                />
                                {segment.text.trim().split(/\s+/).filter(Boolean).length > 12 && (
                                    <div className="absolute -top-4 right-0 text-[8px] font-bold text-red-500 uppercase tracking-tighter bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                        {segment.text.trim().split(/\s+/).filter(Boolean).length} WORDS • TOO LONG
                                    </div>
                                )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex gap-2 opacity-0 group-hover/container:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                                {segment.text.trim().split(/\s+/).filter(Boolean).length > 12 && (
                                    <button 
                                        onClick={() => splitSegment(idx)} 
                                        title="Split segment" 
                                        className="w-8 h-8 flex items-center justify-center text-secondary hover:text-white glass-card rounded-lg border-secondary/20 hover:bg-secondary transition-all animate-pulse"
                                    >
                                        <ScissorsIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => addNewSegment(idx)} 
                                    title="Insert below" 
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white glass-card rounded-lg border-white/10 hover:border-secondary/40 transition-colors"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => removeSegment(idx)} 
                                    title="Delete segment" 
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 glass-card rounded-lg border-white/10 hover:border-red-500/40 transition-colors"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
      ) : (
        <div className="w-full glass-card p-4 rounded-2xl mb-6 border-white/10">
            <textarea
                value={srtContent}
                onChange={(e) => onSrtContentChange(e.target.value)}
                className="w-full h-[450px] p-6 font-mono text-[12px] bg-black/30 border border-white/5 rounded-xl text-slate-300 focus:outline-none leading-loose"
                spellCheck={false}
            />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button onClick={onReset} className="px-8 py-3.5 glass-card text-slate-400 hover:text-white transition-all text-[11px] rounded-xl border-white/5 uppercase tracking-widest font-medium">Reset Session</button>
        <button onClick={onDownload} className="px-12 py-3.5 bg-secondary text-white rounded-xl shadow-2xl shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[12px] font-semibold flex items-center justify-center uppercase tracking-[0.1em]">
          Export .SRT Sequence
        </button>
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
