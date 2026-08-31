import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-white shadow-sm active:bg-indigo-700",
    secondary:
      "bg-[var(--muted-bg)] text-[var(--foreground)] active:bg-slate-200",
    outline:
      "border border-[var(--border)] bg-white text-[var(--foreground)] active:bg-slate-50",
    ghost:
      "text-[var(--muted)] active:bg-slate-100 active:text-[var(--foreground)]",
    danger: "bg-red-600 text-white active:bg-red-700",
  };
  const sizes = {
    sm: "h-9 px-3.5 text-sm rounded-lg",
    md: "h-11 px-5 text-sm font-medium rounded-xl",
    lg: "h-12 px-6 text-base font-medium rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
