'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Page, Project } from '../../types';

interface AddPageModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; projectId: string; pageId?: string }) => Promise<void>;
  editPage?: Page;
  isEditMode?: boolean;
}

export default function AddPageModal({ project, isOpen, onClose, onSubmit, editPage, isEditMode = false }: AddPageModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && editPage) {
      setFormData({
        title: editPage.title || '',
        content: editPage.content || ''
      });
    } else {
      setFormData({
        title: '',
        content: ''
      });
    }
  }, [isEditMode, editPage]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const submitData = isEditMode && editPage
        ? {
            ...formData,
            pageId: editPage.id,
            projectId: project.id
          }
        : {
            ...formData,
            projectId: project.id
          };
      
      await onSubmit(submitData);
      
      // Reset form
      setFormData({ title: '', content: '' });
      setShowPreview(false);
      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} page:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Enhanced markdown parser for real-time preview
  const parseMarkdown = (text: string) => {
    if (!text) return '<div class="text-muted-foreground text-xl font-semibold">Content</div>';
    
    // Split into lines for better processing
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle headers
      if (line.startsWith('### ')) {
        if (inList) {
          html += `<ul class="my-1 ml-4 list-disc">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h3 class="text-2xl font-bold mt-4 mb-2">${line.substring(4)}</h3>`;
        continue;
      }
      if (line.startsWith('## ')) {
        if (inList) {
          html += `<ul class="my-1 ml-4 list-disc">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h2 class="text-3xl font-bold mt-4 mb-2">${line.substring(3)}</h2>`;
        continue;
      }
      if (line.startsWith('# ')) {
        if (inList) {
          html += `<ul class="my-1 ml-4 list-disc">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h1 class="text-4xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
        continue;
      }
      
      // Handle lists
      if (line.startsWith('- ')) {
        const listContent = line.substring(2);
        listItems.push(listContent);
        inList = true;
        continue;
      }
      
      // If we were in a list but this line isn't a list item, close the list
      if (inList && !line.startsWith('- ')) {
        html += `<ul class="my-1 ml-4 list-disc">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        listItems = [];
        inList = false;
      }
      
      // Handle regular text with inline formatting
      if (line.trim()) {
        line = line
          // Bold and italic
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          // Inline code
          .replace(/`([^`]+)`/g, `<code class="bg-muted px-1.5 py-0.5 rounded text-lg font-mono text-foreground">$1</code>`)
          // Links
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>');
        
        html += `<div class="mb-1">${line}</div>`;
      } else {
        html += '<div class="mb-1">&nbsp;</div>';
      }
    }
    
    // Close any remaining list
    if (inList) {
      html += `<ul class="my-1 ml-4 list-disc">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    return html;
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      if (!isEditMode) {
        setFormData({ title: '', content: '' });
      }
      setShowPreview(false);
      onClose();
    }
  };

  return (
    <>
      <style>{`
        #add-page-modal input::placeholder,
        #add-page-modal textarea::placeholder {
          font-weight: 600;
          opacity: 0.5;
          color: inherit;
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent id="add-page-modal" className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 bg-background">
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a title"
                className="flex-1 min-w-0 border-none shadow-none px-0 py-0 h-auto bg-transparent rounded-none text-inherit w-full focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
                required
                autoFocus
                style={{
                  fontSize: '1.5rem',
                  lineHeight: '1.25',
                  fontFamily: 'inherit',
                  fontWeight: '600',
                  letterSpacing: '-0.025em',
                  color: 'inherit',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              />
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-fit bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
                  <ToggleGroup
                    type="single"
                    value={showPreview ? 'preview' : 'edit'}
                    onValueChange={(value) => {
                      if (value === 'preview' || value === 'edit') {
                        setShowPreview(value === 'preview');
                      }
                    }}
                    className="gap-0"
                  >
                    <ToggleGroupItem 
                      value="edit" 
                      aria-label="Write mode"
                      className="h-9 px-2.5 text-sm rounded-none data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
                    >
                      Write
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="preview" 
                      aria-label="Preview mode"
                      className="h-9 px-2.5 text-sm rounded-none data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
                    >
                      Preview
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                  title={isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Page')}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!isEditMode) {
                      setFormData({ title: '', content: '' });
                    }
                    setShowPreview(false);
                    onClose();
                  }}
                  className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className={`px-6 pt-4 pb-6 h-full flex flex-col`}>
              {showPreview ? (
                <div 
                  className="w-full h-full overflow-auto prose prose-sm sm:prose-base dark:prose-invert max-w-4xl"
                  dangerouslySetInnerHTML={{ 
                    __html: formData.content ? parseMarkdown(formData.content) : 
                      `<div class="text-inherit" style="font-weight: 600; opacity: 0.5; font-size: inherit; line-height: inherit; font-family: inherit;">Start writing your content here</div>`
                  }}
                />
              ) : (
                <div className="prose prose-sm sm:prose-base dark:prose-invert w-full max-w-none flex-1 flex flex-col">
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Start writing your content here"
                    className="w-full h-full min-h-0 flex-1 border-none resize-none bg-transparent p-0 px-0 py-0 rounded-none shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
                    style={{
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: '600',
                      color: 'inherit',
                      width: '100%',
                      height: '100%',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
