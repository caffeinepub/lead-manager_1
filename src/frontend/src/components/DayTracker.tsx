import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLMS } from "../context/LMSContext";
import type { DayLocation, Role } from "../types/lms";

interface DayTrackerProps {
  userId: string;
  role: Role;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useElapsedTime(startIso: string | null) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startIso) {
      setElapsed("");
      return;
    }

    const update = () => {
      const diffMs = Date.now() - new Date(startIso).getTime();
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m active`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}m active`);
      } else {
        setElapsed("Just started");
      }
    };

    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [startIso]);

  return elapsed;
}

async function getLocation(): Promise<DayLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "LeadManagerApp/1.0",
              },
            },
          );
          const data = await res.json();
          resolve({
            lat: latitude,
            lng: longitude,
            address:
              data.display_name ??
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        } catch {
          resolve({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        }
      },
      () => {
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  });
}

export function DayTracker({ userId, role }: DayTrackerProps) {
  const { startDay, endDay, getTodayLog } = useLMS();
  const todayLog = getTodayLog(userId);
  const [isLoading, setIsLoading] = useState(false);

  const elapsed = useElapsedTime(
    todayLog && !todayLog.dayEndTime ? todayLog.dayStartTime : null,
  );

  const status: "not_started" | "in_progress" | "ended" = todayLog
    ? todayLog.dayEndTime
      ? "ended"
      : "in_progress"
    : "not_started";

  const handleStartDay = async () => {
    setIsLoading(true);
    try {
      const location = await getLocation();
      if (!location) {
        toast.warning(
          "Location unavailable — starting day without location data.",
          {
            icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          },
        );
      }
      startDay(userId, role, location);
      toast.success("Day started! Have a productive day.", {
        icon: <PlayCircle className="w-4 h-4 text-emerald-400" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndDay = async () => {
    if (!todayLog) return;
    setIsLoading(true);
    try {
      const location = await getLocation();
      if (!location) {
        toast.warning(
          "Location unavailable — ending day without location data.",
          {
            icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          },
        );
      }
      endDay(todayLog.id, location);
      toast.success("Day ended! Great work today.", {
        icon: <StopCircle className="w-4 h-4 text-rose-400" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const borderColor =
    status === "in_progress"
      ? "border-l-emerald-500"
      : status === "ended"
        ? "border-l-blue-500"
        : "border-l-amber-500";

  const statusConfig = {
    not_started: {
      label: "Not Started",
      dotColor: "bg-amber-400",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    in_progress: {
      label: "In Progress",
      dotColor: "bg-emerald-400 animate-pulse",
      badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    ended: {
      label: "Day Ended",
      dotColor: "bg-blue-400",
      badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
      data-ocid="daytracker.panel"
    >
      <Card
        className={`bg-card border-border border-l-4 ${borderColor} shadow-card`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Status + times */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Status dot */}
              <div className="mt-1 shrink-0">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${statusConfig.dotColor}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    Today's Work Session
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 ${statusConfig.badgeClass}`}
                    data-ocid="daytracker.status"
                  >
                    {statusConfig.label}
                  </Badge>
                  {status === "in_progress" && elapsed && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 bg-secondary text-muted-foreground border-border gap-1"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {elapsed}
                    </Badge>
                  )}
                </div>

                {/* Time + location details */}
                {todayLog && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Start info */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <PlayCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-foreground/80 font-medium">
                          Start:
                        </span>
                        <span>{formatDateTime(todayLog.dayStartTime)}</span>
                      </div>

                      {/* End info */}
                      {todayLog.dayEndTime && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <StopCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="text-foreground/80 font-medium">
                            End:
                          </span>
                          <span>{formatDateTime(todayLog.dayEndTime)}</span>
                        </div>
                      )}
                    </div>

                    {/* Locations */}
                    <div className="flex flex-col gap-0.5">
                      {todayLog.dayStartLocation ? (
                        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 text-foreground/60">
                            Start: {todayLog.dayStartLocation.address}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>Start location unavailable</span>
                        </div>
                      )}

                      {todayLog.dayEndTime &&
                        (todayLog.dayEndLocation ? (
                          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 text-foreground/60">
                              End: {todayLog.dayEndLocation.address}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>End location unavailable</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {status === "not_started" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Start Day" to begin — your location and time will be
                    recorded
                  </p>
                )}
              </div>
            </div>

            {/* Right: Action button */}
            <div className="shrink-0">
              {status === "not_started" && (
                <Button
                  onClick={handleStartDay}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium"
                  data-ocid="daytracker.start_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Day
                    </>
                  )}
                </Button>
              )}

              {status === "in_progress" && (
                <Button
                  onClick={handleEndDay}
                  disabled={isLoading}
                  variant="destructive"
                  className="gap-2 font-medium"
                  data-ocid="daytracker.end_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4" />
                      End Day
                    </>
                  )}
                </Button>
              )}

              {status === "ended" && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Day Complete
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
