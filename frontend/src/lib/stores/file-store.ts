import { create } from "zustand";
import * as resourcesApi from "@/lib/api/resources";
import type { FileInfo, DirectoryResponse } from "@/lib/api/resources";

interface FileState {
  path: string;
  source: string;
  listing: DirectoryResponse | null;
  items: FileInfo[];
  loading: boolean;
  selected: Set<string>;
  sortBy: "name" | "size" | "modified";
  sortAsc: boolean;
  previewFile: FileInfo | null;
  fetchDirectory: (path: string, source: string) => Promise<void>;
  toggleSelect: (name: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSorting: (by: "name" | "size" | "modified", asc: boolean) => void;
  setPreviewFile: (file: FileInfo | null) => void;
}

function buildItems(data: DirectoryResponse): FileInfo[] {
  const source = data.source;
  const folders = (data.folders || []).map((f) => ({
    ...f,
    source,
    path: data.path === "/" ? `/${f.name}/` : `${data.path}${f.name}/`,
    type: "directory" as const,
  }));
  const files = (data.files || []).map((f) => ({
    ...f,
    source,
    path: data.path === "/" ? `/${f.name}` : `${data.path}${f.name}`,
  }));
  return [...folders, ...files];
}

export const useFileStore = create<FileState>((set) => ({
  path: "/",
  source: "",  listing: null,
  items: [],
  loading: false,
  selected: new Set(),
  sortBy: "name",
  sortAsc: true,
  fetchDirectory: async (path, source) => {
set({ loading: true, path, source, selected: new Set() });
    try {
      const data = await resourcesApi.fetchDirectory(source, path);
      set({ listing: data, items: buildItems(data), loading: false });
    } catch {
      set({ loading: false });
    }
  },
  toggleSelect: (name) => {
    set((state) => {
      const next = new Set(state.selected);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { selected: next };
    });
  },
  selectAll: () => {
    set((state) => ({
      selected: new Set(state.items.map((i) => i.name)),
    }));
  },
  clearSelection: () => set({ selected: new Set() }),
  setSorting: (by, asc) => set({ sortBy: by, sortAsc: asc }),
  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),
}));
