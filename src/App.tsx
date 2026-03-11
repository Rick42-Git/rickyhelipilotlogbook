import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAccessRequest } from "@/hooks/useAccessRequest";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import WaitlistPending from "./pages/WaitlistPending";
import MassBalance from "./pages/MassBalance";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOffline } from "@/hooks/useOffline";
import { getOfflineUser } from "@/lib/offlineCache";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isOfflineMode } = useAuth();
  const { status, requestAccess } = useAccessRequest();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const isOffline = useOffline();

  // Auto-request access on first login
  useEffect(() => {
    if (user && !isOfflineMode && !isOffline && status === 'none') {
      requestAccess();
    }
  }, [user, status, isOfflineMode, isOffline]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  
  // Offline mode bypasses waitlist/admin checks (both explicit offline mode and device offline with approved user)
  if (isOfflineMode) return <>{children}</>;
  
  // If device is offline and user has offline approval cached, bypass waitlist
  if (isOffline) {
    const cached = getOfflineUser();
    if (cached && cached.offlineApproved) return <>{children}</>;
  }
  
  if (adminLoading || status === 'loading') {
    return <div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">Loading...</div>;
  }
  
  // Admins bypass waitlist
  if (isAdmin) return <>{children}</>;
  
  if (status === 'pending' || status === 'none') return <WaitlistPending status="pending" />;
  if (status === 'rejected') return <WaitlistPending status="rejected" />;
  
  return <>{children}</>;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (loading || adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Admin />;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
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
            <Route path="/mass-balance" element={<ProtectedRoute><MassBalance /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
