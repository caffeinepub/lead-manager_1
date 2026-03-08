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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";
import { ROLE_COLORS, type Role, type User } from "../../types/lms";

interface UserFormData {
  username: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

const defaultForm: UserFormData = {
  username: "",
  name: "",
  email: "",
  password: "",
  role: "FSE",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserManagement() {
  const { currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useLMS();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(defaultForm);

  const openAdd = () => {
    setForm(defaultForm);
    setEditUser(null);
    setAddOpen(true);
  };

  const openEdit = (user: User) => {
    setForm({
      username: user.username,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditUser(user);
    setAddOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.name.trim()) return;

    // Check username uniqueness
    const exists = users.find(
      (u) => u.username === form.username.trim() && u.id !== editUser?.id,
    );
    if (exists) {
      toast.error("Username already taken");
      return;
    }

    if (editUser) {
      const updates: Partial<User> = {
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };
      if (form.password.trim()) {
        updates.passwordHash = btoa(form.password.trim());
      }
      updateUser(editUser.id, updates);
      toast.success("User updated");
    } else {
      if (!form.password.trim()) {
        toast.error("Password is required");
        return;
      }
      addUser({
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        passwordHash: btoa(form.password.trim()),
        role: form.role,
      });
      toast.success("User added");
    }
    setAddOpen(false);
    setForm(defaultForm);
    setEditUser(null);
  };

  const handleDelete = () => {
    if (!deleteUserId) return;
    if (deleteUserId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      setDeleteUserId(null);
      return;
    }
    deleteUser(deleteUserId);
    toast.success("User deleted");
    setDeleteUserId(null);
  };

  const displayUsers = users.filter(
    (u) => u.role !== "Admin" || u.id === currentUser?.id,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {users.length} total users
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground hover:opacity-90"
          data-ocid="users.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <Table data-ocid="users.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">
                Name
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Username
              </TableHead>
              <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
                Email
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Role
              </TableHead>
              <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
                Created
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div
                    data-ocid="users.empty_state"
                    className="text-muted-foreground flex flex-col items-center gap-2"
                  >
                    <Users className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-medium">No users found</p>
                    <p className="text-xs">Add your first team member</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayUsers.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  data-ocid={`users.row.item.${idx + 1}`}
                  className="border-border hover:bg-secondary/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        {user.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    @{user.username}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        ROLE_COLORS[user.role],
                      )}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        data-ocid={`users.edit_button.${idx + 1}`}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                          data-ocid={`users.delete_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-md bg-card border-border"
          data-ocid="users.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label
                  htmlFor="name"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                  className="bg-secondary border-border"
                  data-ocid="users.name.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="username"
                  required
                  className="bg-secondary border-border"
                  data-ocid="users.username.input"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, role: v as Role }))
                  }
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="users.role.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="HOD">HOD</SelectItem>
                    <SelectItem value="FSE">FSE</SelectItem>
                    <SelectItem value="TeleCaller">TeleCaller</SelectItem>
                    <SelectItem value="THOD">THOD</SelectItem>
                    <SelectItem value="BO">BO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label
                  htmlFor="email"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@company.com"
                  className="bg-secondary border-border"
                  data-ocid="users.email.input"
                />
              </div>
              <div className="col-span-2">
                <Label
                  htmlFor="password"
                  className="text-sm text-muted-foreground mb-1.5 block"
                >
                  Password{" "}
                  {editUser ? (
                    "(leave blank to keep)"
                  ) : (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder={
                    editUser ? "New password (optional)" : "Password"
                  }
                  required={!editUser}
                  className="bg-secondary border-border"
                  data-ocid="users.password.input"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddOpen(false)}
                data-ocid="users.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                data-ocid="users.submit_button"
              >
                {editUser ? "Save Changes" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={(o) => !o && setDeleteUserId(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="users.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border bg-secondary"
              data-ocid="users.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="users.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
