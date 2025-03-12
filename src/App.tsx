import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/lib/auth";
import { PlanProvider } from "@/context/PlanContext";
import { Toaster } from "@/components/ui/toaster";
import { useSyncSubscription } from "@/lib/hooks/use-sync-subscription";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/components/home";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import QuestionSelectionPage from "@/pages/question-selection";
import PracticeCategoriesPage from "@/pages/practice-categories";
import PreparationPage from "@/pages/preparation";
import RecordingPage from "@/pages/recording";
import BehavioralRecordingPage from "@/pages/behavioral-recording";
import ProductSenseRecordingPage from "@/pages/product-sense-recording";
import ReviewPage from "@/pages/review";
import ProfilePage from "@/pages/profile";
import SubscriptionPage from "@/pages/subscription";
import SubscriptionManagementPage from "@/pages/profile/subscription";
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
import UserManagementPage from "@/pages/admin/user-management";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("@/pages/admin"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
const AdminContentPage = lazy(() => import("@/pages/admin/content"));
const AdminApiSettingsPage = lazy(() => import("@/pages/admin/api-settings"));
const AdminUsageLimitsPage = lazy(() => import("@/pages/admin/usage-limits"));
const FixDatabasePage = lazy(() => import("@/pages/admin/fix-database"));
const FixUsersPage = lazy(() => import("@/pages/admin/fix-users"));

function AppContent() {
  const location = useLocation();

  // Use the sync subscription hook to keep subscription data in sync
  useSyncSubscription();

  // Define dashboard routes
  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/practice") ||
    location.pathname.startsWith("/preparation") ||
    location.pathname.startsWith("/recording") ||
    location.pathname.startsWith("/review") ||
    location.pathname.startsWith("/analysis") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/progress") ||
    location.pathname.startsWith("/subscription") ||
    location.pathname.startsWith("/admin"); // Make sure admin routes are included

  // Only show navbar on non-dashboard routes
  const showMainNavbar = !isDashboardRoute;

  // Create a function to wrap content in the appropriate layout
  const wrapContent = (element, needsLayout = true) => {
    // If this is a dashboard route that needs AppLayout
    if (isDashboardRoute && needsLayout) {
      return (
        <ProtectedRoute>
          <AppLayout>{element}</AppLayout>
        </ProtectedRoute>
      );
    }

    // For non-dashboard protected routes
    if (needsLayout) {
      return <ProtectedRoute>{element}</ProtectedRoute>;
    }

    // For public routes
    return element;
  };

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
          {/* Public routes - no layout needed */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/test-openai" element={<TestOpenAIPage />} />
          <Route path="/test-deepseek" element={<TestDeepseekPage />} />

          {/* Dashboard routes - these all use AppLayout */}
          <Route path="/dashboard" element={wrapContent(<DashboardPage />)} />
          <Route
            path="/practice-categories"
            element={wrapContent(<PracticeCategoriesPage />)}
          />
          <Route
            path="/practice"
            element={wrapContent(<QuestionSelectionPage />)}
          />
          <Route
            path="/preparation/:questionId"
            element={wrapContent(<PreparationPage />)}
          />
          <Route
            path="/recording/:questionId"
            element={wrapContent(<RecordingPage />)}
          />
          <Route
            path="/behavioral-recording/:questionId"
            element={wrapContent(<BehavioralRecordingPage />)}
          />
          <Route
            path="/product-sense-recording/:questionId"
            element={wrapContent(<ProductSenseRecordingPage />)}
          />
          <Route
            path="/review/:questionId"
            element={wrapContent(<ReviewPage />)}
          />
          <Route
            path="/analysis/:responseId"
            element={wrapContent(<AnalysisPage />)}
          />
          <Route
            path="/product-sense-analysis/:responseId"
            element={wrapContent(<ProductSenseAnalysisPage />)}
          />
          <Route
            path="/circles-analysis/:responseId"
            element={wrapContent(<CirclesAnalysisPage />)}
          />
          <Route
            path="/design-thinking-analysis/:responseId"
            element={wrapContent(<DesignThinkingAnalysisPage />)}
          />
          <Route
            path="/jtbd-analysis/:responseId"
            element={wrapContent(<JTBDAnalysisPage />)}
          />
          <Route
            path="/user-centric-analysis/:responseId"
            element={wrapContent(<UserCentricAnalysisPage />)}
          />
          <Route path="/profile" element={wrapContent(<ProfilePage />)} />
          <Route
            path="/subscription"
            element={wrapContent(<SubscriptionPage />)}
          />
          <Route
            path="/profile/subscription"
            element={wrapContent(<SubscriptionManagementPage />)}
          />
          <Route path="/progress" element={wrapContent(<ProgressPage />)} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* Keep other admin routes as they are... */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminAnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminContentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/api-settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminApiSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usage-limits"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminUsageLimitsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fix-database"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FixDatabasePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fix-users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FixUsersPage />
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
      <PlanProvider>
        <AppContent />
      </PlanProvider>
    </AuthProvider>
  );
}
