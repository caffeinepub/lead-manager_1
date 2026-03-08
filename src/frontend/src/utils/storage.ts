import type {
  ApprovalLog,
  DayLog,
  FirstVisitReport,
  FollowUp,
  Lead,
  Note,
  OrderIdRequest,
  SaleOrder,
  Session,
  Stage,
  User,
} from "../types/lms";
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_STAGES,
  LEAD_SOURCES,
  LS_APPROVAL_LOGS,
  LS_DAYLOGS,
  LS_FOLLOWUPS,
  LS_FVRS,
  LS_LEADS,
  LS_NOTES,
  LS_ORDER_ID_COUNTER,
  LS_ORDER_ID_REQUESTS,
  LS_SALE_ORDERS,
  LS_SCHEMA_VERSION,
  LS_SESSION,
  LS_STAGES,
  LS_USERS,
} from "../types/lms";

// --- Generic helpers ---
function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Schema Migration ---
// Runs once per schema version bump. Fills in missing fields on all existing
// localStorage data so old-version data is always compatible with new code.
function runMigrations(): void {
  const storedVersion = load<number>(LS_SCHEMA_VERSION) ?? 0;
  if (storedVersion >= CURRENT_SCHEMA_VERSION) return;

  // --- Migrate Users ---
  const users = load<User[]>(LS_USERS);
  if (users && users.length > 0) {
    const migratedUsers = users.map((u) => ({
      ...u,
      status: u.status ?? ("active" as const),
      firstLogin: u.firstLogin ?? false,
      assignedHODs: u.assignedHODs ?? [],
      assignedTHODs: u.assignedTHODs ?? [],
    }));
    save(LS_USERS, migratedUsers);
  }

  // --- Migrate Leads ---
  const leads = load<Lead[]>(LS_LEADS);
  if (leads && leads.length > 0) {
    const migratedLeads = leads.map((l) => ({
      ...l,
      name:
        l.name ??
        (l as unknown as Record<string, string>).contactName ??
        l.title ??
        "",
      mobileNo:
        l.mobileNo ?? (l as unknown as Record<string, string>).phone ?? "",
      address: l.address ?? "",
      monthlyBill: l.monthlyBill ?? "",
      state: l.state ?? "",
      city: l.city ?? (l as unknown as Record<string, string>).company ?? "",
      appointedAt: l.appointedAt ?? l.createdAt ?? new Date().toISOString(),
      createdBy: l.createdBy ?? "user-admin-1",
      uploadedBy: l.uploadedBy ?? null,
      assignedToHOD: l.assignedToHOD ?? null,
      assignedToFSE: l.assignedToFSE ?? null,
    }));
    save(LS_LEADS, migratedLeads);
  }

  // --- Migrate Notes ---
  const notes = load<Note[]>(LS_NOTES);
  if (notes && notes.length > 0) {
    const migratedNotes = notes.map((n) => ({
      ...n,
      authorId: n.authorId ?? "user-admin-1",
    }));
    save(LS_NOTES, migratedNotes);
  }

  // --- Migrate FollowUps ---
  const followUps = load<FollowUp[]>(LS_FOLLOWUPS);
  if (followUps && followUps.length > 0) {
    const migratedFollowUps = followUps.map((f) => ({
      ...f,
      completed: f.completed ?? false,
      description: f.description ?? "",
    }));
    save(LS_FOLLOWUPS, migratedFollowUps);
  }

  // --- Migrate DayLogs ---
  const dayLogs = load<DayLog[]>(LS_DAYLOGS);
  if (dayLogs && dayLogs.length > 0) {
    const migratedDayLogs = dayLogs.map((d) => ({
      ...d,
      dayEndTime: d.dayEndTime ?? null,
      dayEndLocation: d.dayEndLocation ?? null,
      dayStartLocation: d.dayStartLocation ?? null,
    }));
    save(LS_DAYLOGS, migratedDayLogs);
  }

  // --- Migrate FirstVisitReports ---
  const fvrs = load<FirstVisitReport[]>(LS_FVRS);
  if (fvrs && fvrs.length > 0) {
    const migratedFVRs = fvrs.map((f) => ({
      ...f,
      location: f.location ?? null,
      remarks: f.remarks ?? "",
    }));
    save(LS_FVRS, migratedFVRs);
  }

  // --- Migrate SaleOrders ---
  const saleOrders = load<SaleOrder[]>(LS_SALE_ORDERS);
  if (saleOrders && saleOrders.length > 0) {
    const migratedSaleOrders = saleOrders.map((o) => ({
      ...o,
      location: o.location ?? null,
      state: o.state ?? "",
      city: o.city ?? "",
      sanctionLoad: o.sanctionLoad ?? "",
      connectionType: o.connectionType ?? "",
      remarks: o.remarks ?? "",
    }));
    save(LS_SALE_ORDERS, migratedSaleOrders);
  }

  // --- Migrate OrderIdRequests ---
  const orderIdRequests = load<OrderIdRequest[]>(LS_ORDER_ID_REQUESTS);
  if (orderIdRequests && orderIdRequests.length > 0) {
    const migratedRequests = orderIdRequests.map((r) => ({
      ...r,
      allChecked: r.allChecked ?? false,
      status: r.status ?? ("pending" as const),
      lightBill: r.lightBill ?? false,
      panCard: r.panCard ?? false,
      cancelledCheque: r.cancelledCheque ?? false,
      aadharCard: r.aadharCard ?? false,
      allDocsGiven: r.allDocsGiven ?? false,
      loanApproved: r.loanApproved ?? false,
      nameOnLightBill: r.nameOnLightBill ?? false,
      sanctionLoad: r.sanctionLoad ?? false,
      noc: r.noc ?? false,
    }));
    save(LS_ORDER_ID_REQUESTS, migratedRequests);
  }

  // --- Ensure ApprovalLogs collection exists ---
  const approvalLogs = load<ApprovalLog[]>(LS_APPROVAL_LOGS);
  if (!approvalLogs) {
    save(LS_APPROVAL_LOGS, []);
  }

  // Ensure Order ID counter is initialized if missing
  const counter = load<number>(LS_ORDER_ID_COUNTER);
  if (counter === null) {
    save(LS_ORDER_ID_COUNTER, 1400);
  }

  // Mark migration as done
  save(LS_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
}

// --- Seeding ---
export function seedData(): void {
  // Run migrations first — this preserves all existing data and fills in any
  // missing fields introduced by newer versions of the app.
  runMigrations();
  // Seed users
  const users = load<User[]>(LS_USERS);
  if (!users || users.length === 0) {
    const adminUser: User = {
      id: "user-admin-1",
      username: "arpit2127",
      passwordHash: btoa("TyGoD@2127"),
      name: "Arpit Admin",
      email: "arpit@company.com",
      role: "Admin",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
    };
    const hodUser: User = {
      id: "user-hod-1",
      username: "rahul.hod",
      passwordHash: btoa("hod@12345"),
      name: "Rahul Kumar",
      email: "rahul@company.com",
      role: "HOD",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
    };
    const fseUser1: User = {
      id: "user-fse-1",
      username: "priya.fse",
      passwordHash: btoa("fse@12345"),
      name: "Priya Sharma",
      email: "priya@company.com",
      role: "FSE",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
      assignedHODs: ["user-hod-1"],
    };
    const fseUser2: User = {
      id: "user-fse-2",
      username: "amit.fse",
      passwordHash: btoa("fse@12345"),
      name: "Amit Patel",
      email: "amit@company.com",
      role: "FSE",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
      assignedHODs: ["user-hod-1"],
    };
    const tcUser: User = {
      id: "user-tc-1",
      username: "neha.tc",
      passwordHash: btoa("tc@12345"),
      name: "Neha Tele",
      email: "neha@company.com",
      role: "TeleCaller",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
      assignedTHODs: ["user-thod-1"],
    };
    const thodUser: User = {
      id: "user-thod-1",
      username: "suresh.thod",
      passwordHash: btoa("thod@12345"),
      name: "Suresh THOD",
      email: "suresh@company.com",
      role: "THOD",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
    };
    const boUser: User = {
      id: "user-bo-1",
      username: "bo.user",
      passwordHash: btoa("bo@12345"),
      name: "Business Officer",
      email: "bo@company.com",
      role: "BO",
      createdAt: new Date().toISOString(),
      status: "active",
      firstLogin: false,
    };
    save(LS_USERS, [
      adminUser,
      hodUser,
      fseUser1,
      fseUser2,
      tcUser,
      thodUser,
      boUser,
    ]);
  }

  // Seed stages
  const stages = load<Stage[]>(LS_STAGES);
  if (!stages || stages.length === 0) {
    save(LS_STAGES, DEFAULT_STAGES);
  }

  // Seed leads
  const leads = load<Lead[]>(LS_LEADS);
  if (!leads || leads.length === 0) {
    const seedLeads: Lead[] = [
      {
        id: "lead-1",
        title: "Sunita Mehta",
        name: "Sunita Mehta",
        mobileNo: "+91 98765 43210",
        address: "45 MG Road, Andheri West",
        monthlyBill: "8500",
        state: "Maharashtra",
        city: "Mumbai",
        appointedAt: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        source: LEAD_SOURCES[0],
        stageId: "stage-3",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        uploadedBy: null,
        createdAt: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-2",
        title: "Rajesh Verma",
        name: "Rajesh Verma",
        mobileNo: "+91 87654 32109",
        address: "12 Nehru Place, Sector 15",
        monthlyBill: "12000",
        state: "Delhi",
        city: "New Delhi",
        appointedAt: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        source: LEAD_SOURCES[1],
        stageId: "stage-4",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        uploadedBy: null,
        createdAt: new Date(
          Date.now() - 22 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-3",
        title: "Deepika Singh",
        name: "Deepika Singh",
        mobileNo: "+91 76543 21098",
        address: "88 Brigade Road, Koramangala",
        monthlyBill: "6200",
        state: "Karnataka",
        city: "Bengaluru",
        appointedAt: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        source: LEAD_SOURCES[2],
        stageId: "stage-2",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        uploadedBy: null,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-4",
        title: "Vikram Nair",
        name: "Vikram Nair",
        mobileNo: "+91 65432 10987",
        address: "22 Park Street, Salt Lake",
        monthlyBill: "4500",
        state: "West Bengal",
        city: "Kolkata",
        appointedAt: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        source: LEAD_SOURCES[3],
        stageId: "stage-1",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        uploadedBy: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    save(LS_LEADS, seedLeads);
  }

  // Init notes if needed
  const notes = load<Note[]>(LS_NOTES);
  if (!notes) {
    save(LS_NOTES, []);
  }

  // Init followups if needed
  const followups = load<FollowUp[]>(LS_FOLLOWUPS);
  if (!followups) {
    save(LS_FOLLOWUPS, []);
  }
}

// --- Users ---
export function getUsers(): User[] {
  return load<User[]>(LS_USERS) ?? [];
}

export function saveUsers(users: User[]): void {
  save(LS_USERS, users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username);
}

// --- Session ---
export function getSession(): Session | null {
  return load<Session>(LS_SESSION);
}

export function setSession(session: Session | null): void {
  if (session === null) {
    localStorage.removeItem(LS_SESSION);
  } else {
    save(LS_SESSION, session);
  }
}

// --- Stages ---
export function getStages(): Stage[] {
  const stages = load<Stage[]>(LS_STAGES);
  return stages ? [...stages].sort((a, b) => a.order - b.order) : [];
}

export function saveStages(stages: Stage[]): void {
  save(LS_STAGES, stages);
}

// --- Leads ---
export function getLeads(): Lead[] {
  return load<Lead[]>(LS_LEADS) ?? [];
}

export function saveLeads(leads: Lead[]): void {
  save(LS_LEADS, leads);
}

// --- Notes ---
export function getNotes(): Note[] {
  return load<Note[]>(LS_NOTES) ?? [];
}

export function saveNotes(notes: Note[]): void {
  save(LS_NOTES, notes);
}

// --- FollowUps ---
export function getFollowUps(): FollowUp[] {
  return load<FollowUp[]>(LS_FOLLOWUPS) ?? [];
}

export function saveFollowUps(followUps: FollowUp[]): void {
  save(LS_FOLLOWUPS, followUps);
}

// --- DayLogs ---
export function getDayLogs(): DayLog[] {
  return load<DayLog[]>(LS_DAYLOGS) ?? [];
}

export function saveDayLogs(dayLogs: DayLog[]): void {
  save(LS_DAYLOGS, dayLogs);
}

// --- First Visit Reports ---
export function getFVRs(): FirstVisitReport[] {
  return load<FirstVisitReport[]>(LS_FVRS) ?? [];
}

export function saveFVRs(fvrs: FirstVisitReport[]): void {
  save(LS_FVRS, fvrs);
}

// --- Sale Orders ---
export function getSaleOrders(): SaleOrder[] {
  return load<SaleOrder[]>(LS_SALE_ORDERS) ?? [];
}

export function saveSaleOrders(orders: SaleOrder[]): void {
  save(LS_SALE_ORDERS, orders);
}

// --- Order ID Requests ---
export function getOrderIdRequests(): OrderIdRequest[] {
  return load<OrderIdRequest[]>(LS_ORDER_ID_REQUESTS) ?? [];
}

export function saveOrderIdRequests(requests: OrderIdRequest[]): void {
  save(LS_ORDER_ID_REQUESTS, requests);
}

// --- Order ID Counter ---
export function getOrderIdCounter(): number {
  const val = load<number>(LS_ORDER_ID_COUNTER);
  return val ?? 1400;
}

export function saveOrderIdCounter(n: number): void {
  save(LS_ORDER_ID_COUNTER, n);
}

// --- Generate Order ID ---
// Format: FY/MM/serial (e.g. 25-26/03/1400)
// FY starts April 1st each year
export function generateOrderId(approvedAt: string): string {
  const date = new Date(approvedAt);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed

  // Financial year: April 1 to March 31
  // If month >= 4, FY is YY-(YY+1), else (YY-1)-YY
  let fyStart: number;
  if (month >= 4) {
    fyStart = year;
  } else {
    fyStart = year - 1;
  }
  const fyEnd = fyStart + 1;
  const fyStr = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
  const mmStr = String(month).padStart(2, "0");

  const counter = getOrderIdCounter();
  const orderId = `${fyStr}/${mmStr}/${counter}`;
  saveOrderIdCounter(counter + 1);
  return orderId;
}

// --- Approval Logs ---
export function getApprovalLogs(): ApprovalLog[] {
  return load<ApprovalLog[]>(LS_APPROVAL_LOGS) ?? [];
}

export function saveApprovalLogs(logs: ApprovalLog[]): void {
  save(LS_APPROVAL_LOGS, logs);
}
