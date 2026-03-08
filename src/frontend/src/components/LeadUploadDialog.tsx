import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { LeadFormInput } from "./AddLeadDialog";

interface LeadUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: Partial<LeadFormInput>[]) => void;
}

interface ParsedRow {
  name: string;
  mobileNo: string;
  address: string;
  monthlyBill: string;
  state: string;
  city: string;
  appointedAt: string;
  source: string;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(",");
  const headers = rawHeaders.map(normalizeHeader);

  const findIdx = (...candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const nameIdx = findIdx("name");
  const mobileIdx = findIdx("mobileno", "mobile", "mobilenumber", "phone");
  const addressIdx = findIdx("address");
  const billIdx = findIdx("monthlybill", "bill", "monthly bill", "monthlybill");
  const stateIdx = findIdx("state");
  const cityIdx = findIdx("city");
  const appointedIdx = findIdx(
    "appointeddate",
    "appointed date",
    "appointedat",
    "appointeddatetime",
  );
  const sourceIdx = findIdx("source");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.every((c) => !c)) continue;
    rows.push({
      name: nameIdx >= 0 ? (cols[nameIdx] ?? "") : "",
      mobileNo: mobileIdx >= 0 ? (cols[mobileIdx] ?? "") : "",
      address: addressIdx >= 0 ? (cols[addressIdx] ?? "") : "",
      monthlyBill: billIdx >= 0 ? (cols[billIdx] ?? "") : "",
      state: stateIdx >= 0 ? (cols[stateIdx] ?? "") : "",
      city: cityIdx >= 0 ? (cols[cityIdx] ?? "") : "",
      appointedAt:
        appointedIdx >= 0
          ? (() => {
              const raw = cols[appointedIdx] ?? "";
              if (!raw) return "";
              try {
                return new Date(raw).toISOString();
              } catch {
                return "";
              }
            })()
          : "",
      source: sourceIdx >= 0 ? (cols[sourceIdx] ?? "Other") : "Other",
    });
  }
  return rows;
}

export const SAMPLE_UPLOAD_CSV = `name,mobile no,address,monthly bill,state,city,appointed date,source
Anita Sharma,+91 98765 00001,45 MG Road Andheri,8500,Maharashtra,Mumbai,2026-04-15 10:00,Web
Rohan Gupta,+91 87654 00002,12 Nehru Place,12000,Delhi,New Delhi,2026-04-16 11:30,Referral
Meena Joshi,+91 76543 00003,88 Brigade Road,6200,Karnataka,Bengaluru,2026-04-17 14:00,Cold Call`;

export function LeadUploadDialog({
  open,
  onOpenChange,
  onImport,
}: LeadUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setParsedRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetState();
    onOpenChange(o);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      toast.error("Please upload a CSV file (.csv)");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast.error("No data rows found. Check CSV format.");
      } else {
        toast.success(
          `Parsed ${rows.length} row${rows.length !== 1 ? "s" : ""}`,
        );
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (parsedRows.length === 0) return;
    const valid = parsedRows.filter((r) => r.name.trim());
    if (valid.length === 0) {
      toast.error("No valid rows found (Name is required)");
      return;
    }
    onImport(valid);
    toast.success(
      `Imported ${valid.length} lead${valid.length !== 1 ? "s" : ""}`,
    );
    handleOpenChange(false);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_UPLOAD_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-3xl bg-card border-border max-h-[85vh] flex flex-col"
        data-ocid="upload.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Upload Leads via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Template info */}
          <div className="rounded-lg bg-secondary/40 border border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1.5">
              Expected columns:
            </p>
            <p className="font-mono leading-relaxed">
              name, mobile no, address, monthly bill, state, city, appointed
              date, source
            </p>
            <button
              type="button"
              onClick={downloadSample}
              className="mt-2 text-primary hover:underline text-xs flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Download sample template
            </button>
          </div>

          {/* Dropzone (shown when no file loaded) */}
          {parsedRows.length === 0 && (
            <label
              htmlFor="upload-dialog-file-input"
              className={`block rounded-xl border-2 border-dashed transition-all p-8 text-center cursor-pointer ${
                isDragging
                  ? "border-primary/70 bg-primary/5"
                  : "border-border hover:border-primary/40 bg-secondary/20"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              data-ocid="upload.dropzone"
            >
              <input
                id="upload-dialog-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
                data-ocid="upload.file_input"
              />
              <Upload
                className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground opacity-40"}`}
              />
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop your CSV here" : "Click or drag & drop CSV"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only .csv files are supported
              </p>
            </label>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground">
                    {fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({parsedRows.length} rows)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-medium w-8">
                          #
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          Name
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                          Mobile
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden md:table-cell">
                          City
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden md:table-cell">
                          State
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden lg:table-cell">
                          Monthly Bill
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden lg:table-cell">
                          Source
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, i) => (
                        <TableRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: CSV preview rows have no stable ID
                          key={i}
                          data-ocid={`upload.row.item.${i + 1}`}
                          className="border-border hover:bg-secondary/30"
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {row.name || (
                              <span className="text-destructive/70 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Missing
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {row.mobileNo || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {row.city || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {row.state || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                            {row.monthlyBill || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                            {row.source || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {parsedRows.filter((r) => !r.name.trim()).length > 0 && (
                  <span className="text-destructive">
                    {parsedRows.filter((r) => !r.name.trim()).length} row(s)
                    will be skipped (missing name).{" "}
                  </span>
                )}
                {parsedRows.filter((r) => r.name.trim()).length} lead(s) will be
                imported.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            data-ocid="upload.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={parsedRows.length === 0}
            className="bg-primary text-primary-foreground"
            data-ocid="upload.confirm_button"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import{" "}
            {parsedRows.filter((r) => r.name.trim()).length > 0
              ? `${parsedRows.filter((r) => r.name.trim()).length} Lead${parsedRows.filter((r) => r.name.trim()).length !== 1 ? "s" : ""}`
              : "Leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
