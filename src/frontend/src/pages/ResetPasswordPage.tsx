import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function ResetPasswordPage() {
  const { setFirstLoginPassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirm?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      errs.confirm = "Passwords do not match";
    }
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    const ok = setFirstLoginPassword(newPassword);
    setIsSubmitting(false);
    if (ok) {
      toast.success("Password updated successfully! Welcome aboard.");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border/50 px-8 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Set Your New Password
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              You must set a new password before continuing
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            <div>
              <Label
                htmlFor="new-password"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                New Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((p) => ({ ...p, newPassword: undefined }));
                  }}
                  placeholder="At least 6 characters"
                  required
                  className="pl-9 bg-secondary border-border"
                  data-ocid="reset.new_password.input"
                />
              </div>
              {errors.newPassword && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="reset.new_password.error_state"
                >
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirm-password"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((p) => ({ ...p, confirm: undefined }));
                  }}
                  placeholder="Repeat your new password"
                  required
                  className="pl-9 bg-secondary border-border"
                  data-ocid="reset.confirm_password.input"
                />
              </div>
              {errors.confirm && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="reset.confirm_password.error_state"
                >
                  {errors.confirm}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 h-10"
              data-ocid="reset.submit_button"
            >
              {isSubmitting ? "Saving..." : "Set Password & Continue"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This is a one-time setup. You can change your password later from
              your profile.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
