import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      className={cn(
        "w-full justify-start gap-3 text-base font-medium py-4 px-4 rounded-lg transition-all duration-200",
        isActive
          ? "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 shadow-sm"
          : "hover:bg-blue-50 text-gray-700",
      )}
    >
      <div
        className={cn(
          "p-1.5 rounded-full mr-1",
          isActive ? "bg-blue-200" : "bg-gray-100",
        )}
      >
        {icon}
      </div>
      {label}
    </Button>
  </Link>
);

export default NavItem;
