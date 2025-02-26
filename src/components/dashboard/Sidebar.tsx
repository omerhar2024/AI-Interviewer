import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Brain,
  Settings,
  HelpCircle,
  LogOut,
  History,
  Trophy,
  User,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, label, href, isActive = false }: NavItemProps) => (
  <Link to={href}>
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-2", isActive && "bg-accent")}
    >
      {icon}
      {label}
    </Button>
  </Link>
);

interface SidebarProps {
  activePath?: string;
}

const Sidebar = ({ activePath = "/" }: SidebarProps) => {
  const navItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/" },
    { icon: <Brain size={20} />, label: "Practice", href: "/practice" },
    { icon: <History size={20} />, label: "History", href: "/history" },
    { icon: <Trophy size={20} />, label: "Progress", href: "/progress" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
  ];

  const bottomNavItems = [
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
    { icon: <HelpCircle size={20} />, label: "Help", href: "/help" },
    { icon: <LogOut size={20} />, label: "Logout", href: "/logout" },
  ];

  return (
    <div className="flex flex-col h-full w-[280px] border-r bg-background p-4">
      <div className="flex items-center gap-2 px-4 py-2">
        <Brain size={24} className="text-primary" />
        <span className="text-lg font-semibold">Interview AI</span>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={activePath === item.href}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t px-2 py-4 space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={activePath === item.href}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
