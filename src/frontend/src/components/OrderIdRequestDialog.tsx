import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead, OrderIdRequest, User } from "../types/lms";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  submittedBy: User;
  onSubmit: (data: Omit<OrderIdRequest, "id" | "createdAt">) => void;
}

const ORDER_ID_FIELDS: { key: keyof CheckboxState; label: string }[] = [
  { key: "lightBill", label: "Light Bill" },
  { key: "panCard", label: "PAN Card" },
  { key: "cancelledCheque", label: "Cancelled Cheque" },
  { key: "aadharCard", label: "Aadhar Card" },
  { key: "allDocsGiven", label: "All Docs Given" },
  { key: "loanApproved", label: "Loan Approved" },
  { key: "nameOnLightBill", label: "Name on Light Bill" },
  { key: "sanctionLoad", label: "Sanction Load" },
  { key: "noc", label: "NOC" },
];

interface CheckboxState {
  lightBill: boolean;
  panCard: boolean;
  cancelledCheque: boolean;
  aadharCard: boolean;
  allDocsGiven: boolean;
  loanApproved: boolean;
  nameOnLightBill: boolean;
  sanctionLoad: boolean;
  noc: boolean;
}

const defaultChecks: CheckboxState = {
  lightBill: false,
  panCard: false,
  cancelledCheque: false,
  aadharCard: false,
  allDocsGiven: false,
  loanApproved: false,
  nameOnLightBill: false,
  sanctionLoad: false,
  noc: false,
};

export function OrderIdRequestDialog({
  open,
  onOpenChange,
  lead,
  submittedBy,
  onSubmit,
}: Props) {
  const [checks, setChecks] = useState<CheckboxState>(defaultChecks);

  const toggle = (key: keyof CheckboxState) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checks).every(Boolean);
  const checkedCount = Object.values(checks).filter(Boolean).length;

  const handleSubmit = () => {
    const submittedAt = new Date().toISOString();
    const data: Omit<OrderIdRequest, "id" | "createdAt"> = {
      leadId: lead.id,
      submittedById: submittedBy.id,
      submittedByName: submittedBy.name,
      ...checks,
      allChecked,
      status: allChecked ? "pending" : "pending",
      submittedAt,
    };
    onSubmit(data);
    onOpenChange(false);
    setChecks(defaultChecks);
    if (allChecked) {
      toast.success(
        "All documents confirmed! Request sent to Admin for approval.",
      );
    } else {
      toast.success(
        `Order ID request saved (${checkedCount}/9 items checked).`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="order_id_request.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
            Request Order ID
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Lead:{" "}
            <span className="font-medium text-foreground">{lead.name}</span>
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            Tick all applicable documents. When all 9 are checked the request
            goes to Admin for approval.
          </p>
          <div className="space-y-2.5">
            {ORDER_ID_FIELDS.map((field, idx) => (
              <button
                key={field.key}
                type="button"
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors cursor-pointer w-full text-left"
                onClick={() => toggle(field.key)}
                data-ocid={`order_id_request.checkbox.${idx + 1}`}
              >
                <Checkbox
                  checked={checks[field.key]}
                  onCheckedChange={() => toggle(field.key)}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label className="text-sm text-foreground cursor-pointer flex-1">
                  {field.label}
                </Label>
                {checks[field.key] && (
                  <span className="text-xs text-blue-400 font-medium">
                    Done
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium transition-colors ${
              allChecked
                ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                : "bg-secondary/30 border-border text-muted-foreground"
            }`}
          >
            <span>
              {checkedCount} of {ORDER_ID_FIELDS.length} items checked
            </span>
            {allChecked && (
              <span className="text-blue-300">
                All done — will go for approval
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-ocid="order_id_request.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className={
              allChecked
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-primary text-primary-foreground"
            }
            data-ocid="order_id_request.submit_button"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
