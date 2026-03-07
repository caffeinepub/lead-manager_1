// This component is kept for reference but is no longer used in the new RBAC architecture.
// Lead management is now handled in role-specific admin pages.
export function LeadFormDialog(_props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: unknown) => void;
  initial?: unknown;
  mode?: "add" | "edit";
}) {
  return null;
}
