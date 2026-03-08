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
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCheck,
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
import { SOURCE_COLORS } from "../../types/lms";
import { exportLeadsToCSV } from "../../utils/exportLeads";

export function THODDashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    updateLead,
    assignLeadToHOD,
    assignLeadToFSE,
    addLead,
  } = useLMS();

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
            All Leads
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
                            {[lead.city, lead.state].filter(Boolean).join(", ")}
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
            {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""} selected
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
