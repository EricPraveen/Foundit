import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  message,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-2 text-slate-500', className)}
    >
      <Loader2 className={cn('animate-spin text-campus-600', sizeClasses[size])} />
      {message ? (
        <span className="text-sm font-medium">{message}</span>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  );
};
