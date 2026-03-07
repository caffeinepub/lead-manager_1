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
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { LEAD_SOURCES, type Lead, SOURCE_COLORS } from "../../types/lms";
import { exportLeadsToCSV } from "../../utils/exportLeads";

interface LeadFormData {
  title: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  stageId: string;
}

const defaultLeadForm: LeadFormData = {
  title: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Web",
  stageId: "",
};

export function AdminLeads() {
  const { currentUser } = useAuth();
  const {
    leads,
    addLead,
    updateLead,
    deleteLead,
    assignLeadToHOD,
    stages,
    users,
  } = useLMS();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLead_, setDeleteLead_] = useState<string | null>(null);
  const [form, setForm] = useState<LeadFormData>({ ...defaultLeadForm });
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignHodId, setAssignHodId] = useState<string>("");

  // Selection state for download
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hods = users.filter((u) => u.role === "HOD");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q),
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

  const openAdd = () => {
    setForm({ ...defaultLeadForm, stageId: stages[0]?.id ?? "" });
    setEditLead(null);
    setAddOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setForm({
      title: lead.title,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      stageId: lead.stageId,
    });
    setEditLead(lead);
    setAddOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.name.trim()) return;
    if (editLead) {
      updateLead(editLead.id, {
        title: form.title.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        source: form.source,
        stageId: form.stageId,
      });
      toast.success("Lead updated");
    } else {
      addLead({
        title: form.title.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        source: form.source,
        stageId: form.stageId,
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: currentUser?.id ?? "",
      });
      toast.success("Lead added");
    }
    setAddOpen(false);
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
            onClick={openAdd}
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
          placeholder="Search by title, name, company..."
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
                Company
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
                        aria-label={`Select lead ${lead.title}`}
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
                            {lead.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {lead.company}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteLead_(lead.id)}
                          data-ocid={`leads.delete_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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

      {/* Add/Edit Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="leads.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editLead ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label
                  htmlFor="lead-title"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Lead Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lead-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Enterprise Software Deal"
                  required
                  className="bg-secondary border-border"
                  data-ocid="leads.title.input"
                />
              </div>
              <div className="col-span-2">
                <Label
                  htmlFor="contact-name"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Contact Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                  className="bg-secondary border-border"
                  data-ocid="leads.name.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="lead-email"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Email
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@company.com"
                  className="bg-secondary border-border"
                  data-ocid="leads.email.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="lead-phone"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Phone
                </Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="col-span-2">
                <Label
                  htmlFor="lead-company"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Company
                </Label>
                <Input
                  id="lead-company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, company: e.target.value }))
                  }
                  placeholder="Company name"
                  className="bg-secondary border-border"
                  data-ocid="leads.company.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Source
                </Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="leads.source.select"
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
                  value={form.stageId}
                  onValueChange={(v) => setForm((p) => ({ ...p, stageId: v }))}
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="leads.stage.select"
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
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddOpen(false)}
                data-ocid="leads.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                data-ocid="leads.submit_button"
              >
                {editLead ? "Save Changes" : "Add Lead"}
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

      {/* Delete confirmation */}
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
    </div>
  );
}
