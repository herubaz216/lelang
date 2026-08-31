"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function CountdownTimer({
  endAt,
  className,
  variant = "default",
}: {
  endAt: string;
  className?: string;
  variant?: "default" | "hero";
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    function update() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        ended: false,
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  if (timeLeft.ended) {
    return <p className={cn("text-sm font-medium text-red-500", className)}>Lelang berakhir</p>;
  }

  const units = [
    { value: timeLeft.days, label: "Hari" },
    { value: timeLeft.hours, label: "Jam" },
    { value: timeLeft.minutes, label: "Menit" },
    { value: timeLeft.seconds, label: "Detik" },
  ];

  if (variant === "hero") {
    return (
      <div className={cn("flex gap-3", className)}>
        {units.filter((u) => u.label !== "Hari" || u.value > 0).map((u) => (
          <div key={u.label} className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm min-w-[56px]">
            <span className="text-2xl font-bold tabular-nums text-white">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/70">{u.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-[var(--primary)]" />
      <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
        {timeLeft.days > 0 && `${timeLeft.days}h `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
