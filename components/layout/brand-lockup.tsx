import { cn } from "@/lib/utils";

type BrandLockupProps = {
  variant?: "light" | "dark";
  subtitle: string;
  compact?: boolean;
};

export function BrandLockup({
  variant = "light",
  subtitle,
  compact = false,
}: BrandLockupProps) {
  const isDark = variant === "dark";

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-[1.15rem] text-sm font-semibold shadow-soft transition-transform duration-300",
          compact ? "h-10 w-10" : "h-11 w-11",
          isDark
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "bg-slate-950 text-white ring-1 ring-slate-900/5",
        )}
      >
        <img src="/logo.png" alt="LB" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0">
        <div
          className={cn(
            "font-semibold tracking-tight",
            isDark ? "text-white" : "text-slate-950",
          )}
        >
          Launchboard AI
        </div>
        <div
          className={cn(
            "text-sm",
            isDark ? "text-slate-300" : "text-slate-500",
          )}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
