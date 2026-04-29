import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignUp from "./pages/SignUp.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Download from "./pages/Download.tsx";

const queryClient = new QueryClient();

const getAuthState = () => {
  const authRole = localStorage.getItem("authRole");
  const authUserRaw = localStorage.getItem("authUser");
  try {
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
    return { authRole, authUser };
  } catch {
    return { authRole: null, authUser: null };
  }
};

const UserDashboardRoute = () => {
  const { authRole, authUser } = getAuthState();

  if (!authRole || !authUser) {
    return <Navigate to="/login" replace />;
  }

  if (authRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (authUser.status === "paused") {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authRole");
    return <Navigate to="/login" replace />;
  }

  return <Index />;
};

const AdminDashboardRoute = () => {
  const { authRole, authUser } = getAuthState();
  if (!authRole || !authUser) {
    return <Navigate to="/login" replace />;
  }

  if (authRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<UserDashboardRoute />} />
          <Route path="/admin" element={<AdminDashboardRoute />} />
          <Route path="/download" element={<Download />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
