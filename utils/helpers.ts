
import { SubtitleSegment } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Fix: SubtitleSegment uses 'start' and 'end', and we should use the map index + 1 for the SRT sequence number.
export const generateSRT = (segments: SubtitleSegment[]): string => {
  return segments
    .map((s, index) => `${index + 1}\n${s.start} --> ${s.end}\n${s.text}\n`)
    .join('\n');
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
