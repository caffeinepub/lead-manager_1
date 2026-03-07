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
import { KeyRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword)
      newErrors.currentPassword = "Current password is required";
    if (!newPassword) newErrors.newPassword = "New password is required";
    else if (newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const success = changePassword(currentPassword, newPassword);
    setIsSubmitting(false);
    if (success) {
      toast.success("Password changed successfully");
      onOpenChange(false);
    } else {
      toast.error("Current password is incorrect");
      setErrors({ currentPassword: "Current password is incorrect" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="change_password.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
            </div>
            Change Password
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="current-password"
              className="text-sm text-muted-foreground"
            >
              Current Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword)
                  setErrors((p) => ({ ...p, currentPassword: "" }));
              }}
              placeholder="Enter current password"
              className="bg-secondary border-border"
              data-ocid="change_password.current.input"
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <p
                className="text-xs text-destructive"
                data-ocid="change_password.current.error_state"
              >
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="new-password"
              className="text-sm text-muted-foreground"
            >
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword)
                  setErrors((p) => ({ ...p, newPassword: "" }));
              }}
              placeholder="Minimum 6 characters"
              className="bg-secondary border-border"
              data-ocid="change_password.new.input"
              autoComplete="new-password"
            />
            {errors.newPassword && (
              <p
                className="text-xs text-destructive"
                data-ocid="change_password.new.error_state"
              >
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="confirm-password"
              className="text-sm text-muted-foreground"
            >
              Confirm New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              placeholder="Re-enter new password"
              className="bg-secondary border-border"
              data-ocid="change_password.confirm.input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p
                className="text-xs text-destructive"
                data-ocid="change_password.confirm.error_state"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-ocid="change_password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:opacity-90"
              data-ocid="change_password.submit_button"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
