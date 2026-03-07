import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart2,
  Kanban,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminDashboard() {
  const { currentUser } = useAuth();
  const { users, leads, stages } = useLMS();

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const hods = users.filter((u) => u.role === "HOD").length;
    const fses = users.filter((u) => u.role === "FSE").length;
    const totalLeads = leads.length;
    const assignedLeads = leads.filter((l) => l.assignedToHOD).length;
    const unassignedLeads = leads.filter((l) => !l.assignedToHOD).length;
    return {
      totalUsers,
      hods,
      fses,
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
              const max = Math.max(...stageBreakdown.map((s) => s.count), 1);
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
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
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
          <CardTitle className="font-display text-base">Recent Leads</CardTitle>
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
                      {lead.company} · {lead.name}
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
    </div>
  );
}
