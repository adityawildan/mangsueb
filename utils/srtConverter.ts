
import type { SubtitleSegment } from '../types';

const cleanString = (str: string): string => {
  return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
};

/**
 * Ensures timestamp is in the strict HH:MM:SS,mmm format required by Adobe Premiere Pro.
 * Handles variations in input format and overflows (e.g., 70 seconds -> 01:10) to prevent drift.
 */
export const normalizeTimestamp = (timestamp: string): string => {
  if (!timestamp) return '00:00:00,000';
  const ms = timecodeToMs(timestamp);
  return msToTimecode(ms >= 0 ? ms : 0);
};

/**
 * Converts segments to SRT string with Adobe-compatible CRLF spacing.
 */
export const convertToSRT = (segments: SubtitleSegment[]): string => {
  const CRLF = '\r\n';
  
  return segments
    .map((segment, index) => {
      const start = normalizeTimestamp(segment.start);
      const end = normalizeTimestamp(segment.end);
      const text = segment.text.replace(/[\r\n\t]+/g, ' ').trim();
      const sequence = index + 1;
      
      return `${sequence}${CRLF}${start} --> ${end}${CRLF}${text}`;
    })
    .join(`${CRLF}${CRLF}`) + `${CRLF}${CRLF}`; 
};

/**
 * Robust SRT parser that ignores sequence indices to prevent "ghost numbers".
 */
export const parseSRT = (srtContent: string): SubtitleSegment[] => {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '');
  const lines = normalized.split('\n');
  const segments: SubtitleSegment[] = [];
  
  let currentSegment: Partial<SubtitleSegment> = {};
  let textBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;

    if (line.includes('-->')) {
      if (currentSegment.start) {
        currentSegment.text = textBuffer.join(' ').trim();
        segments.push(currentSegment as SubtitleSegment);
        textBuffer = [];
      }
      
      const times = line.split('-->').map(t => t.trim());
      currentSegment = {
        start: normalizeTimestamp(times[0]),
        end: normalizeTimestamp(times[1])
      };
      continue;
    }

    if (/^\d+$/.test(line)) {
      if (!currentSegment.start) {
        continue;
      } else {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.includes('-->')) {
           continue;
        }
      }
    }

    if (currentSegment.start) {
      textBuffer.push(line);
    }
  }

  if (currentSegment.start) {
    currentSegment.text = textBuffer.join(' ').trim();
    segments.push(currentSegment as SubtitleSegment);
  }

  return segments;
};

export const timecodeToMs = (timecode: string): number => {
  if (!timecode) return -1;
  
  const cleaned = cleanString(timecode).trim();
  if (cleaned === '') return -1;
  
  try {
    // If it's a raw number representing seconds (e.g., "312.34" or "12")
    if (/^\d+([.,]\d+)?$/.test(cleaned)) {
      const seconds = parseFloat(cleaned.replace(',', '.'));
      return isNaN(seconds) ? -1 : Math.round(seconds * 1000);
    }
    
    let timePart = cleaned;
    let msVal = 0;
    
    // Check for dot or comma separator for milliseconds at the end
    const lastDotOrComma = Math.max(timePart.lastIndexOf('.'), timePart.lastIndexOf(','));
    if (lastDotOrComma > timePart.lastIndexOf(':') && lastDotOrComma !== -1) {
      const msStr = timePart.substring(lastDotOrComma + 1);
      msVal = parseInt(msStr.padEnd(3, '0').substring(0, 3), 10) || 0;
      timePart = timePart.substring(0, lastDotOrComma);
    } else {
      // Check if the last colon separates milliseconds (e.g., "00:12:340" or "00:00:12:340")
      const lastColon = timePart.lastIndexOf(':');
      if (lastColon !== -1) {
        const lastPart = timePart.substring(lastColon + 1);
        const colonCount = (timePart.match(/:/g) || []).length;
        if (lastPart.length === 3 || colonCount === 3) {
          msVal = parseInt(lastPart.padEnd(3, '0').substring(0, 3), 10) || 0;
          timePart = timePart.substring(0, lastColon);
        }
      }
    }
    
    // Split the remaining HH:MM:SS or MM:SS by ':'
    const parts = timePart.split(':');
    let hh = 0;
    let mm = 0;
    let ss = 0;
    
    if (parts.length === 3) {
      hh = parseInt(parts[0], 10) || 0;
      mm = parseInt(parts[1], 10) || 0;
      ss = parseInt(parts[2], 10) || 0;
    } else if (parts.length === 2) {
      mm = parseInt(parts[0], 10) || 0;
      ss = parseInt(parts[1], 10) || 0;
    } else if (parts.length === 1) {
      ss = parseInt(parts[0], 10) || 0;
    } else {
      return -1;
    }
    
    return (hh * 3600000) + (mm * 60000) + (ss * 1000) + msVal;
  } catch (err) {
    console.error("Error parsing timecode:", timecode, err);
    return -1;
  }
};

export const msToTimecode = (ms: number): string => {
  const hh = Math.floor(ms / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')},${mmm.toString().padStart(3, '0')}`;
};
