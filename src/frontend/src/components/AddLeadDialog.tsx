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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type FormEvent, useState } from "react";
import { LEAD_SOURCES, type Stage } from "../types/lms";

export interface LeadFormInput {
  title: string;
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

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormInput) => void;
  stages: Stage[];
  initialValues?: Partial<LeadFormInput>;
  title?: string;
  submitLabel?: string;
}

const defaultForm: LeadFormInput = {
  title: "",
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

export function AddLeadDialog({
  open,
  onOpenChange,
  onSubmit,
  stages,
  initialValues,
  title = "Add New Lead",
  submitLabel = "Add Lead",
}: AddLeadDialogProps) {
  const [form, setForm] = useState<LeadFormInput>(() => ({
    ...defaultForm,
    stageId: stages[0]?.id ?? "",
    ...initialValues,
  }));

  // Reset form when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setForm({
        ...defaultForm,
        stageId: stages[0]?.id ?? "",
        ...initialValues,
      });
    }
    onOpenChange(o);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      title: form.name.trim(), // auto-generate title from name
      name: form.name.trim(),
      mobileNo: form.mobileNo.trim(),
      address: form.address.trim(),
      monthlyBill: form.monthlyBill.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
    });
  };

  const set =
    (field: keyof LeadFormInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        data-ocid="lead.add.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Name — full width */}
            <div className="col-span-2">
              <Label
                htmlFor="add-lead-name"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-lead-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Full name"
                required
                className="bg-secondary border-border"
                data-ocid="lead.name.input"
              />
            </div>

            {/* Mobile No */}
            <div className="col-span-2 sm:col-span-1">
              <Label
                htmlFor="add-lead-mobile"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Mobile No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-lead-mobile"
                value={form.mobileNo}
                onChange={set("mobileNo")}
                placeholder="+91 98765 43210"
                required
                className="bg-secondary border-border"
                data-ocid="lead.mobileno.input"
              />
            </div>

            {/* Monthly Bill */}
            <div className="col-span-2 sm:col-span-1">
              <Label
                htmlFor="add-lead-bill"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Monthly Bill
              </Label>
              <Input
                id="add-lead-bill"
                value={form.monthlyBill}
                onChange={set("monthlyBill")}
                placeholder="e.g. 5000"
                className="bg-secondary border-border"
                data-ocid="lead.monthlybill.input"
              />
            </div>

            {/* Address — full width */}
            <div className="col-span-2">
              <Label
                htmlFor="add-lead-address"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Address
              </Label>
              <Input
                id="add-lead-address"
                value={form.address}
                onChange={set("address")}
                placeholder="Street, area, locality"
                className="bg-secondary border-border"
                data-ocid="lead.address.input"
              />
            </div>

            {/* State */}
            <div>
              <Label
                htmlFor="add-lead-state"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                State
              </Label>
              <Input
                id="add-lead-state"
                value={form.state}
                onChange={set("state")}
                placeholder="e.g. Maharashtra"
                className="bg-secondary border-border"
                data-ocid="lead.state.input"
              />
            </div>

            {/* City */}
            <div>
              <Label
                htmlFor="add-lead-city"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                City
              </Label>
              <Input
                id="add-lead-city"
                value={form.city}
                onChange={set("city")}
                placeholder="e.g. Mumbai"
                className="bg-secondary border-border"
                data-ocid="lead.city.input"
              />
            </div>

            {/* Appointed Date & Time — full width */}
            <div className="col-span-2">
              <Label
                htmlFor="add-lead-appointed"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Appointed Date &amp; Time
              </Label>
              <Input
                id="add-lead-appointed"
                type="datetime-local"
                value={form.appointedAt ? form.appointedAt.slice(0, 16) : ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    appointedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  }))
                }
                className="bg-secondary border-border"
                data-ocid="lead.appointedat.input"
              />
            </div>

            {/* Source */}
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
                  data-ocid="lead.source.select"
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

            {/* Stage */}
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
                  data-ocid="lead.stage.select"
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
              onClick={() => onOpenChange(false)}
              data-ocid="lead.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              data-ocid="lead.submit_button"
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
