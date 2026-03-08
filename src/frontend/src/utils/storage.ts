import type {
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
  DEFAULT_STAGES,
  LEAD_SOURCES,
  LS_DAYLOGS,
  LS_FOLLOWUPS,
  LS_FVRS,
  LS_LEADS,
  LS_NOTES,
  LS_ORDER_ID_REQUESTS,
  LS_SALE_ORDERS,
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

// --- Seeding ---
export function seedData(): void {
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
    };
    const hodUser: User = {
      id: "user-hod-1",
      username: "rahul.hod",
      passwordHash: btoa("hod@12345"),
      name: "Rahul Kumar",
      email: "rahul@company.com",
      role: "HOD",
      createdAt: new Date().toISOString(),
    };
    const fseUser1: User = {
      id: "user-fse-1",
      username: "priya.fse",
      passwordHash: btoa("fse@12345"),
      name: "Priya Sharma",
      email: "priya@company.com",
      role: "FSE",
      createdAt: new Date().toISOString(),
    };
    const fseUser2: User = {
      id: "user-fse-2",
      username: "amit.fse",
      passwordHash: btoa("fse@12345"),
      name: "Amit Patel",
      email: "amit@company.com",
      role: "FSE",
      createdAt: new Date().toISOString(),
    };
    const tcUser: User = {
      id: "user-tc-1",
      username: "neha.tc",
      passwordHash: btoa("tc@12345"),
      name: "Neha Tele",
      email: "neha@company.com",
      role: "TeleCaller",
      createdAt: new Date().toISOString(),
    };
    const thodUser: User = {
      id: "user-thod-1",
      username: "suresh.thod",
      passwordHash: btoa("thod@12345"),
      name: "Suresh THOD",
      email: "suresh@company.com",
      role: "THOD",
      createdAt: new Date().toISOString(),
    };
    const boUser: User = {
      id: "user-bo-1",
      username: "bo.user",
      passwordHash: btoa("bo@12345"),
      name: "Business Officer",
      email: "bo@company.com",
      role: "BO",
      createdAt: new Date().toISOString(),
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
