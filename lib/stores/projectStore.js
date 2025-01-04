import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProjectStore = create(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      clearActiveProject: () => set({ activeProjectId: null }),
    }),
    {
      name: 'project-storage',
    }
  )
);

export default useProjectStore; 