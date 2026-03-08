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
import { AlertCircle, CheckCircle2, FileText, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";

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
  const billIdx = findIdx("monthlybill", "bill", "monthlybill");
  const stateIdx = findIdx("state");
  const cityIdx = findIdx("city");
  const appointedIdx = findIdx(
    "appointeddate",
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

const SAMPLE_CSV = `name,mobile no,address,monthly bill,state,city,appointed date,source
Anita Sharma,+91 98765 00001,45 MG Road Andheri,8500,Maharashtra,Mumbai,2026-04-15 10:00,Web
Rohan Gupta,+91 87654 00002,12 Nehru Place,12000,Delhi,New Delhi,2026-04-16 11:30,Referral
Meena Joshi,+91 76543 00003,88 Brigade Road,6200,Karnataka,Bengaluru,2026-04-17 14:00,Cold Call`;

export function TeleCallerUpload() {
  const { currentUser } = useAuth();
  const { stages, addLead } = useLMS();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    success: number;
    error: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFileName(file.name);
    setImportResult(null);
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

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    const firstStageId = stages[0]?.id ?? "";
    let success = 0;
    let error = 0;

    for (const row of parsedRows) {
      try {
        if (!row.name.trim()) {
          error++;
          continue;
        }
        addLead({
          title: row.name.trim(),
          name: row.name.trim(),
          mobileNo: row.mobileNo.trim(),
          address: row.address.trim(),
          monthlyBill: row.monthlyBill.trim(),
          state: row.state.trim(),
          city: row.city.trim(),
          appointedAt: row.appointedAt,
          source: row.source.trim() || "Other",
          stageId: firstStageId,
          assignedToHOD: null,
          assignedToFSE: null,
          createdBy: currentUser?.id ?? "",
          uploadedBy: currentUser?.id ?? null,
        });
        success++;
      } catch {
        error++;
      }
    }

    setImportResult({ success, error });
    setParsedRows([]);
    setFileName("");
    if (success > 0) {
      toast.success(
        `Imported ${success} lead${success !== 1 ? "s" : ""} successfully`,
      );
    }
    if (error > 0) {
      toast.error(`${error} row${error !== 1 ? "s" : ""} failed to import`);
    }
  };

  const handleClear = () => {
    setParsedRows([]);
    setFileName("");
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="w-6 h-6 text-orange-400" />
          Upload Leads via CSV
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Import multiple leads at once by uploading a CSV file
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: instructions + dropzone */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                CSV Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Your CSV must have these column headers (in any order):
              </p>
              <div className="space-y-1">
                {[
                  { col: "name", required: true },
                  { col: "mobile no", required: false },
                  { col: "address", required: false },
                  { col: "monthly bill", required: false },
                  { col: "state", required: false },
                  { col: "city", required: false },
                  { col: "appointed date", required: false },
                  { col: "source", required: false },
                ].map(({ col, required }) => (
                  <div
                    key={col}
                    className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-secondary/40"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-400/60 shrink-0" />
                    <code className="font-mono text-foreground">{col}</code>
                    {required && (
                      <span className="text-destructive ml-auto text-[10px]">
                        required
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSample}
                className="w-full border-border bg-secondary/40 hover:bg-secondary text-xs gap-1.5"
                data-ocid="tc.upload.sample_button"
              >
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                Download Sample Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: upload area + preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Dropzone */}
          {parsedRows.length === 0 && !importResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border-2 border-dashed transition-all p-10 text-center cursor-pointer ${
                isDragging
                  ? "border-orange-400/70 bg-orange-400/5"
                  : "border-border hover:border-orange-400/40 bg-card"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="tc.upload.dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
                data-ocid="tc.upload.upload_button"
              />
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-orange-400" : "text-muted-foreground opacity-40"}`}
              />
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop your CSV here" : "Click or drag & drop CSV"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only .csv files are supported
              </p>
            </motion.div>
          )}

          {/* Import result */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="tc.upload.success_state"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center"
            >
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <p className="text-base font-semibold text-foreground">
                Import Complete
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.success} imported
                </span>
                {importResult.error > 0 && (
                  <span className="flex items-center gap-1.5 text-destructive font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {importResult.error} failed
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportResult(null)}
                className="mt-4 border-border bg-secondary hover:bg-secondary/70"
              >
                Upload Another File
              </Button>
            </motion.div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
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
                  onClick={handleClear}
                  data-ocid="tc.upload.clear_button"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="max-h-[340px] overflow-y-auto">
                  <Table data-ocid="tc.upload.table">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          #
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          Name
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden md:table-cell">
                          Mobile No
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden md:table-cell">
                          City
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium hidden lg:table-cell">
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
                          data-ocid={`tc.upload.row.item.${i + 1}`}
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
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {row.mobileNo || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {row.city || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
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

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  All leads will be set to the first stage and unassigned
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="border-border bg-secondary hover:bg-secondary/70"
                    data-ocid="tc.upload.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    data-ocid="tc.upload.import_button"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Import {parsedRows.length} Lead
                    {parsedRows.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
