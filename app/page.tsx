'use client';

import { useState, useEffect } from 'react';
import ProjectCanvas from './components/ProjectCanvasNew';
import NewProjectModal from './components/NewProjectModal';
import Breadcrumb from './components/Breadcrumb';
import useProjectStore from '../lib/stores/projectStore';
import useThemeStore from '../lib/stores/themeStore';

interface Project {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Declare global window property
declare global {
  interface Window {
    openNewProjectModal?: () => void;
  }
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const clearActiveProject = useProjectStore(state => state.clearActiveProject);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    clearActiveProject();
    fetchProjects();
  }, []);

  const fetchProjects = async (): Promise<void> => {
    const response = await fetch('/api/projects');
    const data: Project[] = await response.json();
    setProjects(data);
  };

  const handleProjectCreated = (newProject: Project): void => {
    // Add the new project to the list
    setProjects(prev => [...prev, newProject]);
  };

  // Expose the modal control function globally so Sidebar can access it
  useEffect(() => {
    window.openNewProjectModal = () => setIsNewProjectModalOpen(true);
    return () => {
      delete window.openNewProjectModal;
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <ProjectCanvas projects={projects} />
      <NewProjectModal 
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}