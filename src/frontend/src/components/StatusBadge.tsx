import { cn } from "@/lib/utils";
import {
  type LeadSource,
  type LeadStatus,
  SOURCE_COLORS,
  STATUS_COLORS,
} from "../types/lms";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        STATUS_COLORS[status],
        className,
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-blue-400": status === "New",
          "bg-amber-400": status === "Contacted",
          "bg-purple-400": status === "Qualified",
          "bg-orange-400": status === "Proposal",
          "bg-emerald-400": status === "Won",
          "bg-slate-400": status === "Lost",
        })}
      />
      {status}
    </span>
  );
}

interface SourceBadgeProps {
  source: LeadSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        SOURCE_COLORS[source],
        className,
      )}
    >
      {source}
    </span>
  );
}
