import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS } from "../../types/lms";

export function HODTeam() {
  const { currentUser } = useAuth();
  const { users, leads, stages } = useLMS();

  const fses = users.filter((u) => u.role === "FSE");
  const myLeads = leads.filter((l) => l.assignedToHOD === currentUser?.id);

  const fseStats = useMemo(() => {
    return fses.map((fse) => {
      const assignedLeads = myLeads.filter((l) => l.assignedToFSE === fse.id);
      const stageBreakdown = stages
        .map((stage) => ({
          stage,
          count: assignedLeads.filter((l) => l.stageId === stage.id).length,
        }))
        .filter((s) => s.count > 0);
      return { fse, assignedLeads, stageBreakdown };
    });
  }, [fses, myLeads, stages]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Team
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          FSE members and their lead assignments
        </p>
      </div>

      {fseStats.length === 0 ? (
        <div
          data-ocid="hod.team.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p className="text-sm font-medium">No FSEs in the system</p>
          <p className="text-xs mt-1">Contact Admin to add FSE members</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fseStats.map(({ fse, assignedLeads, stageBreakdown }, idx) => (
            <motion.div
              key={fse.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              data-ocid={`hod.team.item.${idx + 1}`}
            >
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {fse.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="font-display text-sm font-semibold text-foreground">
                        {fse.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          @{fse.username}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium",
                            ROLE_COLORS[fse.role],
                          )}
                        >
                          {fse.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 p-3 rounded-lg bg-secondary/40">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Assigned Leads
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">
                      {assignedLeads.length}
                    </p>
                  </div>
                  {stageBreakdown.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        By Stage
                      </p>
                      {stageBreakdown.map(({ stage, count }) => (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="text-muted-foreground">
                              {stage.name}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {fse.email && (
                    <p className="text-xs text-muted-foreground mt-3 truncate">
                      {fse.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
