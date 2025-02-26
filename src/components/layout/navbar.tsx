import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-full items-center justify-between">
        <Link to="/" className="font-bold text-xl text-primary">
          PM Practice
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/practice"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Practice
            </Link>
            <Link
              to="/subscription"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Subscription
            </Link>
            <Link
              to="/profile"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Profile
            </Link>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
