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
  login: (
    username: string,
    password: string,
  ) => { success: boolean; error?: string };
  logout: () => void;
  refreshCurrentUser: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  setFirstLoginPassword: (newPassword: string) => boolean;
  requiresPasswordReset: boolean;
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

  const login = useCallback(
    (
      username: string,
      password: string,
    ): { success: boolean; error?: string } => {
      const user = getUserByUsername(username);
      if (!user)
        return { success: false, error: "Invalid username or password" };
      if (user.passwordHash !== btoa(password))
        return { success: false, error: "Invalid username or password" };
      // Check user status
      const status = user.status ?? "active";
      if (status === "pending")
        return { success: false, error: "Account pending admin approval" };
      if (status === "rejected")
        return { success: false, error: "Account rejected by admin" };
      setSession({ userId: user.id, role: user.role as Role });
      setCurrentUser(user);
      return { success: true };
    },
    [],
  );

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

  const setFirstLoginPassword = useCallback((newPassword: string): boolean => {
    const session = getSession();
    if (!session) return false;
    const users = getUsers();
    const userIdx = users.findIndex((u) => u.id === session.userId);
    if (userIdx === -1) return false;
    users[userIdx] = {
      ...users[userIdx],
      passwordHash: btoa(newPassword),
      firstLogin: false,
    };
    saveUsers(users);
    setCurrentUser(resolveCurrentUser());
    return true;
  }, []);

  const requiresPasswordReset = currentUser?.firstLogin === true;

  const contextValue: AuthContextType = {
    currentUser,
    login,
    logout,
    refreshCurrentUser,
    changePassword,
    setFirstLoginPassword,
    requiresPasswordReset,
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
