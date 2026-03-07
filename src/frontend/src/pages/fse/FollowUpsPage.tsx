import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import type { FollowUp } from "../../types/lms";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
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

function FollowUpItem({
  followUp,
  leadTitle,
  index,
  onToggle,
}: {
  followUp: FollowUp;
  leadTitle: string;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`followup.item.${index + 1}`}
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
        followUp.completed
          ? "bg-secondary/20 border-border/40 opacity-60"
          : "bg-card border-border shadow-card"
      }`}
    >
      <Checkbox
        checked={followUp.completed}
        onCheckedChange={(checked) => onToggle(followUp.id, checked as boolean)}
        className="mt-0.5 shrink-0"
        data-ocid={`followup.checkbox.${index + 1}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${followUp.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
        >
          {leadTitle}
        </p>
        {followUp.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {followUp.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatTime(followUp.scheduledAt)}
          </span>
          {followUp.completed && (
            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            >
              Done
            </Badge>
          )}
        </div>
      </div>
      {!followUp.completed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(followUp.id, true)}
          data-ocid={`followup.complete_button.${index + 1}`}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400 shrink-0"
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

export function FollowUpsPage() {
  const { currentUser } = useAuth();
  const { getFSEFollowUps, updateFollowUp, leads } = useLMS();

  const followUps = useMemo(() => {
    return getFSEFollowUps(currentUser?.id ?? "");
  }, [getFSEFollowUps, currentUser]);

  const handleToggle = (id: string, completed: boolean) => {
    updateFollowUp(id, { completed });
    toast.success(completed ? "Marked as complete" : "Marked as pending");
  };

  const grouped = useMemo(() => {
    const groups: Record<string, FollowUp[]> = {};
    for (const f of followUps) {
      const label = getDateLabel(f.scheduledAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(f);
    }
    return groups;
  }, [followUps]);

  const getLeadTitle = (leadId: string): string => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.title ?? "Unknown Lead";
  };

  const totalPending = followUps.filter((f) => !f.completed).length;
  const totalCompleted = followUps.filter((f) => f.completed).length;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Follow-ups
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalPending} pending · {totalCompleted} completed
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-display text-xl font-bold text-amber-400">
                {totalPending}
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
                {totalCompleted}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {followUps.length === 0 ? (
        <div
          data-ocid="followups.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No follow-ups scheduled</p>
          <p className="text-xs mt-1">
            Add follow-ups from a lead&apos;s detail view
          </p>
        </div>
      ) : (
        <div className="space-y-6" data-ocid="followups.list">
          {GROUP_ORDER.filter((g) => grouped[g]?.length).map((groupLabel) => {
            const items = grouped[groupLabel] ?? [];
            let globalIndex = 0;
            // Calculate offset for this group to keep global indices
            for (const g of GROUP_ORDER) {
              if (g === groupLabel) break;
              globalIndex += grouped[g]?.length ?? 0;
            }
            return (
              <div key={groupLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className={GROUP_COLORS[groupLabel]}>
                    {groupLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {items[0] && formatDate(items[0].scheduledAt)}
                  </span>
                </div>
                <Card className="bg-card border-border shadow-card overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    {items.map((f, i) => (
                      <FollowUpItem
                        key={f.id}
                        followUp={f}
                        leadTitle={getLeadTitle(f.leadId)}
                        index={globalIndex + i}
                        onToggle={handleToggle}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
