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
    // #region agent log
    fetch('http://127.0.0.1:7419/ingest/15698139-aa77-4be0-8181-aa4c755deb9e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6731df'},body:JSON.stringify({sessionId:'6731df',location:'file-store.ts:fetchDirectory:entry',message:'fetchDirectory called',data:{path,source,initialSource:'/',modulePhase:'fetchDirectory'},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
