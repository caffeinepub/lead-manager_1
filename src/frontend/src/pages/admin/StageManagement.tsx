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
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  ChevronUp,
  Edit2,
  Kanban,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLMS } from "../../context/LMSContext";
import type { Stage } from "../../types/lms";

const PRESET_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#10b981",
  "#6b7280",
  "#ef4444",
  "#ec4899",
  "#84cc16",
];

interface StageFormData {
  name: string;
  color: string;
  order: number;
}

export function StageManagement() {
  const { stages, addStage, updateStage, deleteStage, reorderStage, leads } =
    useLMS();
  const [open, setOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [form, setForm] = useState<StageFormData>({
    name: "",
    color: PRESET_COLORS[0],
    order: 1,
  });

  const openAdd = () => {
    const maxOrder = stages.reduce((max, s) => Math.max(max, s.order), 0);
    setForm({ name: "", color: PRESET_COLORS[0], order: maxOrder + 1 });
    setEditStage(null);
    setOpen(true);
  };

  const openEdit = (stage: Stage) => {
    setForm({ name: stage.name, color: stage.color, order: stage.order });
    setEditStage(stage);
    setOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editStage) {
      updateStage(editStage.id, { name: form.name.trim(), color: form.color });
      toast.success("Stage updated");
    } else {
      addStage({
        name: form.name.trim(),
        color: form.color,
        order: form.order,
      });
      toast.success("Stage added");
    }
    setOpen(false);
    setEditStage(null);
  };

  const handleDelete = () => {
    if (!deleteStageId) return;
    const count = leads.filter((l) => l.stageId === deleteStageId).length;
    if (count > 0) {
      toast.error(`Cannot delete: ${count} lead(s) are in this stage`);
      setDeleteStageId(null);
      return;
    }
    deleteStage(deleteStageId);
    toast.success("Stage deleted");
    setDeleteStageId(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Stage Management
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {stages.length} pipeline stages
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground hover:opacity-90"
          data-ocid="stages.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>
      </div>

      <div className="space-y-2">
        {stages.length === 0 ? (
          <div
            data-ocid="stages.empty_state"
            className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2"
          >
            <Kanban className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No stages yet</p>
            <p className="text-xs">Create pipeline stages to get started</p>
          </div>
        ) : (
          stages.map((stage, idx) => {
            const leadsInStage = leads.filter(
              (l) => l.stageId === stage.id,
            ).length;
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                data-ocid={`stages.item.${idx + 1}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all shadow-card"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-display font-bold text-white text-sm shadow-sm"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{stage.name}</p>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {leadsInStage} lead{leadsInStage !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reorderStage(stage.id, "up")}
                    disabled={idx === 0}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reorderStage(stage.id, "down")}
                    disabled={idx === stages.length - 1}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(stage)}
                    data-ocid={`stages.edit_button.${idx + 1}`}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteStageId(stage.id)}
                    data-ocid={`stages.delete_button.${idx + 1}`}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Stage Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="stages.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editStage ? "Edit Stage" : "Add Stage"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="stage-name"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Stage Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stage-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Follow Up"
                required
                className="bg-secondary border-border"
                data-ocid="stages.name.input"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color }))}
                    className="w-8 h-8 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        form.color === color ? "white" : "transparent",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: form.color }}
                />
                <Input
                  type="text"
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="#3b82f6"
                  className="bg-secondary border-border text-sm"
                  data-ocid="stages.color.input"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                data-ocid="stages.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                data-ocid="stages.submit_button"
              >
                {editStage ? "Save Changes" : "Add Stage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteStageId}
        onOpenChange={(o) => !o && setDeleteStageId(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="stages.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? Leads in this stage will need to be reassigned. If
              leads exist in this stage, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border bg-secondary"
              data-ocid="stages.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="stages.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
