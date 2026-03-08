import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Calendar,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Send,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AddLeadDialog,
  type LeadFormInput,
} from "../../components/AddLeadDialog";
import { generateFVRPdf } from "../../components/FirstVisitReportDialog";
import { LeadUploadDialog } from "../../components/LeadUploadDialog";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import type { Lead } from "../../types/lms";
import { ROLE_COLORS } from "../../types/lms";
import { exportLeadsToCSV } from "../../utils/exportLeads";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
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

function formatDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateForFilename(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export function HODDashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    notes,
    followUps,
    addLead,
    assignLeadToFSE,
    getLeadNotes,
    addNote,
    getLeadFollowUps,
    getLeadFVRs,
    updateFollowUp,
    getDayLogsForDate,
  } = useLMS();

  // HOD only sees leads assigned to them
  const myLeads = useMemo(() => {
    return leads.filter((l) => l.assignedToHOD === currentUser?.id);
  }, [leads, currentUser]);

  const myLeadIds = useMemo(() => new Set(myLeads.map((l) => l.id)), [myLeads]);

  const fses = users.filter((u) => u.role === "FSE");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignFSELeadId, setAssignFSELeadId] = useState<string | null>(null);
  const [assignFSEId, setAssignFSEId] = useState("");
  const [noteText, setNoteText] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Selection state for download
  const [hodSelectedIds, setHodSelectedIds] = useState<Set<string>>(new Set());

  // Day reports state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(todayStr);

  const stats = useMemo(() => {
    const total = myLeads.length;
    const assigned = myLeads.filter((l) => l.assignedToFSE).length;
    const unassigned = myLeads.filter((l) => !l.assignedToFSE).length;
    return { total, assigned, unassigned };
  }, [myLeads]);

  // HOD follow-ups: all follow-ups for leads assigned to this HOD
  const hodFollowUps = useMemo(() => {
    return followUps
      .filter((f) => {
        const lead = leads.find((l) => l.id === f.leadId);
        return lead?.assignedToHOD === currentUser?.id;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
  }, [followUps, leads, currentUser]);

  const hodPending = hodFollowUps.filter((f) => !f.completed).length;
  const hodCompleted = hodFollowUps.filter((f) => f.completed).length;

  const hodGrouped = useMemo(() => {
    const groups: Record<string, typeof hodFollowUps> = {};
    for (const f of hodFollowUps) {
      const label = getDateLabel(f.scheduledAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(f);
    }
    return groups;
  }, [hodFollowUps]);

  const handleToggleFollowUp = (id: string, completed: boolean) => {
    updateFollowUp(id, { completed });
    toast.success(completed ? "Marked as complete" : "Marked as pending");
  };

  // Day reports: FSEs assigned to leads under this HOD
  const hodFseIds = useMemo(
    () =>
      new Set(myLeads.map((l) => l.assignedToFSE).filter(Boolean) as string[]),
    [myLeads],
  );

  const hodFseUsers = useMemo(
    () => users.filter((u) => u.role === "FSE" && hodFseIds.has(u.id)),
    [users, hodFseIds],
  );

  const hodReportLogs = useMemo(
    () => getDayLogsForDate(reportDate),
    [getDayLogsForDate, reportDate],
  );

  // Unified FSE activity feed: all notes + follow-ups for my leads, sorted by createdAt desc
  const activityFeed = useMemo(() => {
    type ActivityItem =
      | {
          kind: "note";
          id: string;
          leadId: string;
          authorId: string;
          text: string;
          createdAt: string;
        }
      | {
          kind: "followup";
          id: string;
          leadId: string;
          assignedTo: string;
          description: string;
          scheduledAt: string;
          createdAt: string;
          completed: boolean;
        };

    const noteItems: ActivityItem[] = notes
      .filter((n) => myLeadIds.has(n.leadId))
      .map((n) => ({
        kind: "note" as const,
        id: n.id,
        leadId: n.leadId,
        authorId: n.authorId,
        text: n.text,
        createdAt: n.createdAt,
      }));

    const followUpItems: ActivityItem[] = followUps
      .filter((f) => myLeadIds.has(f.leadId))
      .map((f) => ({
        kind: "followup" as const,
        id: f.id,
        leadId: f.leadId,
        assignedTo: f.assignedTo,
        description: f.description,
        scheduledAt: f.scheduledAt,
        createdAt: f.createdAt,
        completed: f.completed,
      }));

    return [...noteItems, ...followUpItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notes, followUps, myLeadIds]);

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);
  const getUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : null;
  const getLead = (leadId: string) => leads.find((l) => l.id === leadId);

  const handleAddSubmit = (data: LeadFormInput) => {
    addLead({
      title: data.name.trim(),
      name: data.name.trim(),
      mobileNo: data.mobileNo.trim(),
      address: data.address.trim(),
      monthlyBill: data.monthlyBill.trim(),
      state: data.state.trim(),
      city: data.city.trim(),
      appointedAt: data.appointedAt,
      source: data.source,
      stageId: data.stageId || (stages[0]?.id ?? ""),
      assignedToHOD: currentUser?.id ?? null,
      assignedToFSE: null,
      createdBy: currentUser?.id ?? "",
      uploadedBy: null,
    });
    toast.success("Lead added");
    setAddOpen(false);
  };

  const handleImport = (importedLeads: Partial<LeadFormInput>[]) => {
    const firstStageId = stages[0]?.id ?? "";
    let count = 0;
    for (const row of importedLeads) {
      if (!row.name?.trim()) continue;
      addLead({
        title: row.name.trim(),
        name: row.name.trim(),
        mobileNo: row.mobileNo?.trim() ?? "",
        address: row.address?.trim() ?? "",
        monthlyBill: row.monthlyBill?.trim() ?? "",
        state: row.state?.trim() ?? "",
        city: row.city?.trim() ?? "",
        appointedAt: row.appointedAt ?? "",
        source: row.source?.trim() || "Other",
        stageId: firstStageId,
        assignedToHOD: currentUser?.id ?? null,
        assignedToFSE: null,
        createdBy: currentUser?.id ?? "",
        uploadedBy: currentUser?.id ?? null,
      });
      count++;
    }
    if (count > 0) {
      toast.success(`Imported ${count} lead${count !== 1 ? "s" : ""}`);
    }
  };

  const handleAssignFSE = () => {
    if (!assignFSELeadId) return;
    assignLeadToFSE(assignFSELeadId, assignFSEId || null);
    toast.success("Lead assigned to FSE");
    setAssignFSELeadId(null);
    setAssignFSEId("");
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedLead) return;
    addNote(selectedLead.id, noteText.trim(), currentUser?.id ?? "");
    setNoteText("");
    toast.success("Note added");
  };

  const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : [];
  const selectedLeadFollowUps = selectedLead
    ? getLeadFollowUps(selectedLead.id)
    : [];
  const selectedLeadFVRs = selectedLead ? getLeadFVRs(selectedLead.id) : [];

  // Checkbox helpers for HOD lead cards
  const allSelected =
    myLeads.length > 0 && myLeads.every((l) => hodSelectedIds.has(l.id));
  const someHodSelected = hodSelectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setHodSelectedIds(new Set());
    } else {
      setHodSelectedIds(new Set(myLeads.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setHodSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadAll = () => {
    exportLeadsToCSV(myLeads, users, stages);
    toast.success(
      `Exported ${myLeads.length} lead${myLeads.length !== 1 ? "s" : ""} to CSV`,
    );
  };

  const handleDownloadSelected = () => {
    const leadsToExport = myLeads.filter((l) => hodSelectedIds.has(l.id));
    if (leadsToExport.length === 0) return;
    exportLeadsToCSV(leadsToExport, users, stages);
    toast.success(
      `Exported ${leadsToExport.length} selected lead${leadsToExport.length !== 1 ? "s" : ""} to CSV`,
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            HOD Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome, {currentUser?.name} — leads assigned to you and your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
            data-ocid="hod.upload_button"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-ocid="hod.add_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Leads",
            value: stats.total,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Assigned to FSE",
            value: stats.assigned,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            label: "Unassigned",
            value: stats.unassigned,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-display text-2xl font-bold ${s.color}`}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs: My Leads / FSE Activity */}
      <Tabs defaultValue="my-leads">
        <TabsList className="mb-5 bg-secondary border border-border">
          <TabsTrigger
            value="my-leads"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="hod.tabs.leads.tab"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            My Leads
            {myLeads.length > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {myLeads.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="fse-activity"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="hod.tabs.activity.tab"
          >
            <Activity className="w-3.5 h-3.5" />
            FSE Activity
            {activityFeed.length > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {activityFeed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="followups"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="hod.tabs.followups.tab"
          >
            <Calendar className="w-3.5 h-3.5" />
            Follow-ups
            {hodPending > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {hodPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="dayreports"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="hod.tabs.dayreports.tab"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Day Reports
          </TabsTrigger>
        </TabsList>

        {/* ── My Leads Tab ── */}
        <TabsContent value="my-leads">
          {myLeads.length === 0 ? (
            <div
              data-ocid="hod.leads.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                No leads assigned to you yet
              </p>
              <p className="text-xs mt-1">
                Ask your Admin to assign leads, or add one yourself
              </p>
            </div>
          ) : (
            <>
              {/* Tab header with selection controls and download */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  {someHodSelected && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">
                        ·
                      </span>
                      <span className="text-xs text-primary font-medium">
                        {hodSelectedIds.size} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setHodSelectedIds(new Set())}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border bg-secondary hover:bg-secondary/70 gap-1.5 h-8"
                      data-ocid="hod.download_button"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-popover border-border w-52"
                  >
                    <DropdownMenuItem
                      onClick={handleDownloadAll}
                      className="cursor-pointer flex items-center gap-2 text-sm"
                      data-ocid="hod.download_all.button"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      Download All ({myLeads.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDownloadSelected}
                      disabled={!someHodSelected}
                      className="cursor-pointer flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      data-ocid="hod.download_selected.button"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      Download Selected ({hodSelectedIds.size})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myLeads.map((lead, idx) => {
                  const stage = getStage(lead.stageId);
                  const fse = getUser(lead.assignedToFSE);
                  const noteCount = getLeadNotes(lead.id).length;
                  const leadFollowUps = getLeadFollowUps(lead.id);
                  const latestFollowUp =
                    leadFollowUps.length > 0
                      ? leadFollowUps.reduce((latest, f) =>
                          new Date(f.scheduledAt) > new Date(latest.scheduledAt)
                            ? f
                            : latest,
                        )
                      : null;
                  const isSelected = hodSelectedIds.has(lead.id);

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      data-ocid={`hod.lead.item.${idx + 1}`}
                    >
                      <Card
                        className={`bg-card border-border shadow-card hover:border-border/70 transition-all flex flex-col ${isSelected ? "ring-1 ring-primary/40 border-primary/30" : ""}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="font-display text-sm font-semibold text-foreground truncate">
                                {lead.name}
                              </CardTitle>
                              {lead.monthlyBill && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  ₹{lead.monthlyBill}/mo
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {stage && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    borderColor: `${stage.color}40`,
                                    color: stage.color,
                                    backgroundColor: `${stage.color}18`,
                                  }}
                                >
                                  {stage.name}
                                </Badge>
                              )}
                              {/* Card checkbox */}
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(lead.id)}
                                aria-label={`Select lead ${lead.name}`}
                                data-ocid={`hod.lead.checkbox.${idx + 1}`}
                                className="border-border"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0 flex-1 flex flex-col">
                          {lead.mobileNo && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.mobileNo}</span>
                            </div>
                          )}
                          {(lead.city || lead.state) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {[lead.city, lead.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                          {/* Assigned FSE */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                            {fse ? (
                              <span className="text-emerald-400 font-medium">
                                {fse.name}
                              </span>
                            ) : (
                              <span className="text-amber-400">
                                Not assigned to FSE
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-1 flex-1 items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssignFSELeadId(lead.id);
                                setAssignFSEId(lead.assignedToFSE ?? "");
                              }}
                              data-ocid={`hod.lead.assign_button.${idx + 1}`}
                              className="h-7 text-xs flex-1 border-border hover:bg-secondary"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              {fse ? "Reassign FSE" : "Assign FSE"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                              data-ocid={`hod.lead.detail_button.${idx + 1}`}
                              className="h-7 text-xs flex-1 border-border hover:bg-secondary"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>

                          {/* Card footer: note count + latest follow-up */}
                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              {noteCount} note{noteCount !== 1 ? "s" : ""}
                            </span>
                            {latestFollowUp ? (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(latestFollowUp.scheduledAt)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/50">
                                No follow-ups
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── FSE Activity Tab ── */}
        <TabsContent value="fse-activity">
          {activityFeed.length === 0 ? (
            <div
              data-ocid="hod.activity.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No FSE activity yet</p>
              <p className="text-xs mt-1">
                Notes and follow-ups from your FSEs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityFeed.map((item, idx) => {
                const lead = getLead(item.leadId);
                const authorId =
                  item.kind === "note" ? item.authorId : item.assignedTo;
                const author = getUser(authorId);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    data-ocid={`hod.activity.item.${idx + 1}`}
                    className="flex gap-3 p-4 rounded-xl bg-card border border-border hover:border-border/70 transition-all"
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.kind === "note"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {item.kind === "note" ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {author?.name ?? "Unknown User"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.kind === "note"
                              ? "added a note"
                              : "scheduled follow-up"}
                          </span>
                          {lead && (
                            <>
                              <span className="text-[10px] text-muted-foreground">
                                on
                              </span>
                              <span className="text-xs font-medium text-primary truncate max-w-[140px]">
                                {lead.name}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {item.kind === "note"
                          ? item.text
                          : item.description || "—"}
                      </p>

                      {item.kind === "followup" && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Scheduled: {formatDateTime(item.scheduledAt)}
                          </span>
                          {item.completed && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Author role badge */}
                      {author && (
                        <div className="mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 border-border text-muted-foreground"
                          >
                            {author.role}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
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
                    {hodPending}
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
                    {hodCompleted}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {hodFollowUps.length === 0 ? (
            <div
              data-ocid="hod.followups.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No follow-ups scheduled</p>
              <p className="text-xs mt-1">
                Follow-ups added by FSEs for your leads will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6" data-ocid="hod.followups.list">
              {GROUP_ORDER.filter((g) => hodGrouped[g]?.length).map(
                (groupLabel) => {
                  const items = hodGrouped[groupLabel] ?? [];
                  let globalIndex = 0;
                  for (const g of GROUP_ORDER) {
                    if (g === groupLabel) break;
                    globalIndex += hodGrouped[g]?.length ?? 0;
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
                            return (
                              <motion.div
                                key={f.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: itemIndex * 0.04 }}
                                data-ocid={`hod.followup.item.${itemIndex + 1}`}
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
                                  data-ocid={`hod.followup.checkbox.${itemIndex + 1}`}
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
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(f.scheduledAt)}
                                    </span>
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
                                    data-ocid={`hod.followup.complete_button.${itemIndex + 1}`}
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
          <div className="flex items-center gap-3 mb-5">
            <label
              htmlFor="hod-report-date"
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Select Date:
            </label>
            <Input
              id="hod-report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-secondary border-border max-w-[180px]"
              data-ocid="hod.dayreports.date_input"
            />
            <span className="text-xs text-muted-foreground">
              {new Date(`${reportDate}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {hodFseUsers.length === 0 ? (
            <div
              data-ocid="hod.dayreports.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                No FSEs assigned to your leads
              </p>
              <p className="text-xs mt-1">
                Assign FSEs to your leads to see their day reports
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <Table data-ocid="hod.dayreports.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium pl-4">
                      FSE Name
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
                  {hodFseUsers.map((user, idx) => {
                    const log = hodReportLogs.find((l) => l.userId === user.id);
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
                        data-ocid={`hod.dayreports.row.${idx + 1}`}
                        className="border-border hover:bg-secondary/20 transition-colors"
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-emerald-400">
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
      </Tabs>

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddSubmit}
        stages={stages}
        title="Add New Lead"
        submitLabel="Add Lead"
      />

      {/* Upload CSV Dialog */}
      <LeadUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={handleImport}
      />

      {/* Assign FSE Dialog */}
      <Dialog
        open={!!assignFSELeadId}
        onOpenChange={(o) => !o && setAssignFSELeadId(null)}
      >
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="hod.assign.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Assign to FSE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="text-sm text-muted-foreground block mb-1.5">
              Select FSE
            </Label>
            <Select value={assignFSEId} onValueChange={setAssignFSEId}>
              <SelectTrigger
                className="bg-secondary border-border"
                data-ocid="hod.assign.fse.select"
              >
                <SelectValue placeholder="Select an FSE..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="">Unassign</SelectItem>
                {fses.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAssignFSELeadId(null)}
              data-ocid="hod.assign.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignFSE}
              className="bg-primary text-primary-foreground"
              data-ocid="hod.assign.confirm_button"
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={(o) => !o && setSelectedLead(null)}
      >
        <DialogContent
          className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto"
          data-ocid="hod.lead.detail.modal"
        >
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-lg">
                  {selectedLead.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Lead info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {selectedLead.mobileNo || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {[selectedLead.city, selectedLead.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                  {selectedLead.address && (
                    <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{selectedLead.address}</span>
                    </div>
                  )}
                  {selectedLead.monthlyBill && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs font-medium text-foreground">
                        Monthly Bill:
                      </span>
                      <span>₹{selectedLead.monthlyBill}</span>
                    </div>
                  )}
                  {selectedLead.appointedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDateTime(selectedLead.appointedAt)}</span>
                    </div>
                  )}
                  {/* Assigned FSE — shown prominently in detail view */}
                  <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Assigned FSE:
                    </span>
                    {getUser(selectedLead.assignedToFSE) ? (
                      <span className="text-sm font-semibold text-emerald-400">
                        {getUser(selectedLead.assignedToFSE)?.name}
                      </span>
                    ) : (
                      <span className="text-sm text-amber-400">
                        Not assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* FVR Attachments */}
                {selectedLeadFVRs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Visit Reports ({selectedLeadFVRs.length})
                    </p>
                    <div className="space-y-2">
                      {selectedLeadFVRs.map((fvr, i) => {
                        const visitDate = new Date(fvr.submittedAt);
                        const filename = `FVR ${formatDateForFilename(visitDate)}.pdf`;
                        return (
                          <div
                            key={fvr.id}
                            className="flex items-center justify-between p-2.5 rounded-md bg-emerald-500/8 border border-emerald-500/20 text-xs"
                            data-ocid={`hod.lead.fvr.item.${i + 1}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {filename}
                                </p>
                                <p className="text-muted-foreground">
                                  {formatDateTime(fvr.submittedAt)} ·{" "}
                                  {fvr.fseName}
                                  {fvr.location && (
                                    <span className="ml-1 text-emerald-400">
                                      ·{" "}
                                      <MapPin className="w-2.5 h-2.5 inline" />{" "}
                                      GPS
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0 ml-2"
                              onClick={() => generateFVRPdf(fvr)}
                              data-ocid={`hod.lead.fvr.download_button.${i + 1}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Follow-ups summary */}
                {selectedLeadFollowUps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Follow-ups
                    </p>
                    <div className="space-y-1.5">
                      {selectedLeadFollowUps.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 text-xs"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${f.completed ? "bg-emerald-400" : "bg-amber-400"}`}
                          />
                          <span className="text-muted-foreground">
                            {new Date(f.scheduledAt).toLocaleString()}
                          </span>
                          <span className="text-foreground flex-1">
                            {f.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Activity Notes ({selectedLeadNotes.length})
                  </p>

                  {/* Add note */}
                  <div className="mb-3">
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      className="bg-secondary border-border resize-none mb-2 min-h-[70px] text-sm"
                      data-ocid="hod.note.textarea"
                    />
                    <Button
                      size="sm"
                      disabled={!noteText.trim()}
                      onClick={handleAddNote}
                      className="bg-primary text-primary-foreground"
                      data-ocid="hod.note.submit_button"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Add Note
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedLeadNotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No notes yet
                      </p>
                    ) : (
                      selectedLeadNotes.map((note) => {
                        const author = getUser(note.authorId);
                        return (
                          <div
                            key={note.id}
                            className="p-3 rounded-lg bg-secondary/50 border border-border/50"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-muted-foreground">
                                {author?.name ?? "Unknown"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">
                              {note.text}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedLead(null)}
                  data-ocid="hod.lead.detail.close_button"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
