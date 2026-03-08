import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Kanban,
  MapPin,
  PhoneCall,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS } from "../../types/lms";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const followUpDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (followUpDay < today) return "Overdue";
  if (followUpDay.getTime() === today.getTime()) return "Today";
  if (followUpDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (followUpDay < nextWeek) return "This Week";
  return "Later";
}

const GROUP_ORDER = ["Overdue", "Today", "Tomorrow", "This Week", "Later"];
const GROUP_COLORS: Record<string, string> = {
  Overdue: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Today: "bg-primary/15 text-primary border-primary/30",
  Tomorrow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "This Week": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Later: "bg-secondary text-muted-foreground border-border",
};

function formatDayDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminDashboard() {
  const { currentUser } = useAuth();
  const {
    users,
    leads,
    stages,
    followUps,
    updateFollowUp,
    getDayLogsForDate,
    getPendingOrderIdRequests,
    updateOrderIdRequest,
  } = useLMS();

  const [activeTab, setActiveTab] = useState("overview");

  // Day Reports state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(todayStr);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const hods = users.filter((u) => u.role === "HOD").length;
    const fses = users.filter((u) => u.role === "FSE").length;
    const teleCallers = users.filter((u) => u.role === "TeleCaller").length;
    const thods = users.filter((u) => u.role === "THOD").length;
    const totalLeads = leads.length;
    const assignedLeads = leads.filter((l) => l.assignedToHOD).length;
    const unassignedLeads = leads.filter((l) => !l.assignedToHOD).length;
    return {
      totalUsers,
      hods,
      fses,
      teleCallers,
      thods,
      totalLeads,
      assignedLeads,
      unassignedLeads,
    };
  }, [users, leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [leads]);

  const stageBreakdown = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      count: leads.filter((l) => l.stageId === stage.id).length,
    }));
  }, [stages, leads]);

  // Admin follow-ups: system-wide, all follow-ups
  const adminFollowUps = useMemo(() => {
    return [...followUps].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [followUps]);

  const adminPending = adminFollowUps.filter((f) => !f.completed).length;
  const adminCompleted = adminFollowUps.filter((f) => f.completed).length;

  const adminGrouped = useMemo(() => {
    const groups: Record<string, typeof adminFollowUps> = {};
    for (const f of adminFollowUps) {
      const label = getDateLabel(f.scheduledAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(f);
    }
    return groups;
  }, [adminFollowUps]);

  const handleToggleFollowUp = (id: string, completed: boolean) => {
    updateFollowUp(id, { completed });
    toast.success(completed ? "Marked as complete" : "Marked as pending");
  };

  const pendingOrderIdRequests = useMemo(
    () => getPendingOrderIdRequests(),
    [getPendingOrderIdRequests],
  );

  const handleApproveOrderId = (id: string) => {
    updateOrderIdRequest(id, {
      status: "approved",
      reviewedById: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewedAt: new Date().toISOString(),
    });
    toast.success("Order ID request approved");
  };

  const handleRejectOrderId = (id: string) => {
    updateOrderIdRequest(id, {
      status: "rejected",
      reviewedById: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewedAt: new Date().toISOString(),
    });
    toast.success("Order ID request rejected");
  };

  // Day reports: all TeleCaller + FSE users
  const reportUsers = useMemo(
    () => users.filter((u) => u.role === "TeleCaller" || u.role === "FSE"),
    [users],
  );

  const reportLogs = useMemo(
    () => getDayLogsForDate(reportDate),
    [getDayLogsForDate, reportDate],
  );

  const STAT_CARDS = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      ocid: "admin.total_users.card",
    },
    {
      label: "HODs",
      value: stats.hods,
      icon: UserCog,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      ocid: "admin.hods.card",
    },
    {
      label: "FSEs",
      value: stats.fses,
      icon: UserCog,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      ocid: "admin.fses.card",
    },
    {
      label: "TeleCallers",
      value: stats.teleCallers,
      icon: PhoneCall,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      ocid: "admin.telecallers.card",
    },
    {
      label: "THODs",
      value: stats.thods,
      icon: Users,
      color: "text-rose-400",
      bgColor: "bg-rose-400/10",
      ocid: "admin.thods.card",
    },
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      ocid: "admin.total_leads.card",
    },
    {
      label: "Assigned",
      value: stats.assignedLeads,
      icon: BarChart2,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      ocid: "admin.assigned_leads.card",
    },
    {
      label: "Unassigned",
      value: stats.unassignedLeads,
      icon: Kanban,
      color: "text-rose-400",
      bgColor: "bg-rose-400/10",
      ocid: "admin.unassigned_leads.card",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back, {currentUser?.name}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="overview"
      >
        <TabsList className="mb-5 bg-secondary border border-border">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.tabs.overview.tab"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="followups"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.tabs.followups.tab"
          >
            <Calendar className="w-3.5 h-3.5" />
            Follow-ups
            {adminPending > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {adminPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="dayreports"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.tabs.dayreports.tab"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Day Reports
          </TabsTrigger>
          <TabsTrigger
            value="pendingapproval"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.tabs.pendingapproval.tab"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Pending Approval
            {pendingOrderIdRequests.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                {pendingOrderIdRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {STAT_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-ocid={card.ocid}
              >
                <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {card.label}
                        </p>
                        <p
                          className={`font-display text-2xl font-bold ${card.color}`}
                        >
                          {card.value}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Stage breakdown */}
            <Card className="lg:col-span-2 bg-card border-border shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">
                  Leads by Stage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stageBreakdown.map(({ stage, count }) => {
                  const max = Math.max(
                    ...stageBreakdown.map((s) => s.count),
                    1,
                  );
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={stage.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-foreground font-medium">
                            {stage.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    to: "/admin/users",
                    label: "Manage Users",
                    icon: Users,
                    desc: "Add, edit, delete users",
                  },
                  {
                    to: "/admin/stages",
                    label: "Manage Stages",
                    icon: Kanban,
                    desc: "Create or edit pipeline stages",
                  },
                  {
                    to: "/admin/leads",
                    label: "All Leads",
                    icon: TrendingUp,
                    desc: "View and assign all leads",
                  },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Leads */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-base">
                Recent Leads
              </CardTitle>
              <Link
                to="/admin/leads"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="admin.leads.empty_state"
                >
                  No leads yet. Add your first lead!
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {lead.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {lead.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[lead.city, lead.state].filter(Boolean).join(", ") ||
                            lead.name}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {formatDate(lead.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Follow-ups Tab ── */}
        <TabsContent value="followups">
          {/* Summary mini-cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="font-display text-xl font-bold text-amber-400">
                    {adminPending}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-display text-xl font-bold text-emerald-400">
                    {adminCompleted}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {adminFollowUps.length === 0 ? (
            <div
              data-ocid="admin.followups.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No follow-ups scheduled</p>
              <p className="text-xs mt-1">
                Follow-ups added by FSEs across all leads will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6" data-ocid="admin.followups.list">
              {GROUP_ORDER.filter((g) => adminGrouped[g]?.length).map(
                (groupLabel) => {
                  const items = adminGrouped[groupLabel] ?? [];
                  let globalIndex = 0;
                  for (const g of GROUP_ORDER) {
                    if (g === groupLabel) break;
                    globalIndex += adminGrouped[g]?.length ?? 0;
                  }
                  return (
                    <div key={groupLabel}>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant="outline"
                          className={GROUP_COLORS[groupLabel]}
                        >
                          {groupLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {items[0] && formatDateLong(items[0].scheduledAt)}
                        </span>
                      </div>
                      <Card className="bg-card border-border shadow-card overflow-hidden">
                        <CardContent className="p-3 space-y-2">
                          {items.map((f, i) => {
                            const itemIndex = globalIndex + i;
                            const lead = leads.find((l) => l.id === f.leadId);
                            const leadTitle =
                              lead?.title ?? lead?.name ?? "Unknown Lead";
                            const fseUser = users.find(
                              (u) => u.id === f.assignedTo,
                            );
                            return (
                              <motion.div
                                key={f.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: itemIndex * 0.04 }}
                                data-ocid={`admin.followup.item.${itemIndex + 1}`}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                                  f.completed
                                    ? "bg-secondary/20 border-border/40 opacity-60"
                                    : "bg-card border-border shadow-card"
                                }`}
                              >
                                <Checkbox
                                  checked={f.completed}
                                  onCheckedChange={(checked) =>
                                    handleToggleFollowUp(
                                      f.id,
                                      checked as boolean,
                                    )
                                  }
                                  className="mt-0.5 shrink-0"
                                  data-ocid={`admin.followup.checkbox.${itemIndex + 1}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium truncate ${f.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                                  >
                                    {leadTitle}
                                  </p>
                                  {f.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {f.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(f.scheduledAt)}
                                    </span>
                                    {fseUser && (
                                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                                        <UserCheck className="w-3 h-3" />
                                        {fseUser.name}
                                      </span>
                                    )}
                                    {f.completed && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      >
                                        Done
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {!f.completed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleFollowUp(f.id, true)
                                    }
                                    data-ocid={`admin.followup.complete_button.${itemIndex + 1}`}
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400 shrink-0"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </motion.div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Day Reports Tab ── */}
        <TabsContent value="dayreports">
          {/* Date picker */}
          <div className="flex items-center gap-3 mb-5">
            <label
              htmlFor="admin-report-date"
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Select Date:
            </label>
            <Input
              id="admin-report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-secondary border-border max-w-[180px]"
              data-ocid="admin.dayreports.date_input"
            />
            <span className="text-xs text-muted-foreground">
              Showing reports for{" "}
              {new Date(`${reportDate}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {reportUsers.length === 0 ? (
            <div
              data-ocid="admin.dayreports.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                No TeleCaller or FSE users found
              </p>
              <p className="text-xs mt-1">
                Add TeleCaller or FSE users to see day reports
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <Table data-ocid="admin.dayreports.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium pl-4">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Role
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Day Start
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
                      Start Location
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Day End
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
                      End Location
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportUsers.map((user, idx) => {
                    const log = reportLogs.find((l) => l.userId === user.id);
                    const status = log
                      ? log.dayEndTime
                        ? "Completed"
                        : "In Progress"
                      : "Not Started";

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        data-ocid={`admin.dayreports.row.${idx + 1}`}
                        className="border-border hover:bg-secondary/20 transition-colors"
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground text-sm">
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${ROLE_COLORS[user.role]}`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log ? (
                            <div className="flex items-center gap-1 text-xs text-foreground/80">
                              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                              {formatDayDateTime(log.dayStartTime)}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {log?.dayStartLocation ? (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[200px]">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-emerald-400" />
                              <span className="line-clamp-2">
                                {log.dayStartLocation.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log?.dayEndTime ? (
                            <div className="flex items-center gap-1 text-xs text-foreground/80">
                              <Clock className="w-3 h-3 text-rose-400 shrink-0" />
                              {formatDayDateTime(log.dayEndTime)}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {log?.dayEndLocation ? (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[200px]">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-rose-400" />
                              <span className="line-clamp-2">
                                {log.dayEndLocation.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              status === "Completed"
                                ? "text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : status === "In Progress"
                                  ? "text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  : "text-[10px] bg-secondary text-muted-foreground border-border"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        {/* ── Pending Approval Tab ── */}
        <TabsContent value="pendingapproval">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              Order ID Requests — Pending Approval
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All order ID requests where all 9 documents are confirmed by FSEs
            </p>
          </div>

          {pendingOrderIdRequests.length === 0 ? (
            <div
              data-ocid="admin.pendingapproval.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No pending approvals</p>
              <p className="text-xs mt-1">
                When FSEs submit order ID requests with all documents, they will
                appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="admin.pendingapproval.list">
              {pendingOrderIdRequests.map((req, i) => {
                const lead = leads.find((l) => l.id === req.leadId);
                const stage = stages.find((s) => s.id === lead?.stageId);
                const ORDER_ID_LABELS = [
                  { key: "lightBill", label: "Light Bill" },
                  { key: "panCard", label: "PAN Card" },
                  { key: "cancelledCheque", label: "Cancelled Cheque" },
                  { key: "aadharCard", label: "Aadhar Card" },
                  { key: "allDocsGiven", label: "All Docs Given" },
                  { key: "loanApproved", label: "Loan Approved" },
                  { key: "nameOnLightBill", label: "Name on Light Bill" },
                  { key: "sanctionLoad", label: "Sanction Load" },
                  { key: "noc", label: "NOC" },
                ] as const;
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-ocid={`admin.pendingapproval.item.${i + 1}`}
                  >
                    <Card className="bg-card border-border shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {lead?.name ?? "Unknown Lead"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Submitted by{" "}
                              <span className="text-foreground">
                                {req.submittedByName}
                              </span>{" "}
                              ·{" "}
                              {new Date(req.submittedAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                            {stage && (
                              <span
                                className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                                style={{
                                  borderColor: `${stage.color}40`,
                                  color: stage.color,
                                  backgroundColor: `${stage.color}18`,
                                }}
                              >
                                {stage.name}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30 shrink-0"
                          >
                            All 9 Docs
                          </Badge>
                        </div>

                        {/* Document checklist */}
                        <div className="grid grid-cols-3 gap-1.5 mb-4">
                          {ORDER_ID_LABELS.map((field) => (
                            <div
                              key={field.key}
                              className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-emerald-500/8 border border-emerald-500/20 text-emerald-300"
                            >
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {field.label}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            onClick={() => handleApproveOrderId(req.id)}
                            data-ocid={`admin.pendingapproval.approve_button.${i + 1}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex-1"
                            onClick={() => handleRejectOrderId(req.id)}
                            data-ocid={`admin.pendingapproval.reject_button.${i + 1}`}
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
