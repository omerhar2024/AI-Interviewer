import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/components/home";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import QuestionSelectionPage from "@/pages/question-selection";
import PreparationPage from "@/pages/preparation";
import RecordingPage from "@/pages/recording";
import ReviewPage from "@/pages/review";
import ProfilePage from "@/pages/profile";
import SubscriptionPage from "@/pages/subscription";
import AuthCallback from "@/pages/auth/callback";
import ChatPage from "@/pages/chat";
import AnalysisPage from "@/pages/analysis";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/chat" element={<ChatPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <QuestionSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preparation/:questionId"
            element={
              <ProtectedRoute>
                <PreparationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recording/:questionId"
            element={
              <ProtectedRoute>
                <RecordingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:questionId"
            element={
              <ProtectedRoute>
                <ReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:responseId"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}
