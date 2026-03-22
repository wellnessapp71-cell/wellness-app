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
        "rounded-[20px] bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
