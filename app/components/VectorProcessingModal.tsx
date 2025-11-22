'use client';

import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VectorProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function VectorProcessingModal({ 
  isOpen, 
  onClose, 
  message = "Processing your content..."
}: VectorProcessingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center space-y-4 py-4">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-center">
            {message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
