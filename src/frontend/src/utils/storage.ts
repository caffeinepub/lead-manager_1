import type { FollowUp, Lead, Note, Session, Stage, User } from "../types/lms";
import {
  DEFAULT_STAGES,
  LEAD_SOURCES,
  LS_FOLLOWUPS,
  LS_LEADS,
  LS_NOTES,
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
    save(LS_USERS, [adminUser, hodUser, fseUser1, fseUser2]);
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
        title: "Enterprise Software Deal",
        name: "Sunita Mehta",
        email: "sunita@techcorp.in",
        phone: "+91 98765 43210",
        company: "TechCorp India",
        source: LEAD_SOURCES[0],
        stageId: "stage-3",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        createdAt: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-2",
        title: "Cloud Migration Project",
        name: "Rajesh Verma",
        email: "rajesh@globalventures.com",
        phone: "+91 87654 32109",
        company: "Global Ventures Ltd",
        source: LEAD_SOURCES[1],
        stageId: "stage-4",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        createdAt: new Date(
          Date.now() - 22 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-3",
        title: "Digital Transformation Initiative",
        name: "Deepika Singh",
        email: "deepika@blueprintco.in",
        phone: "+91 76543 21098",
        company: "Blueprint Solutions",
        source: LEAD_SOURCES[2],
        stageId: "stage-2",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "lead-4",
        title: "ERP Implementation",
        name: "Vikram Nair",
        email: "vikram@skyreach.com",
        phone: "+91 65432 10987",
        company: "SkyReach Technologies",
        source: LEAD_SOURCES[3],
        stageId: "stage-1",
        assignedToHOD: null,
        assignedToFSE: null,
        createdBy: "user-admin-1",
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
