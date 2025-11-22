'use client';

import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SourceBadgeProps {
  source: string | { title: string } | null;
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  if (!source) return null;

  // Handle both string and object sources
  const sourceText = typeof source === 'string' ? source : source.title || 'Unknown source';

  return (
    <Badge variant="outline" className="gap-1.5">
      <FileText className="w-3 h-3" />
      {sourceText}
    </Badge>
  );
} 