import { Link } from "react-router-dom";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-dot-pattern">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/30 to-purple-500/30 opacity-20"></div>
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>
        <AuthForm mode="signup" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
