import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mail, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS } from "../../types/lms";

export function THODTeam() {
  const { users } = useLMS();
  const { currentUser } = useAuth();

  // Only show TeleCallers assigned to this THOD
  const myTeleCallers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "TeleCaller" &&
          (u.assignedTHODs ?? []).includes(currentUser?.id ?? ""),
      ),
    [users, currentUser],
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-400" />
          My Team
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          TeleCaller members assigned to you — {myTeleCallers.length} member
          {myTeleCallers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {myTeleCallers.length === 0 ? (
        <div
          data-ocid="thod.team.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            No TeleCallers assigned to you yet
          </p>
          <p className="text-xs mt-1">
            Contact Admin to assign TeleCaller members
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {myTeleCallers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              data-ocid={`thod.team.item.${idx + 1}`}
            >
              <Card className="bg-card border-border shadow-card hover:border-border/70 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="font-display text-sm font-semibold text-foreground truncate">
                        {user.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium",
                            ROLE_COLORS[user.role],
                          )}
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {user.email && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
