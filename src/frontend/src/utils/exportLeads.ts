import type { Lead, Stage, User } from "../types/lms";

/**
 * Escapes a value for safe CSV embedding.
 * Wraps in quotes if it contains commas, quotes, or newlines.
 */
function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats an ISO date string to a readable locale date.
 */
function formatDateForExport(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Exports leads to a CSV file and triggers browser download.
 */
export function exportLeadsToCSV(
  leads: Lead[],
  users: User[],
  stages: Stage[],
  filename?: string,
): void {
  const headers = [
    "Name",
    "Mobile No",
    "Address",
    "Monthly Bill",
    "State",
    "City",
    "Appointed Date",
    "Stage",
    "Assigned HOD",
    "Assigned FSE",
    "Created At",
  ];

  const getUserName = (id: string | null): string => {
    if (!id) return "Unassigned";
    return users.find((u) => u.id === id)?.name ?? "Unassigned";
  };

  const getStageName = (id: string): string => {
    return stages.find((s) => s.id === id)?.name ?? "Unknown";
  };

  const rows = leads.map((lead) => [
    csvEscape(lead.name),
    csvEscape(lead.mobileNo),
    csvEscape(lead.address),
    csvEscape(lead.monthlyBill),
    csvEscape(lead.state),
    csvEscape(lead.city),
    csvEscape(formatDateForExport(lead.appointedAt)),
    csvEscape(getStageName(lead.stageId)),
    csvEscape(getUserName(lead.assignedToHOD)),
    csvEscape(getUserName(lead.assignedToFSE)),
    csvEscape(formatDateForExport(lead.createdAt)),
  ]);

  const csvContent = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split("T")[0];
  const downloadFilename = filename ?? `leads-export-${today}.csv`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute("download", downloadFilename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
