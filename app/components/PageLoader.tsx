'use client';

import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    </div>
  );
}
