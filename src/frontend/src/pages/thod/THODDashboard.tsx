import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AddLeadDialog,
  type LeadFormInput,
} from "../../components/AddLeadDialog";
import { LeadUploadDialog } from "../../components/LeadUploadDialog";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS, SOURCE_COLORS } from "../../types/lms";
import { exportLeadsToCSV } from "../../utils/exportLeads";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
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

export function THODDashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    followUps,
    updateLead,
    assignLeadToHOD,
    assignLeadToFSE,
    addLead,
    updateFollowUp,
    getDayLogsForDate,
    getPendingOrderIdRequests,
    updateOrderIdRequest,
  } = useLMS();

  const [activeTab, setActiveTab] = useState("all-leads");

  // Day reports state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(todayStr);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Assign dialog
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignHodId, setAssignHodId] = useState<string>("");
  const [assignFseId, setAssignFseId] = useState<string>("");

  const hods = users.filter((u) => u.role === "HOD");
  const allFses = users.filter((u) => u.role === "FSE");

  // THOD follow-ups: all follow-ups system-wide
  const thodFollowUps = useMemo(() => {
    return [...followUps].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [followUps]);

  const thodPending = thodFollowUps.filter((f) => !f.completed).length;
  const thodCompleted = thodFollowUps.filter((f) => f.completed).length;

  const thodGrouped = useMemo(() => {
    const groups: Record<string, typeof thodFollowUps> = {};
    for (const f of thodFollowUps) {
      const label = getDateLabel(f.scheduledAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(f);
    }
    return groups;
  }, [thodFollowUps]);

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

  // Day reports: all TeleCaller + FSE users system-wide
  const thodReportUsers = useMemo(
    () => users.filter((u) => u.role === "TeleCaller" || u.role === "FSE"),
    [users],
  );

  const thodReportLogs = useMemo(
    () => getDayLogsForDate(reportDate),
    [getDayLogsForDate, reportDate],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.mobileNo ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q) ||
        (l.state ?? "").toLowerCase().includes(q),
    );
  }, [leads, search]);

  const allSelected =
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);
  const getUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : null;

  const handleStageChange = (leadId: string, stageId: string) => {
    updateLead(leadId, { stageId });
    toast.success("Stage updated");
  };

  const openAssign = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    setAssignLeadId(leadId);
    setAssignHodId(lead?.assignedToHOD ?? "");
    setAssignFseId(lead?.assignedToFSE ?? "");
  };

  const handleAssign = () => {
    if (!assignLeadId) return;
    assignLeadToHOD(assignLeadId, assignHodId || null);
    assignLeadToFSE(assignLeadId, assignFseId || null);
    toast.success("Lead assigned successfully");
    setAssignLeadId(null);
  };

  const handleDownloadAll = () => {
    exportLeadsToCSV(filtered, users, stages);
    toast.success(`Exported ${filtered.length} leads to CSV`);
  };

  const handleDownloadSelected = () => {
    const toExport = filtered.filter((l) => selectedIds.has(l.id));
    if (!toExport.length) return;
    exportLeadsToCSV(toExport, users, stages);
    toast.success(`Exported ${toExport.length} selected leads to CSV`);
  };

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
      assignedToHOD: null,
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
        assignedToHOD: null,
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

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            THOD Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Full visibility — {leads.length} total leads in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
                data-ocid="thod.download_button"
              >
                <Download className="w-4 h-4" />
                Download
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border w-52"
            >
              <DropdownMenuItem
                onClick={handleDownloadAll}
                className="cursor-pointer flex items-center gap-2 text-sm"
                data-ocid="thod.download_all.button"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Download All ({filtered.length})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadSelected}
                disabled={!someSelected}
                className="cursor-pointer flex items-center gap-2 text-sm disabled:opacity-40"
                data-ocid="thod.download_selected.button"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Download Selected ({selectedIds.size})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
            data-ocid="thod.upload_button"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>

          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-ocid="thod.add_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="all-leads"
      >
        <TabsList className="mb-5 bg-secondary border border-border">
          <TabsTrigger
            value="all-leads"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="thod.tabs.leads.tab"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            All Leads
            {leads.length > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {leads.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="followups"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="thod.tabs.followups.tab"
          >
            <Calendar className="w-3.5 h-3.5" />
            Follow-ups
            {thodPending > 0 && (
              <span className="ml-1 text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {thodPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="dayreports"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="thod.tabs.dayreports.tab"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Day Reports
          </TabsTrigger>
          <TabsTrigger
            value="pendingapproval"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="thod.tabs.pendingapproval.tab"
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

        {/* ── All Leads Tab ── */}
        <TabsContent value="all-leads">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, city, state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border max-w-sm"
              data-ocid="thod.search_input"
            />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <Table data-ocid="thod.leads.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      data-ocid="thod.select_all.checkbox"
                      className="border-border"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium">
                    Lead
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
                    Mobile / Location
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium">
                    Stage
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
                    Source
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
                    HOD
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden xl:table-cell">
                    FSE
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div
                        data-ocid="thod.leads.empty_state"
                        className="text-muted-foreground flex flex-col items-center gap-2"
                      >
                        <TrendingUp className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No leads found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead, idx) => {
                    const stage = getStage(lead.stageId);
                    const hod = getUser(lead.assignedToHOD);
                    const fse = getUser(lead.assignedToFSE);
                    const isSelected = selectedIds.has(lead.id);

                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        data-ocid={`thod.lead.item.${idx + 1}`}
                        className={`border-border hover:bg-secondary/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                      >
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(lead.id)}
                            data-ocid={`thod.lead.checkbox.${idx + 1}`}
                            className="border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {lead.name.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate max-w-[140px]">
                                {lead.name}
                              </p>
                              {lead.monthlyBill && (
                                <p className="text-xs text-muted-foreground">
                                  ₹{lead.monthlyBill}/mo
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-0.5">
                            {lead.mobileNo && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 shrink-0" />
                                {lead.mobileNo}
                              </div>
                            )}
                            {(lead.city || lead.state) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {[lead.city, lead.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {/* Inline stage dropdown */}
                        <TableCell>
                          <Select
                            value={lead.stageId}
                            onValueChange={(v) => handleStageChange(lead.id, v)}
                          >
                            <SelectTrigger
                              className="h-6 text-xs bg-secondary border-border w-28"
                              data-ocid={`thod.lead.stage.select.${idx + 1}`}
                            >
                              {stage ? (
                                <span
                                  className="flex items-center gap-1.5 text-xs font-medium"
                                  style={{ color: stage.color }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                  />
                                  {stage.name}
                                </span>
                              ) : (
                                <SelectValue placeholder="Stage" />
                              )}
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {stages.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_COLORS[lead.source] ?? ""}`}
                          >
                            {lead.source}
                          </span>
                        </TableCell>
                        {/* Inline HOD dropdown */}
                        <TableCell className="hidden lg:table-cell">
                          <Select
                            value={lead.assignedToHOD ?? ""}
                            onValueChange={(v) => {
                              assignLeadToHOD(lead.id, v || null);
                              toast.success("HOD updated");
                            }}
                          >
                            <SelectTrigger
                              className="h-6 text-xs bg-secondary border-border w-28"
                              data-ocid={`thod.lead.hod.select.${idx + 1}`}
                            >
                              {hod ? (
                                <span className="text-blue-300 truncate">
                                  {hod.name}
                                </span>
                              ) : (
                                <span className="text-rose-400/70 text-xs">
                                  Unassigned
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="">— Unassign —</SelectItem>
                              {hods.map((h) => (
                                <SelectItem key={h.id} value={h.id}>
                                  {h.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {/* Inline FSE dropdown */}
                        <TableCell className="hidden xl:table-cell">
                          <Select
                            value={lead.assignedToFSE ?? ""}
                            onValueChange={(v) => {
                              assignLeadToFSE(lead.id, v || null);
                              toast.success("FSE updated");
                            }}
                          >
                            <SelectTrigger
                              className="h-6 text-xs bg-secondary border-border w-28"
                              data-ocid={`thod.lead.fse.select.${idx + 1}`}
                            >
                              {fse ? (
                                <span className="text-emerald-300 truncate">
                                  {fse.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 text-xs">
                                  —
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="">— Unassign —</SelectItem>
                              {allFses.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssign(lead.id)}
                            data-ocid={`thod.lead.assign_button.${idx + 1}`}
                            className="h-7 px-2 text-muted-foreground hover:text-primary text-xs gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Assign</span>
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {someSelected && (
            <div className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <span className="text-primary font-medium">
                {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                Clear
              </Button>
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
                    {thodPending}
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
                    {thodCompleted}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {thodFollowUps.length === 0 ? (
            <div
              data-ocid="thod.followups.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No follow-ups scheduled</p>
              <p className="text-xs mt-1">
                Follow-ups added by FSEs across all leads will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6" data-ocid="thod.followups.list">
              {GROUP_ORDER.filter((g) => thodGrouped[g]?.length).map(
                (groupLabel) => {
                  const items = thodGrouped[groupLabel] ?? [];
                  let globalIndex = 0;
                  for (const g of GROUP_ORDER) {
                    if (g === groupLabel) break;
                    globalIndex += thodGrouped[g]?.length ?? 0;
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
                                data-ocid={`thod.followup.item.${itemIndex + 1}`}
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
                                  data-ocid={`thod.followup.checkbox.${itemIndex + 1}`}
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
                                    data-ocid={`thod.followup.complete_button.${itemIndex + 1}`}
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
              htmlFor="thod-report-date"
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Select Date:
            </label>
            <Input
              id="thod-report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-secondary border-border max-w-[180px]"
              data-ocid="thod.dayreports.date_input"
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

          {thodReportUsers.length === 0 ? (
            <div
              data-ocid="thod.dayreports.empty_state"
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
              <Table data-ocid="thod.dayreports.table">
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
                  {thodReportUsers.map((user, idx) => {
                    const log = thodReportLogs.find(
                      (l) => l.userId === user.id,
                    );
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
                        data-ocid={`thod.dayreports.row.${idx + 1}`}
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
              data-ocid="thod.pendingapproval.empty_state"
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
            <div className="space-y-3" data-ocid="thod.pendingapproval.list">
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
                    data-ocid={`thod.pendingapproval.item.${i + 1}`}
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

                        <div className="grid grid-cols-3 gap-1.5 mb-4">
                          {ORDER_ID_LABELS.map((field) => (
                            <div
                              key={field.key}
                              className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-emerald-500/8 border border-emerald-500/20 text-emerald-300"
                            >
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {field.key === "lightBill"
                                ? req.lightBill
                                : field.key === "panCard"
                                  ? req.panCard
                                  : field.key === "cancelledCheque"
                                    ? req.cancelledCheque
                                    : field.key === "aadharCard"
                                      ? req.aadharCard
                                      : field.key === "allDocsGiven"
                                        ? req.allDocsGiven
                                        : field.key === "loanApproved"
                                          ? req.loanApproved
                                          : field.key === "nameOnLightBill"
                                            ? req.nameOnLightBill
                                            : field.key === "sanctionLoad"
                                              ? req.sanctionLoad
                                              : req.noc
                                                ? null
                                                : null}
                              {field.label}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            onClick={() => handleApproveOrderId(req.id)}
                            data-ocid={`thod.pendingapproval.approve_button.${i + 1}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex-1"
                            onClick={() => handleRejectOrderId(req.id)}
                            data-ocid={`thod.pendingapproval.reject_button.${i + 1}`}
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

      {/* Assign dialog (mobile-friendly: shows all options) */}
      <Dialog
        open={!!assignLeadId}
        onOpenChange={(o) => !o && setAssignLeadId(null)}
      >
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="thod.assign.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Assign Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Assign to HOD
              </Label>
              <Select
                value={assignHodId}
                onValueChange={(v) => {
                  setAssignHodId(v);
                  setAssignFseId("");
                }}
              >
                <SelectTrigger
                  className="bg-secondary border-border"
                  data-ocid="thod.assign.hod.select"
                >
                  <SelectValue placeholder="Select a HOD..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="">— Unassign HOD —</SelectItem>
                  {hods.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Assign to FSE
              </Label>
              <Select value={assignFseId} onValueChange={setAssignFseId}>
                <SelectTrigger
                  className="bg-secondary border-border"
                  data-ocid="thod.assign.fse.select"
                >
                  <SelectValue placeholder="Select an FSE..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="">— Unassign FSE —</SelectItem>
                  {allFses.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAssignLeadId(null)}
              data-ocid="thod.assign.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="bg-primary text-primary-foreground"
              data-ocid="thod.assign.confirm_button"
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
