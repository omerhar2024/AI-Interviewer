import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { LogOut, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  activePath?: string;
}

const Sidebar = ({ activePath = "/dashboard" }: SidebarProps) => {
  const { signOut, user } = useAuth();
  const { data: isAdmin, isLoading, refetch } = useIsAdmin();
  const [adminChecked, setAdminChecked] = useState(false);

  // Force check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Special case for omerhar2024@gmail.com
        if (user.email === "omerhar2024@gmail.com") {
          // Make sure this user is an admin in the database
          await supabase
            .from("users")
            .update({ role: "admin" })
            .eq("email", "omerhar2024@gmail.com");

          // Refresh admin status in the hook
          refetch();
          return;
        }

        // For other users, check if they are admin directly from database
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!error && data?.role === "admin") {
          // Refresh admin status in the hook
          refetch();
        }
      }
    };

    checkAdminStatus();
  }, [user, refetch]);

  return (
    <div className="flex flex-col h-full bg-blue-50 w-[280px]">
      <div className="flex items-center gap-2 p-4">
        <svg
          className="text-blue-600 h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 17V21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 12H7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 12H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-blue-600 font-bold">PM Practice</span>
      </div>

      <div className="flex-1 px-2 py-4 space-y-1">
        <NavItem
          href="/dashboard"
          label="Dashboard"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          isActive={activePath === "/dashboard"}
        />

        <NavItem
          href="/practice"
          label="Practice"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          isActive={activePath === "/practice"}
        />

        <NavItem
          href="/progress"
          label="Progress"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 12H7L10 20L14 4L17 12H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          isActive={activePath === "/progress"}
        />

        <NavItem
          href="/subscription"
          label="Subscription"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="5"
                width="20"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 10H22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          isActive={activePath === "/subscription"}
        />

        <NavItem
          href="/profile"
          label="Profile"
          icon={
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          isActive={activePath === "/profile"}
        />

        {/* Admin Link - Show for admin users or omerhar2024@gmail.com */}
        {(isAdmin || user?.email === "omerhar2024@gmail.com") && (
          <NavItem
            href="/admin"
            label="Admin"
            icon={<Shield className="h-5 w-5 text-purple-600" />}
            isActive={activePath.startsWith("/admin")}
          />
        )}

        <div
          onClick={() => signOut()}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <div className="mr-3 text-red-500">
            <LogOut className="h-5 w-5" />
          </div>
          Sign Out
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, label, href, isActive = false }: NavItemProps) => (
  <Link to={href}>
    <div
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${isActive ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-blue-50"}`}
    >
      <div className={`mr-3 ${isActive ? "text-blue-600" : "text-gray-500"}`}>
        {icon}
      </div>
      {label}
    </div>
  </Link>
);

export default Sidebar;
