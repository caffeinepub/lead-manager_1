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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, MapPin } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { FirstVisitReport, Lead, User } from "../types/lms";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  fse: User;
  onSubmit: (data: Omit<FirstVisitReport, "id" | "createdAt">) => void;
}

interface FVRForm {
  customerName: string;
  mobileNo: string;
  address: string;
  existingProvider: string;
  monthlyBill: string;
  remarks: string;
}

function formatDateForFilename(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function generateFVRPdf(report: FirstVisitReport): void {
  const submittedDate = new Date(report.submittedAt);
  const filename = `FVR ${formatDateForFilename(submittedDate)}.pdf`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #2563eb; }
    .header .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .badge { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field label { font-size: 11px; color: #9ca3af; font-weight: 600; display: block; margin-bottom: 2px; }
    .field p { font-size: 13px; color: #111827; font-weight: 500; }
    .remarks-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 13px; color: #374151; min-height: 60px; line-height: 1.5; }
    .location-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; display: flex; align-items: flex-start; gap: 8px; }
    .location-icon { color: #16a34a; font-size: 16px; margin-top: 1px; }
    .location-text { font-size: 12px; color: #166534; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
    .footer .sign-box { text-align: center; }
    .footer .sign-line { width: 160px; border-bottom: 1px solid #6b7280; margin-bottom: 4px; }
    .footer small { font-size: 11px; color: #9ca3af; }
    @media print {
      body { padding: 16px; }
      @page { size: A4; margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>First Visit Report</h1>
      <div class="subtitle">Lead Management System &mdash; Field Visit Record</div>
    </div>
    <div class="badge">FVR</div>
  </div>

  <div class="section">
    <div class="section-title">Visit Information</div>
    <div class="grid2">
      <div class="field"><label>FSE Name</label><p>${report.fseName}</p></div>
      <div class="field"><label>Visit Date &amp; Time</label><p>${formatDateTime(report.submittedAt)}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="grid2">
      <div class="field"><label>Customer Name</label><p>${report.customerName || "—"}</p></div>
      <div class="field"><label>Mobile No</label><p>${report.mobileNo || "—"}</p></div>
      <div class="field"><label>Existing Provider</label><p>${report.existingProvider || "—"}</p></div>
      <div class="field"><label>Monthly Bill</label><p>${report.monthlyBill ? `₹${report.monthlyBill}` : "—"}</p></div>
      <div class="field" style="grid-column: span 2"><label>Address</label><p>${report.address || "—"}</p></div>
    </div>
  </div>

  ${
    report.remarks
      ? `<div class="section">
    <div class="section-title">Remarks / Observations</div>
    <div class="remarks-box">${report.remarks}</div>
  </div>`
      : ""
  }

  ${
    report.location
      ? `<div class="section">
    <div class="section-title">GPS Location Captured</div>
    <div class="location-box">
      <span class="location-icon">&#x1F4CD;</span>
      <div class="location-text">
        <strong>${report.location.address || "Location captured"}</strong><br/>
        Lat: ${report.location.lat.toFixed(6)}, Lng: ${report.location.lng.toFixed(6)}
      </div>
    </div>
  </div>`
      : `<div class="section"><div class="section-title">GPS Location</div><p style="color:#9ca3af;font-size:12px">Location not captured</p></div>`
  }

  <div class="footer">
    <div class="footer .sign-box">
      <div class="sign-line"></div>
      <small>FSE Signature</small>
    </div>
    <div style="text-align:right">
      <small style="color:#9ca3af">Generated: ${formatDateTime(new Date().toISOString())}</small><br/>
      <small style="color:#9ca3af">Report ID: ${report.id.slice(0, 8).toUpperCase()}</small>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.document.title = filename;
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 300);
    };
  } else {
    // Fallback: direct download as HTML file
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(".pdf", ".html");
    a.click();
    URL.revokeObjectURL(url);
  }
}

export function FirstVisitReportDialog({
  open,
  onOpenChange,
  lead,
  fse,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FVRForm>({
    customerName: lead.name ?? "",
    mobileNo: lead.mobileNo ?? "",
    address: lead.address ?? "",
    existingProvider: "",
    monthlyBill: lead.monthlyBill ?? "",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const setField =
    (key: keyof FVRForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let location: FirstVisitReport["location"] = null;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        });
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      // Reverse geocode via OpenStreetMap Nominatim
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await resp.json();
        if (data?.display_name) address = data.display_name;
      } catch {
        // keep coordinate fallback
      }
      location = { lat, lng, address };
    } catch {
      toast.warning(
        "Location not captured — permission denied or unavailable.",
      );
    }

    const submittedAt = new Date().toISOString();
    const data: Omit<FirstVisitReport, "id" | "createdAt"> = {
      leadId: lead.id,
      fseId: fse.id,
      fseName: fse.name,
      customerName: form.customerName.trim(),
      mobileNo: form.mobileNo.trim(),
      address: form.address.trim(),
      existingProvider: form.existingProvider.trim(),
      monthlyBill: form.monthlyBill.trim(),
      remarks: form.remarks.trim(),
      location,
      submittedAt,
    };

    onSubmit(data);
    setSubmitting(false);
    onOpenChange(false);
    toast.success("First Visit Report saved");

    // Generate and open PDF
    const fvrWithId: FirstVisitReport = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: submittedAt,
    };
    setTimeout(() => generateFVRPdf(fvrWithId), 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto"
        data-ocid="fvr.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            First Visit Report
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Lead:{" "}
            <span className="font-medium text-foreground">{lead.name}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.customerName}
                onChange={setField("customerName")}
                required
                placeholder="Full name"
                className="bg-secondary border-border"
                data-ocid="fvr.customername.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Mobile No <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.mobileNo}
                onChange={setField("mobileNo")}
                required
                placeholder="+91 XXXXX XXXXX"
                className="bg-secondary border-border"
                data-ocid="fvr.mobileno.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Monthly Bill (₹)
              </Label>
              <Input
                value={form.monthlyBill}
                onChange={setField("monthlyBill")}
                placeholder="e.g. 8500"
                className="bg-secondary border-border"
                data-ocid="fvr.monthlybill.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Address
              </Label>
              <Input
                value={form.address}
                onChange={setField("address")}
                placeholder="Customer address"
                className="bg-secondary border-border"
                data-ocid="fvr.address.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Existing Provider
              </Label>
              <Input
                value={form.existingProvider}
                onChange={setField("existingProvider")}
                placeholder="e.g. Airtel, Jio, BSNL"
                className="bg-secondary border-border"
                data-ocid="fvr.existingprovider.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Remarks / Observations
              </Label>
              <Textarea
                value={form.remarks}
                onChange={setField("remarks")}
                placeholder="Describe your visit observations..."
                className="bg-secondary border-border resize-none"
                rows={3}
                data-ocid="fvr.remarks.textarea"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Your GPS location will be captured automatically on submit.
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              data-ocid="fvr.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground"
              data-ocid="fvr.submit_button"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Capturing location...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Submit &amp; Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
