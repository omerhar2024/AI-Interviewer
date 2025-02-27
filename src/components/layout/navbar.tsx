import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="w-full h-16 border-b bg-white shadow-sm">
      <div className="container flex h-full items-center justify-between">
        <Link to="/" className="font-bold text-xl text-blue-600">
          PM Practice
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors",
              isActive("/dashboard") ? "text-blue-600" : "hover:text-blue-600",
            )}
          >
            Dashboard
          </Link>
          <Link
            to="/practice"
            className={cn(
              "text-sm font-medium transition-colors",
              isActive("/practice") ? "text-blue-600" : "hover:text-blue-600",
            )}
          >
            Practice
          </Link>
          <Link
            to="/subscription"
            className={cn(
              "text-sm font-medium transition-colors",
              isActive("/subscription")
                ? "text-blue-600"
                : "hover:text-blue-600",
            )}
          >
            Subscription
          </Link>
          <Link
            to="/profile"
            className={cn(
              "text-sm font-medium transition-colors",
              isActive("/profile") ? "text-blue-600" : "hover:text-blue-600",
            )}
          >
            Profile
          </Link>
          {user ? (
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="text-sm font-medium hover:text-blue-600"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              asChild
              className="text-sm font-medium hover:text-blue-600"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
