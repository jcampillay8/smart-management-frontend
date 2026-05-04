import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../lib/api";

type AppRole = "propietario" | "admin" | "supervisor" | "user";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  role: AppRole;
  userImage?: string | null;
  termsAccepted?: boolean;
}

interface AuthContextType {
  session: { accessToken: string } | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isOwner: boolean;
  isSupervisor: boolean;
  hasMermaPermission: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ accessToken: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMermaPermission, setHasMermaPermission] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        setSession({ accessToken: token });
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/user/profile/");
      const userData: User = res.data;
      setUser(userData);
      setRole(userData.role);
      setHasMermaPermission(userData.role === "propietario" || userData.role === "admin" || userData.role === "supervisor");
    } catch (err) {
      console.error("Error fetching profile:", err);
      signOut();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await api.post("/login/", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const token = res.data.accessToken;
      if (!token) {
        throw new Error("Token no recibido del servidor");
      }
      
      localStorage.setItem("access_token", token);
      setSession({ accessToken: token });
      await fetchUserProfile();
      
      return { error: null };
    } catch (err: any) {
      console.error("Sign in error:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/logout/");
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("access_token");
    setSession(null);
    setUser(null);
    setRole(null);
    setHasMermaPermission(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        loading,
        signIn,
        signOut,
        isAdmin: role === "propietario" || role === "admin",
        isOwner: role === "propietario",
        isSupervisor: role === "supervisor",
        hasMermaPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
