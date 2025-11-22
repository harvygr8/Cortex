'use client';

import * as React from 'react';
import { Search, FileIcon, MessageSquare, ClipboardList, Image as ImageIcon, StickyNote, Palette, X } from 'lucide-react';
import { useReactFlow, Node } from 'reactflow';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useThemeStore from '../../lib/stores/themeStore';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  matchText?: string;
  icon: React.ReactNode;
  node: Node;
  pageId?: string;
}

interface SpotlightSearchProps {
  onNodeFlash?: (nodeId: string, pageId?: string) => void;
}

export default function SpotlightSearch({ onNodeFlash }: SpotlightSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { getNodes, setCenter, fitView } = useReactFlow();
  const { isDarkMode } = useThemeStore();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    const handleOpen = () => setIsOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('open-spotlight', handleOpen);
    
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-spotlight', handleOpen);
    };
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search logic
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const nodes = getNodes();
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
    
    const searchResults = nodes
      .flatMap((node): any[] => {
        if (node.type === 'projectNode') {
          const candidates = [];
          
          // 1. Project itself
          candidates.push({
            id: node.id,
            type: 'project',
            title: node.data.project.title,
            subtitle: 'Project',
            content: node.data.project.description || '',
            icon: <FileIcon className="w-4 h-4" />,
            node: node,
            searchableText: (node.data.project.title + ' ' + (node.data.project.description || '')).toLowerCase()
          });

          // 2. Pages
          if (node.data.pages && Array.isArray(node.data.pages)) {
            node.data.pages.forEach((page: any) => {
              candidates.push({
                id: `${node.id}-page-${page.id}`,
                type: 'page',
                title: page.title,
                subtitle: 'Page',
                content: page.content || '',
                icon: <FileIcon className="w-4 h-4" />,
                node: node,
                searchableText: (page.title + ' ' + (page.content || '')).toLowerCase(),
                pageId: page.id
              });
            });
          }
          return candidates;
        }

        const result = getNodeSearchData(node);
        if (!result) return [];

        return [{
          id: node.id,
          type: node.type || 'unknown',
          title: result.title,
          subtitle: result.subtitle,
          matchText: undefined, // Will be calculated below
          icon: result.icon,
          node: node,
          searchableText: (result.title + ' ' + (result.subtitle || '') + ' ' + (result.content || '')).toLowerCase(),
          content: result.content
        }];
      })
      .filter((candidate: any) => {
        return searchTerms.every(term => candidate.searchableText.includes(term));
      })
      .map((candidate: any) => {
        // Find match text
        let matchText = undefined;
        if (candidate.content) {
          const lowerContent = candidate.content.toLowerCase();
          const firstTermIndex = lowerContent.indexOf(searchTerms[0]);
          if (firstTermIndex !== -1) {
            const start = Math.max(0, firstTermIndex - 20);
            const end = Math.min(candidate.content.length, firstTermIndex + 60);
            matchText = (start > 0 ? '...' : '') + candidate.content.substring(start, end) + (end < candidate.content.length ? '...' : '');
          }
        }

        return {
          id: candidate.id,
          type: candidate.type,
          title: candidate.title,
          subtitle: candidate.subtitle,
          matchText,
          icon: candidate.icon,
          node: candidate.node,
          pageId: candidate.pageId
        };
      });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, getNodes]);

  const getNodeSearchData = (node: Node): { title: string, subtitle?: string, content?: string, icon: React.ReactNode } | null => {
    switch (node.type) {
      // projectNode handled separately now
      case 'chatNode':
        return {
          title: node.data.chatCard.query,
          subtitle: 'Q/A',
          content: node.data.chatCard.response,
          icon: <MessageSquare className="w-4 h-4" />
        };
      case 'tasksNode':
        return {
          title: node.data.tasksCard.title,
          subtitle: 'Task List',
          content: node.data.tasksCard.tasks?.map((t: any) => t.text).join(' '),
          icon: <ClipboardList className="w-4 h-4" />
        };
      case 'scratchpadNode':
        return {
          title: 'Scratchpad',
          subtitle: node.data.scratchpadCard.text.substring(0, 30) + '...',
          content: node.data.scratchpadCard.text,
          icon: <StickyNote className="w-4 h-4" />
        };
      case 'imageNode':
        return {
          title: node.data.imageCard.imageAlt || 'Image',
          subtitle: 'Image',
          content: node.data.imageCard.imageUrl,
          icon: <ImageIcon className="w-4 h-4" />
        };
      case 'containerNode':
        return {
          title: node.data.label,
          subtitle: 'Container',
          icon: <Palette className="w-4 h-4" />
        };
      default:
        return null;
    }
  };

  const handleSelect = (result: SearchResult) => {
    const node = result.node;
    
    // Focus on the node
    fitView({
      nodes: [{ id: node.id }],
      padding: 0.5,
      duration: 1000,
    });

    // Flash the node (and highlight specific page if it's a page result)
    if (onNodeFlash) {
      onNodeFlash(node.id, result.pageId);
    }

    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
    const lowerText = text.toLowerCase();
    
    // Find all match positions
    const matches: Array<{ start: number; end: number }> = [];
    searchTerms.forEach(term => {
      let index = 0;
      while ((index = lowerText.indexOf(term, index)) !== -1) {
        matches.push({ start: index, end: index + term.length });
        index += term.length;
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Merge overlapping matches
    const merged: Array<{ start: number; end: number }> = [];
    for (const match of matches) {
      if (merged.length === 0 || match.start > merged[merged.length - 1].end) {
        merged.push(match);
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, match.end);
      }
    }
    
    // Build highlighted text
    if (merged.length === 0) return text;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    merged.forEach((match, idx) => {
      // Add text before match
      if (match.start > lastIndex) {
        parts.push(text.substring(lastIndex, match.start));
      }
      // Add bold match
      parts.push(
        <strong key={idx} className="font-bold">
          {text.substring(match.start, match.end)}
        </strong>
      );
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts}</>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 gap-0 max-w-[600px] bg-background border shadow-2xl top-[40%] -translate-y-1/2 [&>button]:hidden">
        <div className={`flex items-center px-4 ${results.length > 0 ? 'border-b' : ''}`}>
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the canvas"
            className="border-0 focus-visible:ring-0 text-lg h-14 px-0 bg-transparent shadow-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="ml-2 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="w-5 h-5 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto p-2">
            <div className="flex flex-col gap-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="flex items-start gap-3 px-3 py-3 rounded-md text-left transition-colors w-full text-foreground hover:bg-muted"
                >
                  <div className="mt-1 p-2 rounded-md bg-background border text-muted-foreground">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{result.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{result.subtitle}</Badge>
                    </div>
                    {result.matchText && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {highlightMatch(result.matchText, query)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

