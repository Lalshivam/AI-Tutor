import { useContext, type JSX } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Protected({ children }: { children: JSX.Element }) {
  const { accessToken } = useContext(AuthContext);
  if (!accessToken) return <Navigate to="/login" />;
  return children;
}
