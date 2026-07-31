import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const cappedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${cappedProgress}%` }}
        aria-valuenow={cappedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      ></div>
    </div>
  );
};

export default ProgressBar;
