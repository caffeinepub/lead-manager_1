import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LMSProvider } from "./context/LMSContext";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLeads } from "./pages/admin/AdminLeads";
import { StageManagement } from "./pages/admin/StageManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { BODashboard } from "./pages/bo/BODashboard";
import { FSEDashboard } from "./pages/fse/FSEDashboard";
import { FollowUpsPage } from "./pages/fse/FollowUpsPage";
import { HODDashboard } from "./pages/hod/HODDashboard";
import { HODTeam } from "./pages/hod/HODTeam";
import { TeleCallerDashboard } from "./pages/telecaller/TeleCallerDashboard";
import { TeleCallerUpload } from "./pages/telecaller/TeleCallerUpload";
import { THODDashboard } from "./pages/thod/THODDashboard";
import { THODTeam } from "./pages/thod/THODTeam";
import { seedData } from "./utils/storage";

// Seed data on load
seedData();

function RoleRedirect() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "Admin") {
      navigate({ to: "/admin" });
    } else if (currentUser.role === "HOD") {
      navigate({ to: "/hod" });
    } else if (currentUser.role === "TeleCaller") {
      navigate({ to: "/telecaller" });
    } else if (currentUser.role === "THOD") {
      navigate({ to: "/thod" });
    } else if (currentUser.role === "BO") {
      navigate({ to: "/bo" });
    } else {
      navigate({ to: "/fse" });
    }
  }, [currentUser, navigate]);

  return null;
}

function AuthWrapper() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <LMSProvider>
      <Layout>
        <Outlet />
      </Layout>
    </LMSProvider>
  );
}

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <AuthWrapper />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.2 0.015 260)",
            border: "1px solid oklch(0.26 0.02 260)",
            color: "oklch(0.93 0.01 260)",
          },
        }}
      />
    </AuthProvider>
  ),
});

// Index route — redirect based on role
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RoleRedirect,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboard,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: UserManagement,
});

const adminStagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/stages",
  component: StageManagement,
});

const adminLeadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/leads",
  component: AdminLeads,
});

// HOD routes
const hodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hod",
  component: HODDashboard,
});

const hodTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hod/team",
  component: HODTeam,
});

// FSE routes
const fseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fse",
  component: FSEDashboard,
});

const fseFollowUpsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fse/followups",
  component: FollowUpsPage,
});

// TeleCaller routes
const teleCallerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/telecaller",
  component: TeleCallerDashboard,
});

const teleCallerUploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/telecaller/upload",
  component: TeleCallerUpload,
});

// THOD routes
const thodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/thod",
  component: THODDashboard,
});

const thodTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/thod/team",
  component: THODTeam,
});

// BO routes
const boRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bo",
  component: BODashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  adminRoute,
  adminUsersRoute,
  adminStagesRoute,
  adminLeadsRoute,
  hodRoute,
  hodTeamRoute,
  fseRoute,
  fseFollowUpsRoute,
  teleCallerRoute,
  teleCallerUploadRoute,
  thodRoute,
  thodTeamRoute,
  boRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
