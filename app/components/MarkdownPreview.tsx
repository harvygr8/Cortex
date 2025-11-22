'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Bold, Italic, Code, List, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MarkdownPreviewProps {
  content: string;
  isEditing: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function MarkdownPreview({ content, isEditing, onSave, onCancel }: MarkdownPreviewProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = () => {
    onSave(editedContent);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setShowPreview(false);
    onCancel();
  };

  // Markdown editor functions
  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let replacement = '';
    if (syntax.includes('[]')) {
      // For links and images
      replacement = syntax.replace('[]', selectedText || placeholder);
    } else if (syntax.includes('**') || syntax.includes('*') || syntax.includes('`')) {
      // For bold, italic, code
      replacement = selectedText ? `${syntax}${selectedText}${syntax}` : `${syntax}${placeholder}${syntax}`;
    } else {
      // For headers, lists
      const lines = (selectedText || placeholder).split('\n');
      replacement = lines.map(line => `${syntax}${line}`).join('\n');
    }

    const newContent = beforeText + replacement + afterText;
    setEditedContent(newContent);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Simplified markdown toolbar actions
  const markdownActions = [
    { icon: Hash, label: 'Heading', action: () => insertMarkdown('# ', 'Heading') },
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', 'italic text') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', 'code') },
    { icon: List, label: 'List', action: () => insertMarkdown('- ', 'list item') },
  ];

  // Simple markdown parser for preview
  const parseMarkdown = (text: string) => {
    if (!text) return '';
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold font-ibm-plex-sans mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold font-ibm-plex-sans mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold font-ibm-plex-sans mt-8 mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // Code blocks and inline code
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-foreground">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm text-foreground">$1</code>')
      
      // Lists - handle bullet points and numbered lists properly
      .replace(/^(\* .*(?:\n\* .*)*)/gm, (match) => {
        const items = match.split('\n').map(line => 
          line.replace(/^\* (.*)/, '<li class="ml-4 list-disc">$1</li>')
        ).join('');
        return `<ul class="my-2 ml-4">${items}</ul>`;
      })
      .replace(/^(- .*(?:\n- .*)*)/gm, (match) => {
        const items = match.split('\n').map(line => 
          line.replace(/^- (.*)/, '<li class="ml-4 list-disc">$1</li>')
        ).join('');
        return `<ul class="my-2 ml-4">${items}</ul>`;
      })
      .replace(/^(\d+\. .*(?:\n\d+\. .*)*)/gm, (match) => {
        const items = match.split('\n').map(line => 
          line.replace(/^\d+\. (.*)/, '<li class="ml-4 list-decimal">$1</li>')
        ).join('');
        return `<ol class="my-2 ml-4">${items}</ol>`;
      })
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>')
      .replace(/<p class="mb-4"><\/p>/g, '')
      .replace(/<p class="mb-4"><br><\/p>/g, '');
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Content Label and Preview Toggle */}
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium font-sans text-foreground">
            Content
          </label>
          
          {/* Preview toggle */}
          <Button
            type="button"
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        {/* Simple Markdown Toolbar */}
        <div className="flex items-center gap-1 p-2 rounded-lg bg-background border border-border">
          {markdownActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={action.action}
                  className="h-8 w-8"
                >
                  <action.icon className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          <div className="w-px h-4 border-border mx-2"></div>
        </div>

        {/* Content Area */}
        <div className={`flex ${showPreview ? 'gap-4' : ''}`}>
          {/* Editor */}
          <div className={`${showPreview ? 'flex-1' : 'w-full'}`}>
            <Textarea
              name="content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder={`# Page Title

Write your content using **Markdown**:

## Formatting
- **Bold text**
- *Italic text*
- \`inline code\`

## Lists
- Item one
- Item two
- Item three

Happy writing!`}
              className="font-sans text-sm"
              style={{ minHeight: '350px' }}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="flex-1 p-4 rounded-lg border overflow-auto bg-background border-border" style={{ minHeight: '350px' }}>
              <div className="text-foreground font-sans">
                {editedContent ? (
                  <div 
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(editedContent) }}
                  />
                ) : (
                  <div className="text-muted-foreground italic text-sm">
                    Start typing to see preview...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="prose max-w-none text-foreground">
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    </div>
  );
}