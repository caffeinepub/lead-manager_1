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
  Building2,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { LEAD_SOURCES, type Lead, SOURCE_COLORS } from "../../types/lms";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
    getLeadFollowUps,
  } = useLMS();

  // FSE role restriction: only show leads explicitly assigned to this FSE user.
  // This ensures FSEs cannot see leads belonging to other FSEs or unassigned leads.
  const myLeads = useMemo(() => {
    return leads.filter((l) => l.assignedToFSE === currentUser?.id);
  }, [leads, currentUser]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    email: string;
    phone: string;
    company: string;
    stageId: string;
    source: string;
  }>({ email: "", phone: "", company: "", stageId: "", source: "" });

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpForm, setFollowUpForm] =
    useState<FollowUpFormData>(defaultFollowUpForm);

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);
  const getUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : null;

  const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : [];
  const selectedLeadFollowUps = selectedLead
    ? getLeadFollowUps(selectedLead.id)
    : [];

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setEditMode(false);
    setEditForm({
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      stageId: lead.stageId,
      source: lead.source,
    });
    setNoteText("");
  };

  const handleSaveEdit = () => {
    if (!selectedLead) return;
    updateLead(selectedLead.id, {
      email: editForm.email,
      phone: editForm.phone,
      company: editForm.company,
      stageId: editForm.stageId,
      source: editForm.source,
    });
    setSelectedLead((prev) => (prev ? { ...prev, ...editForm } : null));
    setEditMode(false);
    toast.success("Lead updated");
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

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Leads
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome, {currentUser?.name} — {myLeads.length} lead
          {myLeads.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {myLeads.length === 0 ? (
        <div
          data-ocid="fse.leads.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No leads assigned to you yet</p>
          <p className="text-xs mt-1">Contact your HOD to get leads assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myLeads.map((lead, idx) => {
            const stage = getStage(lead.stageId);
            const noteCount = getLeadNotes(lead.id).length;
            const followUpCount = getLeadFollowUps(lead.id).length;
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
                          {lead.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lead.name}
                        </p>
                      </div>
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
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lead.company || "—"}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{lead.phone}</span>
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
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
                        {selectedLead.title}
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
                              Email
                            </Label>
                            <Input
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  email: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Phone
                            </Label>
                            <Input
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  phone: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Company
                            </Label>
                            <Input
                              value={editForm.company}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  company: e.target.value,
                                }))
                              }
                              className="bg-secondary border-border h-8 text-sm"
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
                          <div className="col-span-2">
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {selectedLead.email || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedLead.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {selectedLead.company || "—"}
                          </span>
                        </div>
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
                      <div className="flex gap-2">
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
