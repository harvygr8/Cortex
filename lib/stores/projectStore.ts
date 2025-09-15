import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  clearActiveProject: () => void;
}

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