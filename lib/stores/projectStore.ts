import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectStore } from '../../types';

const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id: string | null) => set({ activeProjectId: id }),
      clearActiveProject: () => set({ activeProjectId: null }),
    }),
    {
      name: 'project-storage',
    }
  )
);

export default useProjectStore; 