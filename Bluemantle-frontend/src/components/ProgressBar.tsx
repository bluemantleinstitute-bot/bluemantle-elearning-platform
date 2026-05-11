import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ progress, size = "sm", showLabel = false, className }: ProgressBarProps) {
  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-semibold text-outline tracking-wider uppercase">Progress</span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
      )}
      <div className={cn("w-full bg-surface_container_high rounded-full overflow-hidden", heightClasses[size])}>
        <div 
          className="bg-signature-gradient h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
