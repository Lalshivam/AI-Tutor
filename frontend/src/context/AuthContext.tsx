import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await fetch("/auth/refresh", {
      credentials: "include"
    });
    const data = await res.json();

    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      setAccessToken(data.accessToken);
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
