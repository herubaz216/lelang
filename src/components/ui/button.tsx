import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "gold" | "destructive";
  size?: "default" | "sm" | "lg";
}) {
  const variants = {
    default: "bg-white text-slate-900 hover:bg-slate-100",
    outline: "border border-white/20 bg-transparent text-white hover:bg-white/10",
    ghost: "bg-transparent text-white hover:bg-white/10",
    gold: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-semibold hover:from-amber-400 hover:to-yellow-300",
    destructive: "bg-red-600 text-white hover:bg-red-500",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
