import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Calendar,
  ChevronRight,
  Kanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/lms";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  ocid: string;
}

const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.admin.dashboard.link",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    ocid: "nav.admin.users.link",
  },
  {
    to: "/admin/stages",
    label: "Stages",
    icon: Kanban,
    ocid: "nav.admin.stages.link",
  },
  {
    to: "/admin/leads",
    label: "All Leads",
    icon: BarChart2,
    ocid: "nav.admin.leads.link",
  },
];

const HOD_NAV: NavItem[] = [
  {
    to: "/hod",
    label: "My Leads",
    icon: LayoutDashboard,
    ocid: "nav.hod.leads.link",
  },
  { to: "/hod/team", label: "My Team", icon: Users, ocid: "nav.hod.team.link" },
];

const FSE_NAV: NavItem[] = [
  {
    to: "/fse",
    label: "My Leads",
    icon: LayoutDashboard,
    ocid: "nav.fse.leads.link",
  },
  {
    to: "/fse/followups",
    label: "Follow-ups",
    icon: Calendar,
    ocid: "nav.fse.followups.link",
  },
];

const TC_NAV: NavItem[] = [
  {
    to: "/telecaller",
    label: "My Leads",
    icon: LayoutDashboard,
    ocid: "nav.tc.leads.link",
  },
  {
    to: "/telecaller/upload",
    label: "Upload Leads",
    icon: Upload,
    ocid: "nav.tc.upload.link",
  },
];

const THOD_NAV: NavItem[] = [
  {
    to: "/thod",
    label: "All Leads",
    icon: LayoutDashboard,
    ocid: "nav.thod.leads.link",
  },
  {
    to: "/thod/team",
    label: "Team",
    icon: Users,
    ocid: "nav.thod.team.link",
  },
];

const BO_NAV: NavItem[] = [
  {
    to: "/bo",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.bo.dashboard.link",
  },
];

const NAV_MAP: Record<Role, NavItem[]> = {
  Admin: ADMIN_NAV,
  HOD: HOD_NAV,
  FSE: FSE_NAV,
  TeleCaller: TC_NAV,
  THOD: THOD_NAV,
  BO: BO_NAV,
};

const ROLE_BADGE: Record<Role, string> = {
  Admin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  HOD: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  FSE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  TeleCaller: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  THOD: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  BO: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const role = currentUser?.role ?? "FSE";
  const navItems = NAV_MAP[role] ?? FSE_NAV;

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-sidebar-foreground leading-none">
                LeadFlow
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                CRM Suite
              </p>
            </div>
          </div>
        </div>

        {/* Role label */}
        <div className="px-4 py-2.5 border-b border-sidebar-border">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              ROLE_BADGE[role],
            )}
          >
            <Settings className="w-2.5 h-2.5 mr-1" />
            {role} Panel
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const exactRoutes = [
              "/admin",
              "/hod",
              "/fse",
              "/telecaller",
              "/thod",
              "/bo",
            ];
            const active =
              pathname === item.to ||
              (!exactRoutes.includes(item.to) && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={item.ocid}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-primary" : "",
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto text-primary opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section with profile dropdown */}
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-ocid="nav.profile.button"
                className="w-full flex items-center gap-2 p-2 rounded-md bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">
                    {currentUser?.name?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {currentUser?.name ?? "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    @{currentUser?.username ?? ""}
                  </p>
                </div>
                <Settings className="w-3 h-3 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-52 bg-popover border-border mb-1"
            >
              <DropdownMenuLabel className="py-2">
                <p className="font-medium text-foreground text-sm">
                  {currentUser?.name ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground font-normal">
                  {role} · @{currentUser?.username}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => setChangePasswordOpen(true)}
                className="cursor-pointer flex items-center gap-2 text-sm"
                data-ocid="nav.change_password.button"
              >
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer flex items-center gap-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                data-ocid="nav.logout.button"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
}
