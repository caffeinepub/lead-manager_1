import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  ChevronDown,
  Download,
  Edit2,
  FileText,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AddLeadDialog,
  type LeadFormInput,
} from "../../components/AddLeadDialog";
import { generateFVRPdf } from "../../components/FirstVisitReportDialog";
import { LeadUploadDialog } from "../../components/LeadUploadDialog";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { LEAD_SOURCES, type Lead, SOURCE_COLORS } from "../../types/lms";
import { exportLeadsToCSV } from "../../utils/exportLeads";

interface LeadFormData {
  name: string;
  mobileNo: string;
  address: string;
  monthlyBill: string;
  state: string;
  city: string;
  appointedAt: string;
  source: string;
  stageId: string;
}

const defaultLeadForm: LeadFormData = {
  name: "",
  mobileNo: "",
  address: "",
  monthlyBill: "",
  state: "",
  city: "",
  appointedAt: "",
  source: "Web",
  stageId: "",
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

function formatDateForFilename(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export function AdminLeads() {
  const { currentUser } = useAuth();
  const {
    leads,
    addLead,
    updateLead,
    deleteLead,
    assignLeadToHOD,
    getLeadFVRs,
    stages,
    users,
  } = useLMS();

  const isArpit = currentUser?.username === "arpit2127";

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteLead_, setDeleteLead_] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LeadFormData>({
    ...defaultLeadForm,
  });
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignHodId, setAssignHodId] = useState<string>("");

  // Selection state for download
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hods = users.filter((u) => u.role === "HOD");

  const editLeadFVRs = editLead ? getLeadFVRs(editLead.id) : [];

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

  // Checkbox selection helpers
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
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

  const openEdit = (lead: Lead) => {
    setEditForm({
      name: lead.name,
      mobileNo: lead.mobileNo ?? "",
      address: lead.address ?? "",
      monthlyBill: lead.monthlyBill ?? "",
      state: lead.state ?? "",
      city: lead.city ?? "",
      appointedAt: lead.appointedAt ?? "",
      source: lead.source,
      stageId: lead.stageId,
    });
    setEditLead(lead);
    setEditOpen(true);
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

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editLead || !editForm.name.trim()) return;
    updateLead(editLead.id, {
      title: editForm.name.trim(),
      name: editForm.name.trim(),
      mobileNo: editForm.mobileNo.trim(),
      address: editForm.address.trim(),
      monthlyBill: editForm.monthlyBill.trim(),
      state: editForm.state.trim(),
      city: editForm.city.trim(),
      appointedAt: editForm.appointedAt,
      source: editForm.source,
      stageId: editForm.stageId,
    });
    toast.success("Lead updated");
    setEditOpen(false);
    setEditLead(null);
  };

  const handleDelete = () => {
    if (!deleteLead_) return;
    deleteLead(deleteLead_);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteLead_);
      return next;
    });
    toast.success("Lead deleted");
    setDeleteLead_(null);
  };

  const handleAssign = () => {
    if (!assignLeadId) return;
    assignLeadToHOD(assignLeadId, assignHodId || null);
    toast.success("Lead assigned to HOD");
    setAssignLeadId(null);
    setAssignHodId("");
  };

  const handleDownloadAll = () => {
    exportLeadsToCSV(filtered, users, stages);
    toast.success(
      `Exported ${filtered.length} lead${filtered.length !== 1 ? "s" : ""} to CSV`,
    );
  };

  const handleDownloadSelected = () => {
    const leadsToExport = filtered.filter((l) => selectedIds.has(l.id));
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
            All Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {leads.length} total leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
                data-ocid="leads.download_button"
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
                data-ocid="leads.download_all.button"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Download All ({filtered.length})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadSelected}
                disabled={!someSelected}
                className="cursor-pointer flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                data-ocid="leads.download_selected.button"
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
            data-ocid="leads.upload_button"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>

          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-ocid="leads.add_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, mobile, city, state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border max-w-sm"
          data-ocid="leads.search_input"
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <Table data-ocid="leads.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all leads"
                  data-ocid="leads.select_all.checkbox"
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
                Assigned HOD
              </TableHead>
              <TableHead className="text-muted-foreground font-medium hidden xl:table-cell">
                Assigned FSE
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
                    data-ocid="leads.empty_state"
                    className="text-muted-foreground flex flex-col items-center gap-2"
                  >
                    <TrendingUp className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-medium">No leads found</p>
                    <p className="text-xs">
                      Add your first lead to get started
                    </p>
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
                    transition={{ delay: idx * 0.03 }}
                    data-ocid={`leads.row.item.${idx + 1}`}
                    className={`border-border hover:bg-secondary/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        aria-label={`Select lead ${lead.name}`}
                        data-ocid={`leads.row.checkbox.${idx + 1}`}
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
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <div className="space-y-0.5">
                        {lead.mobileNo && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3 shrink-0" />
                            {lead.mobileNo}
                          </div>
                        )}
                        {(lead.city || lead.state) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {[lead.city, lead.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {stage && (
                        <Badge
                          variant="outline"
                          className="text-xs font-medium border"
                          style={{
                            borderColor: `${stage.color}40`,
                            color: stage.color,
                            backgroundColor: `${stage.color}18`,
                          }}
                        >
                          {stage.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_COLORS[lead.source] ?? ""}`}
                      >
                        {lead.source}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {hod ? (
                        hod.name
                      ) : (
                        <span className="text-xs text-rose-400/70">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {fse ? (
                        fse.name
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssignLeadId(lead.id);
                            setAssignHodId(lead.assignedToHOD ?? "");
                          }}
                          data-ocid={`leads.assign_button.${idx + 1}`}
                          className="h-7 px-2 text-muted-foreground hover:text-primary text-xs gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Assign</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(lead)}
                          data-ocid={`leads.edit_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {/* Only arpit2127 can delete */}
                        {isArpit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteLead_(lead.id)}
                            data-ocid={`leads.delete_button.${idx + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection summary bar */}
      {someSelected && (
        <div className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <span className="text-primary font-medium">
            {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Add Lead Dialog (shared component) */}
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

      {/* Edit Lead Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="leads.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Edit Lead
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.name.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Mobile No
                </Label>
                <Input
                  value={editForm.mobileNo}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, mobileNo: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.mobileno.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Monthly Bill
                </Label>
                <Input
                  value={editForm.monthlyBill}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, monthlyBill: e.target.value }))
                  }
                  placeholder="e.g. 5000"
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.monthlybill.input"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Address
                </Label>
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Street, area, locality"
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.address.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  State
                </Label>
                <Input
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, state: e.target.value }))
                  }
                  placeholder="e.g. Maharashtra"
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.state.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  City
                </Label>
                <Input
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="e.g. Mumbai"
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.city.input"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Appointed Date &amp; Time
                </Label>
                <Input
                  type="datetime-local"
                  value={
                    editForm.appointedAt
                      ? editForm.appointedAt.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      appointedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    }))
                  }
                  className="bg-secondary border-border"
                  data-ocid="leads.edit.appointedat.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Source
                </Label>
                <Select
                  value={editForm.source}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, source: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="leads.edit.source.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Stage
                </Label>
                <Select
                  value={editForm.stageId}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, stageId: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="leads.edit.stage.select"
                  >
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* FVR Attachments */}
            {editLeadFVRs.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Visit Reports ({editLeadFVRs.length})
                </p>
                <div className="space-y-2">
                  {editLeadFVRs.map((fvr, i) => {
                    const visitDate = new Date(fvr.submittedAt);
                    const filename = `FVR ${formatDateForFilename(visitDate)}.pdf`;
                    return (
                      <div
                        key={fvr.id}
                        className="flex items-center justify-between p-2.5 rounded-md bg-emerald-500/8 border border-emerald-500/20 text-xs"
                        data-ocid={`admin.lead.fvr.item.${i + 1}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {filename}
                            </p>
                            <p className="text-muted-foreground">
                              {formatDateTime(fvr.submittedAt)} · {fvr.fseName}
                              {fvr.location && (
                                <span className="ml-1 text-emerald-400">
                                  · <MapPin className="w-2.5 h-2.5 inline" />{" "}
                                  GPS
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0 ml-2"
                          onClick={() => generateFVRPdf(fvr)}
                          data-ocid={`admin.lead.fvr.download_button.${i + 1}`}
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                data-ocid="leads.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                data-ocid="leads.edit.save_button"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign HOD Dialog */}
      <Dialog
        open={!!assignLeadId}
        onOpenChange={(o) => !o && setAssignLeadId(null)}
      >
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="leads.assign.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Assign to HOD
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="text-sm text-muted-foreground block mb-1.5">
              Select HOD
            </Label>
            <Select value={assignHodId} onValueChange={setAssignHodId}>
              <SelectTrigger
                className="bg-secondary border-border"
                data-ocid="leads.assign.hod.select"
              >
                <SelectValue placeholder="Select a HOD..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="">Unassign</SelectItem>
                {hods.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAssignLeadId(null)}
              data-ocid="leads.assign.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="bg-primary text-primary-foreground"
              data-ocid="leads.assign.confirm_button"
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — only rendered when isArpit */}
      {isArpit && (
        <AlertDialog
          open={!!deleteLead_}
          onOpenChange={(o) => !o && setDeleteLead_(null)}
        >
          <AlertDialogContent
            className="bg-card border-border"
            data-ocid="leads.delete.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure? This will delete the lead and all its notes and
                follow-ups.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-border bg-secondary"
                data-ocid="leads.delete.cancel_button"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
                data-ocid="leads.delete.confirm_button"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
