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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckSquare,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Send,
  ShoppingCart,
  TrendingUp,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AddLeadDialog,
  type LeadFormInput,
} from "../../components/AddLeadDialog";
import { DayTracker } from "../../components/DayTracker";
import {
  FirstVisitReportDialog,
  generateFVRPdf,
} from "../../components/FirstVisitReportDialog";
import { LeadUploadDialog } from "../../components/LeadUploadDialog";
import { OrderIdRequestDialog } from "../../components/OrderIdRequestDialog";
import {
  SaleOrderDialog,
  generateSaleOrderPdf,
} from "../../components/SaleOrderDialog";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { LEAD_SOURCES, type Lead, SOURCE_COLORS } from "../../types/lms";

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

interface FollowUpFormData {
  scheduledDate: string;
  scheduledTime: string;
  description: string;
}

const defaultFollowUpForm: FollowUpFormData = {
  scheduledDate: "",
  scheduledTime: "",
  description: "",
};

export function FSEDashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    getLeadNotes,
    addNote,
    updateLead,
    addFollowUp,
    addLead,
    getLeadFollowUps,
    addFVR,
    getLeadFVRs,
    addSaleOrder,
    getLeadSaleOrders,
    addOrderIdRequest,
    getLeadOrderIdRequests,
  } = useLMS();

  // FSE role restriction: only show leads explicitly assigned to this FSE user.
  const myLeads = useMemo(() => {
    return leads.filter((l) => l.assignedToFSE === currentUser?.id);
  }, [leads, currentUser]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    mobileNo: string;
    address: string;
    monthlyBill: string;
    state: string;
    city: string;
    appointedAt: string;
    stageId: string;
    source: string;
  }>({
    mobileNo: "",
    address: "",
    monthlyBill: "",
    state: "",
    city: "",
    appointedAt: "",
    stageId: "",
    source: "",
  });

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpForm, setFollowUpForm] =
    useState<FollowUpFormData>(defaultFollowUpForm);

  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // FVR state
  const [fvrOpen, setFvrOpen] = useState(false);
  const [fvrLead, setFvrLead] = useState<Lead | null>(null);

  // Sale Order state
  const [saleOrderOpen, setSaleOrderOpen] = useState(false);
  const [saleOrderLead, setSaleOrderLead] = useState<Lead | null>(null);

  // Order ID Request state
  const [orderIdOpen, setOrderIdOpen] = useState(false);
  const [orderIdLead, setOrderIdLead] = useState<Lead | null>(null);

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);
  const getUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : null;

  const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : [];
  const selectedLeadFollowUps = selectedLead
    ? getLeadFollowUps(selectedLead.id)
    : [];
  const selectedLeadFVRs = selectedLead ? getLeadFVRs(selectedLead.id) : [];
  const selectedLeadSaleOrders = selectedLead
    ? getLeadSaleOrders(selectedLead.id)
    : [];
  const selectedLeadOrderIdRequests = selectedLead
    ? getLeadOrderIdRequests(selectedLead.id)
    : [];

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setEditMode(false);
    setEditForm({
      mobileNo: lead.mobileNo ?? "",
      address: lead.address ?? "",
      monthlyBill: lead.monthlyBill ?? "",
      state: lead.state ?? "",
      city: lead.city ?? "",
      appointedAt: lead.appointedAt ?? "",
      stageId: lead.stageId,
      source: lead.source,
    });
    setNoteText("");
  };

  const handleSaveEdit = () => {
    if (!selectedLead) return;
    updateLead(selectedLead.id, {
      mobileNo: editForm.mobileNo,
      address: editForm.address,
      monthlyBill: editForm.monthlyBill,
      state: editForm.state,
      city: editForm.city,
      appointedAt: editForm.appointedAt,
      stageId: editForm.stageId,
      source: editForm.source,
    });
    setSelectedLead((prev) => (prev ? { ...prev, ...editForm } : null));
    setEditMode(false);
    toast.success("Lead updated");
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
      assignedToFSE: currentUser?.id ?? null,
      createdBy: currentUser?.id ?? "",
      uploadedBy: null,
    });
    toast.success("Lead added and assigned to you");
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
        assignedToFSE: currentUser?.id ?? null,
        createdBy: currentUser?.id ?? "",
        uploadedBy: currentUser?.id ?? null,
      });
      count++;
    }
    if (count > 0) {
      toast.success(`Imported ${count} lead${count !== 1 ? "s" : ""}`);
    }
  };

  const handleAddNote = (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedLead) return;
    addNote(selectedLead.id, noteText.trim(), currentUser?.id ?? "");
    setNoteText("");
    toast.success("Note added");
  };

  const handleAddFollowUp = (e: FormEvent) => {
    e.preventDefault();
    if (
      !followUpForm.scheduledDate ||
      !followUpForm.scheduledTime ||
      !selectedLead
    )
      return;
    const scheduledAt = new Date(
      `${followUpForm.scheduledDate}T${followUpForm.scheduledTime}`,
    ).toISOString();
    addFollowUp({
      leadId: selectedLead.id,
      assignedTo: currentUser?.id ?? "",
      scheduledAt,
      description: followUpForm.description,
      completed: false,
    });
    toast.success("Follow-up scheduled");
    setFollowUpForm(defaultFollowUpForm);
    setFollowUpOpen(false);
  };

  const openFVR = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFvrLead(lead);
    setFvrOpen(true);
  };

  const openSaleOrder = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSaleOrderLead(lead);
    setSaleOrderOpen(true);
  };

  const openOrderId = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOrderIdLead(lead);
    setOrderIdOpen(true);
  };

  // Find or create "Order Confirmed" stage id
  const orderConfirmedStage = stages.find(
    (s) => s.name.toLowerCase() === "order confirmed",
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Day Tracker Banner */}
      {currentUser && (
        <DayTracker userId={currentUser.id} role={currentUser.role} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome, {currentUser?.name} — {myLeads.length} lead
            {myLeads.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="border-border bg-secondary hover:bg-secondary/70 gap-1.5"
            data-ocid="fse.upload_button"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-ocid="fse.add_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {myLeads.length === 0 ? (
        <div
          data-ocid="fse.leads.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No leads assigned to you yet</p>
          <p className="text-xs mt-1">
            Contact your HOD to get leads assigned, or add one yourself
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myLeads.map((lead, idx) => {
            const stage = getStage(lead.stageId);
            const noteCount = getLeadNotes(lead.id).length;
            const followUpCount = getLeadFollowUps(lead.id).length;
            const fvrCount = getLeadFVRs(lead.id).length;
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-ocid={`fse.lead.item.${idx + 1}`}
              >
                <Card
                  className="bg-card border-border shadow-card hover:border-border/70 transition-all cursor-pointer"
                  onClick={() => openLeadDetail(lead)}
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
                      <Select
                        value={lead.stageId}
                        onValueChange={(newStageId) => {
                          updateLead(lead.id, { stageId: newStageId });
                          toast.success("Stage updated");
                        }}
                      >
                        <SelectTrigger
                          className="h-7 text-xs shrink-0 w-auto min-w-[90px] max-w-[130px] border px-2"
                          style={
                            stage
                              ? {
                                  borderColor: `${stage.color}40`,
                                  color: stage.color,
                                  backgroundColor: `${stage.color}18`,
                                }
                              : {}
                          }
                          onClick={(e) => e.stopPropagation()}
                          data-ocid={`fse.lead.stage_select.${idx + 1}`}
                        >
                          <SelectValue placeholder="Stage" />
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
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1.5">
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
                    <div className="flex items-center gap-3 pt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" /> {noteCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {followUpCount}{" "}
                        follow-up{followUpCount !== 1 ? "s" : ""}
                      </span>
                      {fvrCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <FileText className="w-3 h-3" /> {fvrCount} FVR
                        </span>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="pt-2 space-y-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFVR(lead);
                        }}
                        data-ocid={`fse.lead.fvr_button.${idx + 1}`}
                      >
                        <FileText className="w-3 h-3 mr-1.5" />
                        1st Visit Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-green-500/40 text-green-400 hover:bg-green-500/10 hover:border-green-500/60 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSaleOrder(lead);
                        }}
                        data-ocid={`fse.lead.sale_order_button.${idx + 1}`}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1.5" />
                        Sale Order
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderId(lead);
                        }}
                        data-ocid={`fse.lead.order_id_button.${idx + 1}`}
                      >
                        <CheckSquare className="w-3 h-3 mr-1.5" />
                        Request Order ID
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
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

      {/* First Visit Report Dialog */}
      {fvrLead && currentUser && (
        <FirstVisitReportDialog
          open={fvrOpen}
          onOpenChange={setFvrOpen}
          lead={fvrLead}
          fse={currentUser}
          onSubmit={(data) => {
            addFVR(data);
          }}
        />
      )}

      {/* Sale Order Dialog */}
      {saleOrderLead && currentUser && (
        <SaleOrderDialog
          open={saleOrderOpen}
          onOpenChange={setSaleOrderOpen}
          lead={saleOrderLead}
          submittedBy={currentUser}
          onSubmit={(data) => {
            addSaleOrder(data);
            // Auto-change stage to "Order Confirmed"
            if (orderConfirmedStage) {
              updateLead(saleOrderLead.id, {
                stageId: orderConfirmedStage.id,
              });
              if (selectedLead?.id === saleOrderLead.id) {
                setSelectedLead((prev) =>
                  prev ? { ...prev, stageId: orderConfirmedStage.id } : null,
                );
              }
            }
          }}
        />
      )}

      {/* Order ID Request Dialog */}
      {orderIdLead && currentUser && (
        <OrderIdRequestDialog
          open={orderIdOpen}
          onOpenChange={setOrderIdOpen}
          lead={orderIdLead}
          submittedBy={currentUser}
          onSubmit={(data) => {
            addOrderIdRequest(data);
          }}
        />
      )}

      {/* Lead Detail Dialog */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={(o) => !o && setSelectedLead(null)}
      >
        <DialogContent
          className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto"
          data-ocid="lead.detail.modal"
        >
          {selectedLead &&
            (() => {
              const stage = getStage(selectedLead.stageId);
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-2">
                      <DialogTitle className="font-display text-lg">
                        {selectedLead.name}
                      </DialogTitle>
                      {stage && (
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                          style={{
                            borderColor: `${stage.color}40`,
                            color: stage.color,
                            backgroundColor: `${stage.color}18`,
                          }}
                        >
                          {stage.name}
                        </Badge>
                      )}
                    </div>
                  </DialogHeader>

                  <div className="space-y-5">
                    {/* Contact Info / Edit Mode */}
                    {editMode ? (
                      <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Editing Lead
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Mobile No
                            </Label>
                            <Input
                              value={editForm.mobileNo}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  mobileNo: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.mobileno.input"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Monthly Bill
                            </Label>
                            <Input
                              value={editForm.monthlyBill}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  monthlyBill: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.monthlybill.input"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Address
                            </Label>
                            <Input
                              value={editForm.address}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  address: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.address.input"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              State
                            </Label>
                            <Input
                              value={editForm.state}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  state: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.state.input"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              City
                            </Label>
                            <Input
                              value={editForm.city}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  city: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.city.input"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">
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
                              className="bg-secondary border-border h-8 text-sm"
                              data-ocid="lead.edit.appointedat.input"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Source
                            </Label>
                            <Select
                              value={editForm.source}
                              onValueChange={(v) =>
                                setEditForm((p) => ({ ...p, source: v }))
                              }
                            >
                              <SelectTrigger className="bg-secondary border-border h-8 text-sm">
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
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Stage
                            </Label>
                            <Select
                              value={editForm.stageId}
                              onValueChange={(v) =>
                                setEditForm((p) => ({ ...p, stageId: v }))
                              }
                            >
                              <SelectTrigger className="bg-secondary border-border h-8 text-sm">
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
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-primary text-primary-foreground"
                            data-ocid="lead.detail.save_button"
                          >
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditMode(false)}
                            data-ocid="lead.detail.cancel_button"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedLead.mobileNo && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{selectedLead.mobileNo}</span>
                          </div>
                        )}
                        {(selectedLead.city || selectedLead.state) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">
                              {[selectedLead.city, selectedLead.state]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {selectedLead.address && (
                          <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
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
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {formatDateTime(selectedLead.appointedAt)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_COLORS[selectedLead.source] ?? ""}`}
                          >
                            {selectedLead.source}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!editMode && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditMode(true)}
                          className="border-border hover:bg-secondary"
                          data-ocid="lead.detail.edit_button"
                        >
                          Edit Lead Info
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFollowUpOpen(true)}
                          className="border-border hover:bg-secondary"
                          data-ocid="lead.followup.open_modal_button"
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          Add Follow-up
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFVR(selectedLead)}
                          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                          data-ocid="lead.detail.fvr.open_modal_button"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          1st Visit Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSaleOrder(selectedLead)}
                          className="border-green-500/40 text-green-400 hover:bg-green-500/10 hover:border-green-500/60"
                          data-ocid="lead.detail.sale_order.open_modal_button"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                          Sale Order
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOrderId(selectedLead)}
                          className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60"
                          data-ocid="lead.detail.order_id.open_modal_button"
                        >
                          <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                          Request Order ID
                        </Button>
                      </div>
                    )}

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
                                data-ocid={`lead.fvr.item.${i + 1}`}
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
                                  data-ocid={`lead.fvr.download_button.${i + 1}`}
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

                    {/* Sale Order Attachments */}
                    {selectedLeadSaleOrders.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Sale Orders ({selectedLeadSaleOrders.length})
                        </p>
                        <div className="space-y-2">
                          {selectedLeadSaleOrders.map((order, i) => {
                            const orderDate = new Date(order.submittedAt);
                            const filename = `Sale Order ${formatDateForFilename(orderDate)}.pdf`;
                            return (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-2.5 rounded-md bg-green-500/8 border border-green-500/20 text-xs"
                                data-ocid={`lead.sale_order.item.${i + 1}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <ShoppingCart className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                      {filename}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {formatDateTime(order.submittedAt)} ·{" "}
                                      {order.submittedByName}
                                      {order.location && (
                                        <span className="ml-1 text-green-400">
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
                                  className="h-6 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 shrink-0 ml-2"
                                  onClick={() => generateSaleOrderPdf(order)}
                                  data-ocid={`lead.sale_order.download_button.${i + 1}`}
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

                    {/* Order ID Requests */}
                    {selectedLeadOrderIdRequests.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Order ID Requests (
                          {selectedLeadOrderIdRequests.length})
                        </p>
                        <div className="space-y-2">
                          {selectedLeadOrderIdRequests.map((req, i) => {
                            const checkedCount = [
                              req.lightBill,
                              req.panCard,
                              req.cancelledCheque,
                              req.aadharCard,
                              req.allDocsGiven,
                              req.loanApproved,
                              req.nameOnLightBill,
                              req.sanctionLoad,
                              req.noc,
                            ].filter(Boolean).length;
                            return (
                              <div
                                key={req.id}
                                className="p-2.5 rounded-md bg-blue-500/8 border border-blue-500/20 text-xs"
                                data-ocid={`lead.order_id_request.item.${i + 1}`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    {checkedCount}/9 documents
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                      req.status === "approved"
                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                        : req.status === "rejected"
                                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                          : req.allChecked
                                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                            : "bg-secondary text-muted-foreground border-border"
                                    }`}
                                  >
                                    {req.status === "approved"
                                      ? "Approved"
                                      : req.status === "rejected"
                                        ? "Rejected"
                                        : req.allChecked
                                          ? "Pending Approval"
                                          : "Incomplete"}
                                  </span>
                                </div>
                                <p className="text-muted-foreground">
                                  {formatDateTime(req.submittedAt)} ·{" "}
                                  {req.submittedByName}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {selectedLeadFollowUps.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Scheduled Follow-ups
                        </p>
                        <div className="space-y-1.5">
                          {selectedLeadFollowUps.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-start gap-2 p-2.5 rounded-md bg-secondary/40 text-xs"
                            >
                              <span
                                className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${f.completed ? "bg-emerald-400" : "bg-amber-400"}`}
                              />
                              <div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(f.scheduledAt).toLocaleString()}
                                </p>
                                <p className="text-foreground mt-0.5">
                                  {f.description}
                                </p>
                              </div>
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
                      <form onSubmit={handleAddNote} className="mb-3">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a visit/call note..."
                          className="bg-secondary border-border resize-none mb-2 min-h-[70px] text-sm"
                          data-ocid="lead.note.textarea"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!noteText.trim()}
                          className="bg-primary text-primary-foreground"
                          data-ocid="lead.note.submit_button"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Add Note
                        </Button>
                      </form>

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
                      data-ocid="lead.detail.close_button"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Add Follow-up Dialog */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="followup.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              <Plus className="w-4 h-4 inline mr-2" />
              Schedule Follow-up
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFollowUp} className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={followUpForm.scheduledDate}
                onChange={(e) =>
                  setFollowUpForm((p) => ({
                    ...p,
                    scheduledDate: e.target.value,
                  }))
                }
                required
                className="bg-secondary border-border"
                data-ocid="followup.date_input"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={followUpForm.scheduledTime}
                onChange={(e) =>
                  setFollowUpForm((p) => ({
                    ...p,
                    scheduledTime: e.target.value,
                  }))
                }
                required
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Description
              </Label>
              <Textarea
                value={followUpForm.description}
                onChange={(e) =>
                  setFollowUpForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="What is this follow-up about?"
                className="bg-secondary border-border resize-none"
                rows={3}
                data-ocid="followup.description_input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFollowUpOpen(false)}
                data-ocid="followup.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                data-ocid="followup.submit_button"
              >
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
