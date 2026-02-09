import { LucideIcon } from "lucide-react";
import { CircularProgress } from "./CircularProgress";

interface StatusCardProps {
  title: string;
  value: number;
  percentage: number;
  icon: LucideIcon;
  color: string;
  isDark: boolean;
}

export function StatusCard({ title, value, percentage, icon: Icon, color, isDark }: StatusCardProps) {
  return (
    <div 
      // Added outline-none and ring-0 to prevent square focus halo
      className="rounded-2xl p-6 border relative overflow-hidden group transition-all duration-300 hover:scale-105 outline-none focus:ring-0 focus:outline-none"
      tabIndex={-1} // Prevents focus if clicked, further ensuring no square halo
      style={{
        background: isDark 
          ? "rgba(15, 23, 42, 0.5)" 
          : "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(20px)",
        borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${color}15, transparent 70%)`
        }}
      />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <p 
            className="text-sm mb-2 uppercase tracking-wider"
            style={{ color: isDark ? "#64748B" : "#94A3B8" }}
          >
            {title}
          </p>
          <p 
            className="text-4xl font-bold"
            style={{ 
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {value.toLocaleString()}
          </p>
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center relative"
          style={{
            background: `${color}20`,
            boxShadow: `0 0 20px ${color}40`
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>

      <div className="flex justify-center relative z-10">
        <CircularProgress 
          percentage={percentage} 
          color={color}
          isDark={isDark}
        />
      </div>
    </div>
  );
}