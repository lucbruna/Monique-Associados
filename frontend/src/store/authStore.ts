import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  profileImage?: string;
  updatedAt?: string;
}

interface Permissions {
  role: string;
  canViewAllCases: boolean;
  canViewAllClients: boolean;
  canCreateCase: boolean;
  canDeleteCase: boolean;
  canDeleteAny: boolean;
  canDeleteClient: boolean;
  canViewFinance: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canViewReports: boolean;
  canViewTeam: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: Permissions | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setPermissions: (permissions: Permissions) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      setPermissions: (permissions) => {
        set({ permissions });
      },
      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
        }));
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, permissions: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
