import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { API_BASE } from "../api";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  async function refresh() {
    // Only attempt refresh if we have a stored token
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
        method: 'POST',
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error('Refresh failed');
      }
      
      const data = await res.json();

      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        setAccessToken(data.accessToken);
      }
    } catch (err) {
      // Silent fail - user just needs to login
      localStorage.removeItem("token");
      setAccessToken(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const handleSetAccessToken = (token: string | null) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    setAccessToken(token);
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken: handleSetAccessToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}