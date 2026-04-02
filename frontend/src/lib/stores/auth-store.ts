import { create } from "zustand";
import * as authApi from "@/lib/api/auth";
import * as usersApi from "@/lib/api/users";
import { useFileStore } from "./file-store";
import { getDefaultSource } from "./source-utils";
import type { User } from "@/lib/api/users";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  renewToken: () => Promise<void>;
  updatePreferences: (prefs: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async (username, password) => {
    await authApi.login(username, password);
    const user = await usersApi.getCurrentUser();
    const source = await getDefaultSource();
    useFileStore.setState({ source });
    set({ user, isAuthenticated: true });
  },
  logout: async () => {
    await authApi.logout();
    useFileStore.setState({ source: "" });
    set({ user: null, isAuthenticated: false });
  },
  fetchUser: async () => {
    try {
      const user = await usersApi.getCurrentUser();
      set({ user, isAuthenticated: true, loading: false });
      const source = await getDefaultSource();
      if (source) {
        useFileStore.setState({ source });
      }
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
  renewToken: async () => {
    await authApi.renewToken();
  },
  updatePreferences: async (prefs) => {
    await usersApi.updateUserPreferences(prefs);
    set((state) => ({
      user: state.user ? { ...state.user, ...prefs } : null,
    }));
  },
}));
