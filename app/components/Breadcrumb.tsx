'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Breadcrumb({ items, showLargeTitle = true }: any) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 mb-6">
      {items.map((item: any, index: any) => (
        <div key={item.path || index} className="flex items-center">
          {index > 0 && (
            <span className="text-sm mx-2 text-muted-foreground">
              /
            </span>
          )}
          {item.path ? (
            <Button
              variant="link"
              onClick={() => router.push(item.path)}
              className="h-auto p-0 text-base"
            >
              {item.label}
            </Button>
          ) : (
            <span className="text-base font-semibold text-foreground">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
} 