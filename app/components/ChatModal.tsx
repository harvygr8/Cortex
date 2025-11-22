'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
  projectTitle: string;
  initialQuery?: string;
}

export default function ChatModal({ isOpen, onClose, onSubmit, projectTitle, initialQuery }: ChatModalProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set initial query when modal opens
  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
    } else if (isOpen && !initialQuery) {
      setQuery('');
    }
  }, [isOpen, initialQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(query.trim());
      setQuery('');
      onClose();
    } catch (error) {
      console.error('Chat submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            Ask a Question
          </DialogTitle>
          <DialogDescription className="text-base">
            Chat with <span className="font-medium text-foreground">"{projectTitle}"</span> to get insights from your project content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="query" className="text-sm font-medium">
              Your Question
            </Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to know? Ask anything about the project content..."
              rows={5}
              disabled={isLoading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Press Enter to submit, Shift+Enter for a new line
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ask Question
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
