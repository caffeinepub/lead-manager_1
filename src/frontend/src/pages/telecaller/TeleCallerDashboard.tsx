import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  PhoneCall,
  Plus,
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
import { DayTracker } from "../../components/DayTracker";
import { LeadUploadDialog } from "../../components/LeadUploadDialog";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";

export function TeleCallerDashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    addLead,
    updateLead,
    assignLeadToHOD,
    assignLeadToFSE,
  } = useLMS();

  // TeleCaller sees leads they created or uploaded
  const myLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        l.createdBy === currentUser?.id || l.uploadedBy === currentUser?.id,
    );
  }, [leads, currentUser]);

  const hods = users.filter((u) => u.role === "HOD");

  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Assign dialog state
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignHodId, setAssignHodId] = useState<string>("");
  const [assignFseId, setAssignFseId] = useState<string>("");

  const fsesForHod = useMemo(
    () => users.filter((u) => u.role === "FSE"),
    [users],
  );

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);
  const getUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : null;

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
      uploadedBy: currentUser?.id ?? null,
    });
    toast.success("Lead added successfully");
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
    setAssignHodId("");
    setAssignFseId("");
  };

  const stats = useMemo(
    () => ({
      total: myLeads.length,
      assigned: myLeads.filter((l) => l.assignedToFSE).length,
      unassigned: myLeads.filter((l) => !l.assignedToFSE).length,
    }),
    [myLeads],
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Day Tracker Banner */}
      {currentUser && (
        <DayTracker userId={currentUser.id} role={currentUser.role} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-orange-400" />
            My Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome, {currentUser?.name} — leads you've created or uploaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/telecaller/upload">
            <Button
              variant="outline"
              className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
              data-ocid="tc.upload_button"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
            data-ocid="tc.upload_inline_button"
          >
            <Upload className="w-4 h-4" />
            Quick Upload
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-ocid="tc.add_button"
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
            color: "text-orange-400",
            bg: "bg-orange-400/10",
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

      {/* Leads list */}
      {myLeads.length === 0 ? (
        <div
          data-ocid="tc.leads.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No leads yet</p>
          <p className="text-xs mt-1">
            Add a lead manually or upload a CSV file
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myLeads.map((lead, idx) => {
            const stage = getStage(lead.stageId);
            const fse = getUser(lead.assignedToFSE);
            const hod = getUser(lead.assignedToHOD);

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                data-ocid={`tc.lead.item.${idx + 1}`}
              >
                <Card className="bg-card border-border shadow-card hover:border-border/70 transition-all flex flex-col">
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
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0 flex-1 flex flex-col">
                    {lead.mobileNo && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{lead.mobileNo}</span>
                      </div>
                    )}
                    {(lead.city || lead.state) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {[lead.city, lead.state].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Inline stage dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">
                        Stage:
                      </span>
                      <Select
                        value={lead.stageId}
                        onValueChange={(v) => handleStageChange(lead.id, v)}
                      >
                        <SelectTrigger
                          className="h-6 text-xs bg-secondary border-border flex-1"
                          data-ocid={`tc.lead.stage.select.${idx + 1}`}
                        >
                          <SelectValue />
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

                    {/* Assigned info */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {hod ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-blue-500/30 text-blue-300 bg-blue-500/10"
                        >
                          HOD: {hod.name}
                        </Badge>
                      ) : null}
                      {fse ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                        >
                          FSE: {fse.name}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-amber-400">
                          Not assigned
                        </span>
                      )}
                    </div>

                    {/* Stage badge */}
                    {stage && (
                      <div className="mt-auto pt-1">
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
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssign(lead.id)}
                      data-ocid={`tc.lead.assign_button.${idx + 1}`}
                      className="h-7 text-xs border-border hover:bg-secondary w-full mt-1"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      {fse ? "Reassign" : "Assign to FSE"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
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

      {/* Assign to FSE Dialog */}
      <Dialog
        open={!!assignLeadId}
        onOpenChange={(o) => !o && setAssignLeadId(null)}
      >
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="tc.assign.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Assign Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Select HOD
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
                  data-ocid="tc.assign.hod.select"
                >
                  <SelectValue placeholder="Select a HOD..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="">— No HOD —</SelectItem>
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
                Select FSE
              </Label>
              <Select value={assignFseId} onValueChange={setAssignFseId}>
                <SelectTrigger
                  className="bg-secondary border-border"
                  data-ocid="tc.assign.fse.select"
                >
                  <SelectValue placeholder="Select an FSE..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="">— No FSE —</SelectItem>
                  {fsesForHod.map((f) => (
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
              data-ocid="tc.assign.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="bg-primary text-primary-foreground"
              data-ocid="tc.assign.confirm_button"
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
