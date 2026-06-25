import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 shadow-sm disabled:bg-slate-400",
  secondary:
    "bg-red-600 text-white hover:bg-red-500 shadow-sm disabled:bg-red-300",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
