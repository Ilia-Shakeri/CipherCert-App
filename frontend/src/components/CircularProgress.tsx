import React from 'react';

interface CircularProgressProps {
  percentage: number;
  color: string;
  isDark: boolean;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  color, 
  isDark,
  size = 100,
  strokeWidth = 8 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className="relative flex items-center justify-center rounded-full outline-none focus:outline-none focus:ring-0"
      style={{ width: size, height: size }}
    >
      {/* Background Circle */}
      <svg
        className="transform -rotate-90 w-full h-full overflow-visible"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      
      {/* Percentage Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="font-bold font-mono"
          style={{ 
            fontSize: size * 0.25,
            color: isDark ? "#FFFFFF" : "#0F172A"
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
};