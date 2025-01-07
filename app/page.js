'use client';

import { useState, useEffect } from 'react';
import ProjectGrid from './components/ProjectGrid';
import NewProjectButton from './components/NewProjectButton';
import useProjectStore from '../lib/stores/projectStore';
import useThemeStore from '../lib/stores/themeStore';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const clearActiveProject = useProjectStore(state => state.clearActiveProject);
  const { isDarkMode, theme } = useThemeStore();

  useEffect(() => {
    clearActiveProject();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetch('/api/projects');
    const data = await response.json();
    setProjects(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold font-figtree mb-2 ${isDarkMode ? theme.dark.text : theme.light.text}`}>
            Your Knowledge Hub
          </h1>
          <p className={isDarkMode ? theme.dark.secondary : theme.light.secondary}>
            Create projects to organize your thoughts and let AI help you explore them
          </p>
        </div>
        <NewProjectButton onProjectCreated={fetchProjects} />
      </div>
      <ProjectGrid projects={projects} />
    </div>
  );
}