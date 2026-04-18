import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold tracking-[-0.01em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(180deg,#0f172a,#020617)] px-5 py-3 text-white shadow-soft hover:translate-y-[-1px] hover:shadow-[0_24px_56px_rgba(15,23,42,0.22)]",
        secondary:
          "border border-slate-200/90 bg-white/95 px-5 py-3 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:translate-y-[-1px] hover:bg-slate-50",
        ghost: "px-4 py-2 text-slate-700 hover:bg-slate-100/90 hover:text-slate-950",
      },
      size: {
        default: "h-11",
        lg: "h-12 px-6 text-base",
        sm: "h-9 px-3.5 text-xs uppercase tracking-[0.16em]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
