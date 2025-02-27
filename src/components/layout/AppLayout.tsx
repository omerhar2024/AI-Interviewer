import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-dot-pattern">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 opacity-10"></div>
      <div className="relative z-10">
        <DashboardHeader
          userName={user?.email?.split("@")[0] || "User"}
          userEmail={user?.email || ""}
          userAvatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
          onMenuClick={toggleSidebar}
        />
        <div className="flex">
          <div className="fixed h-full z-10">
            <Sidebar activePath={location.pathname} />
          </div>
          <main className="flex-1 pl-[280px]">{children}</main>
        </div>
      </div>
    </div>
  );
}
