'use client';
import React from 'react';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      
      // Reset form
      setTitle('');
      setDescription('');
      
      // Call the callback to refresh projects list
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setDescription('');
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            Create New Project
          </DialogTitle>
          <DialogDescription className="text-base">
            Start organizing your knowledge with a new project. Give it a descriptive title and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Research Notes, Personal Wiki..."
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what this project is about and what you'll use it for..."
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
