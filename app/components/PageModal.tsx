'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { X, Edit, Trash2, Check, Loader2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useProjectStore from '../../lib/stores/projectStore';
import MarkdownPreview from './MarkdownPreview';
import Loader from './Loader';
import type { Page, Project } from '../../types';

interface PageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  projectId: string;
  onPageDeleted: () => void;
}

export default function PageModal({ isOpen, onClose, pageId, projectId, onPageDeleted }: PageModalProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', content: '' });
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);

  useEffect(() => {
    if (isOpen && projectId && pageId) {
      setActiveProjectId(projectId);
      fetchPageData();
      setIsEditing(false);
    }
  }, [isOpen, projectId, pageId, setActiveProjectId]);

  // Initialize form data when entering edit mode only
  useEffect(() => {
    if (page && isEditing) {
      setEditFormData({
        title: page.title || '',
        content: page.content || ''
      });
    }
  }, [isEditing]); // Only depend on isEditing to avoid resetting during save

  const fetchPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pageRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/pages/${pageId}`),
        fetch(`/api/projects/${projectId}`)
      ]);

      if (!pageRes.ok || !projectRes.ok) {
        throw new Error('Failed to fetch page data');
      }

      const [pageData, projectData] = await Promise.all([
        pageRes.json(),
        projectRes.json()
      ]);

      setPage(pageData);
      setProject(projectData);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editFormData.title.trim()) {
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editFormData.title, content: editFormData.content }),
      });

      if (response.ok) {
        const updatedPage = await response.json();
        // Exit edit mode first to prevent useEffect from resetting form data
        setIsEditing(false);
        // Then update the page
        setPage(updatedPage);
      } else {
        console.error('Failed to update page:', response.status);
      }
    } catch (error) {
      console.error('Error updating page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    if (page) {
      setEditFormData({
        title: page.title || '',
        content: page.content || ''
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        handlePageDeleted();
      } else {
        console.error('Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePageDeleted = () => {
    onClose();
    if (onPageDeleted) {
      onPageDeleted();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteDialog(false);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getWordCount = (text?: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text?: string) => {
    if (!text) return 0;
    return text.length;
  };

  const formatPageId = (id?: string) => {
    if (!id) return 'N/A';
    return id.length > 12 ? `${id.substring(0, 8)}...` : id;
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 bg-background">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 min-w-0 !border-none !shadow-none !px-0 !py-0 !h-auto !focus-visible:ring-0 !focus-visible:ring-offset-0 !bg-transparent !rounded-none !text-inherit !w-full"
                      placeholder="Page title"
                      style={{
                        fontSize: '1.5rem',
                        lineHeight: '1.25',
                        fontFamily: 'inherit',
                        fontWeight: '600',
                        letterSpacing: '-0.025em',
                        color: 'inherit'
                      }}
                    />
                  ) : (
                    <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight flex-1 min-w-0">
                      {page?.title || 'Loading...'}
                    </DialogTitle>
                  )}
                  
                  {/* Action Buttons Group */}
                  <div className="flex items-center gap-1 shrink-0">
                    {page && !loading && !isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditing(true)}
                          className="h-9 w-9"
                          title="Edit Page"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowDeleteDialog(true)}
                          className="h-9 w-9"
                          title="Delete Page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              title="Page details"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" align="end">
                            <div className="space-y-2 text-sm">
                              {page.created_at && (
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Created</span>
                                  <span className="text-foreground">{formatDateTime(page.created_at)}</span>
                                </div>
                              )}
                              {page.updated_at && page.updated_at !== page.created_at && (
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Updated</span>
                                  <span className="text-foreground">{formatDateTime(page.updated_at)}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Words</span>
                                <span className="text-foreground">{getWordCount(page.content).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Characters</span>
                                <span className="text-foreground">{getCharacterCount(page.content).toLocaleString()}</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditSave();
                          }}
                          className="h-9 w-9"
                          title={isSaving ? "Saving..." : "Save"}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleEditCancel}
                          className="h-9 w-9"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!isEditing && (
                      <DialogClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogClose>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader text="Loading page..." />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full min-h-[400px] p-8">
                <div className="text-center space-y-4 max-w-md">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-destructive">Error loading page</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button
                    onClick={fetchPageData}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : !page || !project ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Page not found</p>
                  <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            ) : (
              <div className={`px-6 pt-0 pb-6 ${isEditing ? 'h-full flex flex-col' : ''}`}>
                {isEditing ? (
                  <div className="prose prose-sm sm:prose-base dark:prose-invert w-full max-w-none flex-1 flex flex-col">
                    <Textarea
                      value={editFormData.content}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Start writing your content... Supports Markdown formatting."
                      className="!w-full !h-full !min-h-0 flex-1 !border-none !resize-none !focus-visible:ring-0 !focus-visible:ring-offset-0 !bg-transparent !p-0 !px-0 !py-0 !rounded-none !shadow-none"
                      style={{
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        fontFamily: 'inherit',
                        color: 'inherit',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </div>
                ) : (
                  <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-4xl">
                    <MarkdownPreview
                      content={page.content || ''}
                      isEditing={false}
                      onSave={() => {}}
                      onCancel={() => {}}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the page
              <strong className="font-semibold text-foreground"> "{page?.title}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

