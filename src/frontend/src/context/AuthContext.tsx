import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type { Role, User } from "../types/lms";
import {
  getSession,
  getUserByUsername,
  getUsers,
  saveUsers,
  setSession,
} from "../utils/storage";

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  refreshCurrentUser: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    resolveCurrentUser(),
  );

  const login = useCallback((username: string, password: string): boolean => {
    const user = getUserByUsername(username);
    if (!user) return false;
    if (user.passwordHash !== btoa(password)) return false;
    setSession({ userId: user.id, role: user.role as Role });
    setCurrentUser(user);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setCurrentUser(null);
  }, []);

  const refreshCurrentUser = useCallback(() => {
    setCurrentUser(resolveCurrentUser());
  }, []);

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string): boolean => {
      const session = getSession();
      if (!session) return false;
      const users = getUsers();
      const userIdx = users.findIndex((u) => u.id === session.userId);
      if (userIdx === -1) return false;
      const user = users[userIdx];
      if (user.passwordHash !== btoa(currentPassword)) return false;
      users[userIdx] = { ...user, passwordHash: btoa(newPassword) };
      saveUsers(users);
      setCurrentUser(resolveCurrentUser());
      return true;
    },
    [],
  );

  const contextValue: AuthContextType = {
    currentUser,
    login,
    logout,
    refreshCurrentUser,
    changePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Keep for compatibility
export { saveUsers };
