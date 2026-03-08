// Role types
export type Role = "Admin" | "HOD" | "FSE" | "TeleCaller" | "THOD" | "BO";

// User
export interface User {
  id: string;
  username: string;
  passwordHash: string; // btoa(password)
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

// Stage
export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}

// Lead
export interface Lead {
  id: string;
  title: string;
  name: string;
  mobileNo: string;
  address: string;
  monthlyBill: string;
  state: string;
  city: string;
  appointedAt: string; // ISO datetime string
  source: string;
  stageId: string;
  assignedToHOD: string | null;
  assignedToFSE: string | null;
  createdBy: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Note
export interface Note {
  id: string;
  leadId: string;
  text: string;
  authorId: string;
  createdAt: string;
}

// FollowUp
export interface FollowUp {
  id: string;
  leadId: string;
  assignedTo: string;
  scheduledAt: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

// DayLog
export interface DayLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface DayLog {
  id: string;
  userId: string;
  role: Role;
  date: string; // YYYY-MM-DD
  dayStartTime: string; // ISO datetime
  dayStartLocation: DayLocation | null;
  dayEndTime: string | null; // ISO datetime or null if day not ended
  dayEndLocation: DayLocation | null;
  createdAt: string;
}

// First Visit Report
export interface FirstVisitReport {
  id: string;
  leadId: string;
  fseId: string;
  fseName: string;
  customerName: string;
  mobileNo: string;
  address: string;
  existingProvider: string;
  monthlyBill: string;
  remarks: string;
  location: { lat: number; lng: number; address: string } | null;
  submittedAt: string; // ISO datetime
  createdAt: string;
}

// Sale Order
export interface SaleOrder {
  id: string;
  leadId: string;
  submittedById: string;
  submittedByName: string;
  // Form fields
  customerName: string;
  mobileNo: string;
  address: string;
  state: string;
  city: string;
  monthlyBill: string;
  sanctionLoad: string;
  connectionType: string;
  remarks: string;
  location: { lat: number; lng: number; address: string } | null;
  submittedAt: string;
  createdAt: string;
}

// Order ID Request
export interface OrderIdRequest {
  id: string;
  leadId: string;
  submittedById: string;
  submittedByName: string;
  // Checkboxes
  lightBill: boolean;
  panCard: boolean;
  cancelledCheque: boolean;
  aadharCard: boolean;
  allDocsGiven: boolean;
  loanApproved: boolean;
  nameOnLightBill: boolean;
  sanctionLoad: boolean;
  noc: boolean;
  // Status
  allChecked: boolean; // true when all 9 are ticked
  status: "pending" | "approved" | "rejected";
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
}

// localStorage keys
export const LS_USERS = "lms_users";
export const LS_SESSION = "lms_session";
export const LS_STAGES = "lms_stages";
export const LS_LEADS = "lms_leads";
export const LS_NOTES = "lms_notes";
export const LS_FOLLOWUPS = "lms_followups";
export const LS_DAYLOGS = "lms_daylogs";
export const LS_FVRS = "lms_fvrs";
export const LS_SALE_ORDERS = "lms_sale_orders";
export const LS_ORDER_ID_REQUESTS = "lms_order_id_requests";

// Session
export interface Session {
  userId: string;
  role: Role;
}

// Lead sources
export const LEAD_SOURCES = [
  "Web",
  "Referral",
  "Social",
  "Cold Call",
  "Event",
  "Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

// Default stages seed
export const DEFAULT_STAGES: Stage[] = [
  { id: "stage-1", name: "New", order: 1, color: "#3b82f6" },
  { id: "stage-2", name: "Contacted", order: 2, color: "#f59e0b" },
  { id: "stage-3", name: "Qualified", order: 3, color: "#8b5cf6" },
  { id: "stage-4", name: "Proposal", order: 4, color: "#f97316" },
  { id: "stage-5", name: "Negotiation", order: 5, color: "#06b6d4" },
  { id: "stage-6", name: "Order Confirmed", order: 6, color: "#10b981" },
  { id: "stage-7", name: "Won", order: 7, color: "#22c55e" },
  { id: "stage-8", name: "Lost", order: 8, color: "#6b7280" },
];

// Role colors for badges
export const ROLE_COLORS: Record<Role, string> = {
  Admin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  HOD: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  FSE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  TeleCaller: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  THOD: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  BO: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

// Legacy support types (kept for compatibility with old components that may reference these)
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal"
  | "Won"
  | "Lost";
export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
];
export const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Contacted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Qualified: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Proposal: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Won: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Lost: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
export const STATUS_DOT_COLORS: Record<LeadStatus, string> = {
  New: "bg-blue-400",
  Contacted: "bg-amber-400",
  Qualified: "bg-purple-400",
  Proposal: "bg-orange-400",
  Won: "bg-emerald-400",
  Lost: "bg-slate-400",
};
export const SOURCE_COLORS: Record<string, string> = {
  Web: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Referral: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Social: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  "Cold Call": "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Event: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  Other: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
