import { motion } from "motion/react";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  isDark: boolean;
}

export function CircularProgress({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = "#22D3EE",
  label,
  isDark 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span 
          className="font-bold"
          style={{ 
            fontSize: `${size / 4}px`,
            color: isDark ? "#FFFFFF" : "#0F172A"
          }}
        >
          {percentage}%
        </span>
        {label && (
          <span 
            className="text-xs mt-1"
            style={{ color: isDark ? "#64748B" : "#94A3B8" }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
