'use client';

import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text: string;
}

export default function Loader({ text }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-medium text-foreground">
          {text}
        </span>
      </div>
    </div>
  );
} 