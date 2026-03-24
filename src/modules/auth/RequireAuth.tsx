import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Lade...</div>;

  if (!user) return <Navigate to="/admin-v3/login" replace />;

  return <Outlet />;
};

export default RequireAuth;
