import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 48 }) => {
  return (
    <div className="flex justify-center items-center h-32">
      <div
        className="animate-spin rounded-full border-t-2 border-b-2 border-blue-500"
        style={{ height: size, width: size }}
      ></div>
    </div>
  );
};

export default LoadingSpinner; 