import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mail, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS, type Role } from "../../types/lms";

const ROLE_ORDER: Role[] = ["Admin", "THOD", "HOD", "TeleCaller", "FSE"];

const ROLE_ACCENT: Record<string, string> = {
  Admin: "border-purple-500/30 bg-purple-500/5",
  THOD: "border-rose-500/30 bg-rose-500/5",
  HOD: "border-blue-500/30 bg-blue-500/5",
  TeleCaller: "border-orange-500/30 bg-orange-500/5",
  FSE: "border-emerald-500/30 bg-emerald-500/5",
};

const ROLE_AVATAR: Record<string, string> = {
  Admin: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  THOD: "bg-rose-500/20 border-rose-500/40 text-rose-300",
  HOD: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  TeleCaller: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  FSE: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
};

export function THODTeam() {
  const { users } = useLMS();

  const grouped = useMemo(() => {
    const map: Partial<Record<Role, typeof users>> = {};
    for (const role of ROLE_ORDER) {
      const roleUsers = users.filter((u) => u.role === role);
      if (roleUsers.length > 0) {
        map[role] = roleUsers;
      }
    }
    return map;
  }, [users]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-400" />
          Team Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All {users.length} users across {Object.keys(grouped).length} roles
        </p>
      </div>

      {Object.entries(grouped).length === 0 ? (
        <div
          data-ocid="thod.team.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(grouped) as [Role, typeof users][]).map(
            ([role, roleUsers], groupIdx) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm font-semibold px-3 py-1",
                      ROLE_COLORS[role],
                    )}
                  >
                    {role === "TeleCaller" ? "Tele Caller" : role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {roleUsers.length} member{roleUsers.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roleUsers.map((user, idx) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: groupIdx * 0.08 + idx * 0.04 }}
                      data-ocid={`thod.team.item.${groupIdx + 1}`}
                    >
                      <Card
                        className={cn(
                          "border shadow-card transition-all hover:shadow-md",
                          ROLE_ACCENT[role] ?? "bg-card border-border",
                        )}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center shrink-0 font-bold text-sm",
                                ROLE_AVATAR[role] ??
                                  "bg-primary/10 border-primary/20 text-primary",
                              )}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="font-display text-sm font-semibold text-foreground truncate">
                                {user.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                @{user.username}
                              </p>
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
              </motion.div>
            ),
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <p className="text-sm font-medium text-foreground">Role Legend</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_ORDER.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className={cn("text-xs", ROLE_COLORS[role])}
            >
              {role === "TeleCaller" ? "Tele Caller" : role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
