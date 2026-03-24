import React from "react";
import { useAuth } from "../../modules/auth/AuthContext";
import AdminDashboard from "./admin/AdminDashboard";
import UserDashboard from "./user/UserDashboard";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default DashboardPage;
