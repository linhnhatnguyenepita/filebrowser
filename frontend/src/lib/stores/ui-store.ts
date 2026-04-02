import { create } from "zustand";
import * as searchApi from "@/lib/api/search";
import type { SearchResult } from "@/lib/api/search";

interface UIState {
  viewMode: "grid" | "list";
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchError: string | null;
  activeDialog: string | null;
  sidebarOpen: boolean;
  setViewMode: (mode: "grid" | "list") => void;
  search: (query: string, source: string) => Promise<void>;
  clearSearch: () => void;
  openDialog: (name: string) => void;
  closeDialog: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "grid",
  searchQuery: "",
  searchResults: [],
  searchLoading: false,
  searchError: null,
  activeDialog: null,
  sidebarOpen: true,
  setViewMode: (mode) => set({ viewMode: mode }),
  search: async (query, source) => {
    set({ searchQuery: query, searchLoading: true, searchError: null });
    try {
      const results = await searchApi.search(query, source);
      set({ searchResults: results, searchLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ searchError: message, searchLoading: false });
    }
  },
  clearSearch: () =>
    set({ searchQuery: "", searchResults: [], searchLoading: false, searchError: null }),
  openDialog: (name) => set({ activeDialog: name }),
  closeDialog: () => set({ activeDialog: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
