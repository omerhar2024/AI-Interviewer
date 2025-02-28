import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/components/home";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import QuestionSelectionPage from "@/pages/question-selection";
import PreparationPage from "@/pages/preparation";
import RecordingPage from "@/pages/recording";
import BehavioralRecordingPage from "@/pages/behavioral-recording";
import ProductSenseRecordingPage from "@/pages/product-sense-recording";
import ReviewPage from "@/pages/review";
import ProfilePage from "@/pages/profile";
import SubscriptionPage from "@/pages/subscription";
import AuthCallback from "@/pages/auth/callback";
import ChatPage from "@/pages/chat";
import AnalysisPage from "@/pages/analysis";
import ProductSenseAnalysisPage from "@/pages/product-sense-analysis";
import CirclesAnalysisPage from "@/pages/circles-analysis";
import DesignThinkingAnalysisPage from "@/pages/design-thinking-analysis";
import JTBDAnalysisPage from "@/pages/jtbd-analysis";
import UserCentricAnalysisPage from "@/pages/user-centric-analysis";
import ProgressPage from "@/pages/progress";
import TestOpenAIPage from "@/pages/test-openai";
import TestDeepseekPage from "@/pages/test-deepseek";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("@/pages/admin"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
const AdminContentPage = lazy(() => import("@/pages/admin/content"));
const AdminApiSettingsPage = lazy(() => import("@/pages/admin/api-settings"));

function AppContent() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/practice") ||
    location.pathname.startsWith("/preparation") ||
    location.pathname.startsWith("/recording") ||
    location.pathname.startsWith("/review") ||
    location.pathname.startsWith("/analysis") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/progress") ||
    location.pathname.startsWith("/subscription");

  // Only show navbar on non-dashboard routes
  const showMainNavbar = !isDashboardRoute;

  return (
    <>
      {showMainNavbar && <Navbar />}
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
          <Route path="/test-openai" element={<TestOpenAIPage />} />
          <Route path="/test-deepseek" element={<TestDeepseekPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <QuestionSelectionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/preparation/:questionId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PreparationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recording/:questionId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RecordingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/behavioral-recording/:questionId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BehavioralRecordingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-sense-recording/:questionId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProductSenseRecordingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:questionId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-sense-analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProductSenseAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/circles-analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CirclesAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/design-thinking-analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DesignThinkingAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jtbd-analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JTBDAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-centric-analysis/:responseId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserCentricAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SubscriptionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProgressPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminAnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminContentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/api-settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminApiSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
