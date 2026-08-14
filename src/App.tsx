import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useRole, isDepartmentManager } from "@/hooks/useRole";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Deals from "./pages/Deals";
import Activities from "./pages/Activities";
import Procurement from "./pages/Procurement";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import HRPage from "./pages/HRPage";
import Reports from "./pages/Reports";
import Projects from "./pages/Projects";
import Sites from "./pages/Sites";
import Scheduling from "./pages/Scheduling";
import EquipmentCheckouts from "./pages/EquipmentCheckouts";
import Maintenance from "./pages/Maintenance";
import Consumption from "./pages/Consumption";
import Timesheets from "./pages/Timesheets";
import Expenses from "./pages/Expenses";
import EmployeePortal from "./pages/EmployeePortal";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LiquidityGuardian from "./pages/sae/LiquidityGuardian";
import SAEControlPanel from "./pages/sae/SAEControlPanel";
import ProcurementScout from "./pages/sae/ProcurementScout";
import ComplianceMonitor from "./pages/sae/ComplianceMonitor";
import LoadSheddingPlanner from "./pages/sae/LoadSheddingPlanner";
import SAEAuditLog from "./pages/sae/SAEAuditLog";
import ApprovalSettings from "./pages/settings/ApprovalSettings";

const queryClient = new QueryClient();

function PendingApproval() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-lg font-bold text-primary-foreground">S</span>
      </div>
      <h1 className="text-lg font-semibold">Pending Approval</h1>
      <p className="text-sm text-muted-foreground max-w-sm text-center">
        Your account is awaiting role assignment by an administrator. Please check back later.
      </p>
      <button onClick={signOut} className="text-sm text-primary hover:underline mt-2">Sign Out</button>
    </div>
  );
}

const DEPT_ROUTE_MAP: Record<string, { path: string; element: React.ReactNode }[]> = {
  procurement_manager: [
    { path: '/procurement', element: <Procurement /> },
    { path: '/sites', element: <Sites /> },
    { path: '/equipment', element: <EquipmentCheckouts /> },
    { path: '/maintenance', element: <Maintenance /> },
    { path: '/consumption', element: <Consumption /> },
    { path: '/sae/procurement', element: <ProcurementScout /> },
    { path: '/sae/operations', element: <LoadSheddingPlanner /> },
    { path: '/sae/audit', element: <SAEAuditLog /> },
  ],
  hr_manager: [
    { path: '/hr', element: <HRPage /> },
    { path: '/sae/compliance', element: <ComplianceMonitor /> },
    { path: '/sae/audit', element: <SAEAuditLog /> },
  ],
  project_manager: [
    { path: '/projects', element: <Projects /> },
    { path: '/sites', element: <Sites /> },
    { path: '/scheduling', element: <Scheduling /> },
    { path: '/timesheets', element: <Timesheets /> },
    { path: '/sae/operations', element: <LoadSheddingPlanner /> },
    { path: '/sae/audit', element: <SAEAuditLog /> },
  ],
  finance_manager: [
    { path: '/invoices', element: <Invoices /> },
    { path: '/payments', element: <Payments /> },
    { path: '/expenses', element: <Expenses /> },
    { path: '/sae/liquidity', element: <LiquidityGuardian /> },
    { path: '/sae/compliance', element: <ComplianceMonitor /> },
    { path: '/sae/control', element: <SAEControlPanel /> },
    { path: '/sae/audit', element: <SAEAuditLog /> },
  ],
};

function ProtectedRoutes() {
  const { loading } = useAuth();
  const { role } = useDemoRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-sm font-bold text-primary-foreground">S</span>
        </div>
      </div>
    );
  }

  if (!role) return <RoleSelect />;

  if (isDepartmentManager(role)) {
    const routes = DEPT_ROUTE_MAP[role] || [];
    return (
      <AppLayout role={role}>
        <Routes>
          <Route path="/" element={<EmployeePortal />} />
          <Route path="/settings" element={<Settings />} />
          {routes.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  if (role === 'employee') {
    return (
      <AppLayout role="employee">
        <Routes>
          <Route path="/" element={<EmployeePortal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    );
  }


  // Admin: everything
  return (
    <AppLayout role="admin">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/equipment" element={<EquipmentCheckouts />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/consumption" element={<Consumption />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/procurement" element={<Procurement />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/hr" element={<HRPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/sae/liquidity" element={<LiquidityGuardian />} />
        <Route path="/sae/procurement" element={<ProcurementScout />} />
        <Route path="/sae/compliance" element={<ComplianceMonitor />} />
        <Route path="/sae/operations" element={<LoadSheddingPlanner />} />
        <Route path="/sae/control" element={<SAEControlPanel />} />
        <Route path="/sae/audit" element={<SAEAuditLog />} />
        <Route path="/settings/approvals" element={<ApprovalSettings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
