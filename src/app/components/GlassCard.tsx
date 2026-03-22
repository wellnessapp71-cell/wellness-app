import React from 'react';
import { cn } from '../utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function GlassCard({ children, className, gradient = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md overflow-hidden",
        gradient ? "bg-gradient-to-br from-white/80 to-white/40" : "bg-white/70",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
