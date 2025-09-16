import { cn } from "@/lib/utils";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

export function BorderBeam({
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  className,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-lg pointer-events-none overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          padding: `${borderWidth}px`,
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: `beam ${duration}s linear infinite`,
        }}
      />
      <style>{`
        @keyframes beam {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}