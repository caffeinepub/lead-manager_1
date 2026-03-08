import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  ClipboardCheck,
  LayoutDashboard,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";

export function BODashboard() {
  const { currentUser } = useAuth();
  const {
    leads,
    stages,
    users,
    getPendingOrderIdRequests,
    updateOrderIdRequest,
  } = useLMS();

  const [activeTab, setActiveTab] = useState("pendingapproval");

  const pendingOrderIdRequests = useMemo(
    () => getPendingOrderIdRequests(),
    [getPendingOrderIdRequests],
  );

  const handleApproveOrderId = (id: string) => {
    updateOrderIdRequest(id, {
      status: "approved",
      reviewedById: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewedAt: new Date().toISOString(),
    });
    toast.success("Order ID request approved");
  };

  const handleRejectOrderId = (id: string) => {
    updateOrderIdRequest(id, {
      status: "rejected",
      reviewedById: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewedAt: new Date().toISOString(),
    });
    toast.success("Order ID request rejected");
  };

  const ORDER_ID_LABELS = [
    { key: "lightBill", label: "Light Bill" },
    { key: "panCard", label: "PAN Card" },
    { key: "cancelledCheque", label: "Cancelled Cheque" },
    { key: "aadharCard", label: "Aadhar Card" },
    { key: "allDocsGiven", label: "All Docs Given" },
    { key: "loanApproved", label: "Loan Approved" },
    { key: "nameOnLightBill", label: "Name on Light Bill" },
    { key: "sanctionLoad", label: "Sanction Load" },
    { key: "noc", label: "NOC" },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Business Officer Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back, {currentUser?.name}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="pendingapproval"
      >
        <TabsList className="mb-5 bg-secondary border border-border">
          <TabsTrigger
            value="pendingapproval"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="bo.tabs.pendingapproval.tab"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Pending Approval
            {pendingOrderIdRequests.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                {pendingOrderIdRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="allleads"
            className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="bo.tabs.allleads.tab"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            All Leads
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Approval Tab ── */}
        <TabsContent value="pendingapproval">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              Order ID Requests — Pending Approval
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All order ID requests where all 9 documents are confirmed by FSEs
            </p>
          </div>

          {pendingOrderIdRequests.length === 0 ? (
            <div
              data-ocid="bo.pendingapproval.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No pending approvals</p>
              <p className="text-xs mt-1">
                When FSEs submit order ID requests with all documents, they will
                appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="bo.pendingapproval.list">
              {pendingOrderIdRequests.map((req, i) => {
                const lead = leads.find((l) => l.id === req.leadId);
                const stage = stages.find((s) => s.id === lead?.stageId);
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-ocid={`bo.pendingapproval.item.${i + 1}`}
                  >
                    <Card className="bg-card border-border shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {lead?.name ?? "Unknown Lead"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Submitted by{" "}
                              <span className="text-foreground">
                                {req.submittedByName}
                              </span>{" "}
                              ·{" "}
                              {new Date(req.submittedAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                            {stage && (
                              <span
                                className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                                style={{
                                  borderColor: `${stage.color}40`,
                                  color: stage.color,
                                  backgroundColor: `${stage.color}18`,
                                }}
                              >
                                {stage.name}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30 shrink-0"
                          >
                            All 9 Docs
                          </Badge>
                        </div>

                        {/* Document checklist */}
                        <div className="grid grid-cols-3 gap-1.5 mb-4">
                          {ORDER_ID_LABELS.map((field) => (
                            <div
                              key={field.key}
                              className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-emerald-500/8 border border-emerald-500/20 text-emerald-300"
                            >
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {field.label}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            onClick={() => handleApproveOrderId(req.id)}
                            data-ocid={`bo.pendingapproval.approve_button.${i + 1}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex-1"
                            onClick={() => handleRejectOrderId(req.id)}
                            data-ocid={`bo.pendingapproval.reject_button.${i + 1}`}
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── All Leads Tab (read-only) ── */}
        <TabsContent value="allleads">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              All Leads
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {leads.length} total lead{leads.length !== 1 ? "s" : ""} in the
              system
            </p>
          </div>

          {leads.length === 0 ? (
            <div
              data-ocid="bo.allleads.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No leads in the system yet</p>
              <p className="text-xs mt-1">
                Leads will appear here once they are added
              </p>
            </div>
          ) : (
            <Card className="bg-card border-border shadow-card overflow-hidden">
              <Table data-ocid="bo.allleads.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium pl-4">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Mobile
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
                      City / State
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Stage
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
                      HOD
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
                      FSE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, idx) => {
                    const stage = stages.find((s) => s.id === lead.stageId);
                    const hod = lead.assignedToHOD
                      ? users.find((u) => u.id === lead.assignedToHOD)
                      : null;
                    const fse = lead.assignedToFSE
                      ? users.find((u) => u.id === lead.assignedToFSE)
                      : null;
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        data-ocid={`bo.allleads.row.${idx + 1}`}
                        className="border-border hover:bg-secondary/20 transition-colors"
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {lead.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground text-sm truncate max-w-[120px]">
                              {lead.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.mobileNo || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {[lead.city, lead.state].filter(Boolean).join(", ") ||
                            "—"}
                        </TableCell>
                        <TableCell>
                          {stage ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                              style={{
                                borderColor: `${stage.color}40`,
                                color: stage.color,
                                backgroundColor: `${stage.color}18`,
                              }}
                            >
                              {stage.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {hod?.name ?? "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {fse?.name ?? "—"}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
