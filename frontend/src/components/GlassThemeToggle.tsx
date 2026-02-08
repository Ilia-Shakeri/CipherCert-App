import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";

interface GlassThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function GlassThemeToggle({ isDark, onToggle }: GlassThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-16 h-8 rounded-full transition-all duration-300"
      style={{
        backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
        border: isDark ? "1px solid #334155" : "1px solid #CBD5E1"
      }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        }}
        animate={{
          left: isDark ? "calc(100% - 28px)" : "4px"
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-yellow-500" />
        )}
      </motion.div>
      
      {/* Icons in background */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun 
          className="w-3.5 h-3.5 transition-opacity"
          style={{ 
            color: isDark ? "#64748B" : "#F59E0B",
            opacity: isDark ? 0.3 : 0.5
          }} 
        />
        <Moon 
          className="w-3.5 h-3.5 transition-opacity"
          style={{ 
            color: isDark ? "#22D3EE" : "#64748B",
            opacity: isDark ? 0.5 : 0.3
          }} 
        />
      </div>
    </button>
  );
}
