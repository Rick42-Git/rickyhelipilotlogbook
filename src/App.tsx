import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { OfflineBanner } from "@/components/OfflineBanner";

// Lazy-load heavy pages to reduce initial bundle size
const Admin = lazy(() => import("./pages/Admin"));
const MassBalance = lazy(() => import("./pages/MassBalance"));
const FlightPlanning = lazy(() => import("./pages/FlightPlanning"));
const FrequencyChart = lazy(() => import("./pages/FrequencyChart"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">Loading...</div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { activatedUser, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!activatedUser) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children?: React.ReactNode }) {
  const { activatedUser, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (loading || adminLoading) return <PageLoader />;
  if (!activatedUser) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Suspense fallback={<PageLoader />}>{children ?? <Admin />}</Suspense>;
}

function AuthRoute() {
  const { activatedUser, loading } = useAuth();
  if (loading) return null;
  if (activatedUser) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <OfflineBanner />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/mass-balance" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><MassBalance /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/flight-planning" element={<AdminRoute />} />
            <Route path="/frequency-chart" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><FrequencyChart /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
