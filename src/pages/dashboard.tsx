import React from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MainContent from "@/components/dashboard/MainContent";
import Sidebar from "@/components/dashboard/Sidebar";

interface DashboardProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  metrics?: {
    totalUsers: number;
    activeUsers: number;
    engagementRate: number;
    averageSessionTime: string;
  };
  activities?: Array<{
    id: string;
    title: string;
    timestamp: string;
    type: string;
  }>;
}

const Dashboard = ({
  userName = "John Doe",
  userEmail = "john@example.com",
  userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  metrics = {
    totalUsers: 1234,
    activeUsers: 789,
    engagementRate: 76.5,
    averageSessionTime: "12m 30s",
  },
  activities = [
    {
      id: "1",
      title: "User session completed",
      timestamp: "2 hours ago",
      type: "session",
    },
    {
      id: "2",
      title: "New user registered",
      timestamp: "4 hours ago",
      type: "user",
    },
    {
      id: "3",
      title: "Milestone achieved",
      timestamp: "6 hours ago",
      type: "achievement",
    },
  ],
}: DashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        onMenuClick={toggleSidebar}
      />
      <div className="flex">
        <div
          className={`${isSidebarOpen ? "block" : "hidden"} md:block transition-all duration-300 ease-in-out`}
        >
          <Sidebar activePath="/" />
        </div>
        <main className="flex-1">
          <MainContent metrics={metrics} activities={activities} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
