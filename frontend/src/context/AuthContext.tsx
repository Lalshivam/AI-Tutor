import { createContext, useEffect, useState, ReactNode } from "react";

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
    try {
      const res = await fetch("/v1/auth/refresh", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        setAccessToken(data.accessToken);
      }
    } catch (err) {
      // Silent fail - user just needs to login
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
