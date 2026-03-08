import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type {
  DayLocation,
  DayLog,
  FirstVisitReport,
  FollowUp,
  Lead,
  Note,
  OrderIdRequest,
  SaleOrder,
  Stage,
  User,
} from "../types/lms";
import {
  getDayLogs,
  getFVRs,
  getFollowUps,
  getLeads,
  getNotes,
  getOrderIdRequests,
  getSaleOrders,
  getStages,
  getUsers,
  saveDayLogs,
  saveFVRs,
  saveFollowUps,
  saveLeads,
  saveNotes,
  saveOrderIdRequests,
  saveSaleOrders,
  saveStages,
  saveUsers,
} from "../utils/storage";

interface LMSContextType {
  // Users
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt">) => User;
  updateUser: (
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
  ) => void;
  deleteUser: (id: string) => void;

  // Stages
  stages: Stage[];
  addStage: (stage: Omit<Stage, "id">) => Stage;
  updateStage: (id: string, updates: Partial<Omit<Stage, "id">>) => void;
  deleteStage: (id: string) => void;
  reorderStage: (id: string, direction: "up" | "down") => void;

  // Leads
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (
    id: string,
    updates: Partial<Omit<Lead, "id" | "createdAt">>,
  ) => void;
  deleteLead: (id: string) => void;
  assignLeadToHOD: (leadId: string, hodId: string | null) => void;
  assignLeadToFSE: (leadId: string, fseId: string | null) => void;

  // Notes
  notes: Note[];
  addNote: (leadId: string, text: string, authorId: string) => Note;
  getLeadNotes: (leadId: string) => Note[];

  // Follow-ups
  followUps: FollowUp[];
  addFollowUp: (data: Omit<FollowUp, "id" | "createdAt">) => FollowUp;
  updateFollowUp: (
    id: string,
    updates: Partial<Omit<FollowUp, "id" | "createdAt">>,
  ) => void;
  deleteFollowUp: (id: string) => void;
  getFSEFollowUps: (fseId: string) => FollowUp[];
  getLeadFollowUps: (leadId: string) => FollowUp[];

  // Day Logs
  dayLogs: DayLog[];
  startDay: (
    userId: string,
    role: DayLog["role"],
    location: DayLocation | null,
  ) => DayLog;
  endDay: (logId: string, location: DayLocation | null) => void;
  getTodayLog: (userId: string) => DayLog | undefined;
  getDayLogsForUser: (userId: string) => DayLog[];
  getDayLogsForDate: (date: string) => DayLog[];

  // First Visit Reports
  fvrs: FirstVisitReport[];
  addFVR: (
    data: Omit<FirstVisitReport, "id" | "createdAt">,
  ) => FirstVisitReport;
  getLeadFVRs: (leadId: string) => FirstVisitReport[];

  // Sale Orders
  saleOrders: SaleOrder[];
  addSaleOrder: (data: Omit<SaleOrder, "id" | "createdAt">) => SaleOrder;
  getLeadSaleOrders: (leadId: string) => SaleOrder[];

  // Order ID Requests
  orderIdRequests: OrderIdRequest[];
  addOrderIdRequest: (
    data: Omit<OrderIdRequest, "id" | "createdAt">,
  ) => OrderIdRequest;
  updateOrderIdRequest: (
    id: string,
    updates: Partial<Omit<OrderIdRequest, "id" | "createdAt">>,
  ) => void;
  getLeadOrderIdRequests: (leadId: string) => OrderIdRequest[];
  getPendingOrderIdRequests: () => OrderIdRequest[];
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export function LMSProvider({ children }: { children: ReactNode }) {
  const [users, setUsersState] = useState<User[]>(() => getUsers());
  const [stages, setStagesState] = useState<Stage[]>(() => getStages());
  const [leads, setLeadsState] = useState<Lead[]>(() => getLeads());
  const [notes, setNotesState] = useState<Note[]>(() => getNotes());
  const [followUps, setFollowUpsState] = useState<FollowUp[]>(() =>
    getFollowUps(),
  );
  const [dayLogs, setDayLogsState] = useState<DayLog[]>(() => getDayLogs());
  const [fvrs, setFVRsState] = useState<FirstVisitReport[]>(() => getFVRs());
  const [saleOrders, setSaleOrdersState] = useState<SaleOrder[]>(() =>
    getSaleOrders(),
  );
  const [orderIdRequests, setOrderIdRequestsState] = useState<OrderIdRequest[]>(
    () => getOrderIdRequests(),
  );

  // --- Sync helpers ---
  const setUsers = useCallback(
    (updater: User[] | ((prev: User[]) => User[])) => {
      setUsersState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveUsers(next);
        return next;
      });
    },
    [],
  );

  const setStages = useCallback(
    (updater: Stage[] | ((prev: Stage[]) => Stage[])) => {
      setStagesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveStages(next);
        return next;
      });
    },
    [],
  );

  const setLeads = useCallback(
    (updater: Lead[] | ((prev: Lead[]) => Lead[])) => {
      setLeadsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveLeads(next);
        return next;
      });
    },
    [],
  );

  const setNotes = useCallback(
    (updater: Note[] | ((prev: Note[]) => Note[])) => {
      setNotesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveNotes(next);
        return next;
      });
    },
    [],
  );

  const setFollowUps = useCallback(
    (updater: FollowUp[] | ((prev: FollowUp[]) => FollowUp[])) => {
      setFollowUpsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveFollowUps(next);
        return next;
      });
    },
    [],
  );

  const setDayLogs = useCallback(
    (updater: DayLog[] | ((prev: DayLog[]) => DayLog[])) => {
      setDayLogsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveDayLogs(next);
        return next;
      });
    },
    [],
  );

  const setFVRs = useCallback(
    (
      updater:
        | FirstVisitReport[]
        | ((prev: FirstVisitReport[]) => FirstVisitReport[]),
    ) => {
      setFVRsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveFVRs(next);
        return next;
      });
    },
    [],
  );

  const setSaleOrders = useCallback(
    (updater: SaleOrder[] | ((prev: SaleOrder[]) => SaleOrder[])) => {
      setSaleOrdersState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveSaleOrders(next);
        return next;
      });
    },
    [],
  );

  const setOrderIdRequests = useCallback(
    (
      updater:
        | OrderIdRequest[]
        | ((prev: OrderIdRequest[]) => OrderIdRequest[]),
    ) => {
      setOrderIdRequestsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveOrderIdRequests(next);
        return next;
      });
    },
    [],
  );

  // --- Users ---
  const addUser = useCallback(
    (user: Omit<User, "id" | "createdAt">): User => {
      const newUser: User = {
        ...user,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    },
    [setUsers],
  );

  const updateUser = useCallback(
    (id: string, updates: Partial<Omit<User, "id" | "createdAt">>) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      );
    },
    [setUsers],
  );

  const deleteUser = useCallback(
    (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    },
    [setUsers],
  );

  // --- Stages ---
  const addStage = useCallback(
    (stage: Omit<Stage, "id">): Stage => {
      const newStage: Stage = { ...stage, id: crypto.randomUUID() };
      setStages((prev) =>
        [...prev, newStage].sort((a, b) => a.order - b.order),
      );
      return newStage;
    },
    [setStages],
  );

  const updateStage = useCallback(
    (id: string, updates: Partial<Omit<Stage, "id">>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [setStages],
  );

  const deleteStage = useCallback(
    (id: string) => {
      setStages((prev) => prev.filter((s) => s.id !== id));
    },
    [setStages],
  );

  const reorderStage = useCallback(
    (id: string, direction: "up" | "down") => {
      setStages((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
        // Swap orders
        const tempOrder = sorted[idx].order;
        sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
        sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };
        return sorted;
      });
    },
    [setStages],
  );

  // --- Leads ---
  const addLead = useCallback(
    (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead => {
      const newLead: Lead = {
        ...lead,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLeads((prev) => [newLead, ...prev]);
      return newLead;
    },
    [setLeads],
  );

  const updateLead = useCallback(
    (id: string, updates: Partial<Omit<Lead, "id" | "createdAt">>) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, ...updates, updatedAt: new Date().toISOString() }
            : l,
        ),
      );
    },
    [setLeads],
  );

  const deleteLead = useCallback(
    (id: string) => {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setNotes((prev) => prev.filter((n) => n.leadId !== id));
      setFollowUps((prev) => prev.filter((f) => f.leadId !== id));
    },
    [setLeads, setNotes, setFollowUps],
  );

  const assignLeadToHOD = useCallback(
    (leadId: string, hodId: string | null) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                assignedToHOD: hodId,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      );
    },
    [setLeads],
  );

  const assignLeadToFSE = useCallback(
    (leadId: string, fseId: string | null) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                assignedToFSE: fseId,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      );
    },
    [setLeads],
  );

  // --- Notes ---
  const addNote = useCallback(
    (leadId: string, text: string, authorId: string): Note => {
      const newNote: Note = {
        id: crypto.randomUUID(),
        leadId,
        text,
        authorId,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    },
    [setNotes],
  );

  const getLeadNotes = useCallback(
    (leadId: string): Note[] => {
      return notes
        .filter((n) => n.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    [notes],
  );

  // --- Follow-ups ---
  const addFollowUp = useCallback(
    (data: Omit<FollowUp, "id" | "createdAt">): FollowUp => {
      const newFollowUp: FollowUp = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setFollowUps((prev) => [...prev, newFollowUp]);
      return newFollowUp;
    },
    [setFollowUps],
  );

  const updateFollowUp = useCallback(
    (id: string, updates: Partial<Omit<FollowUp, "id" | "createdAt">>) => {
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      );
    },
    [setFollowUps],
  );

  const deleteFollowUp = useCallback(
    (id: string) => {
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
    },
    [setFollowUps],
  );

  const getFSEFollowUps = useCallback(
    (fseId: string): FollowUp[] => {
      return followUps
        .filter((f) => f.assignedTo === fseId)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        );
    },
    [followUps],
  );

  const getLeadFollowUps = useCallback(
    (leadId: string): FollowUp[] => {
      return followUps
        .filter((f) => f.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        );
    },
    [followUps],
  );

  // --- Day Logs ---
  const startDay = useCallback(
    (
      userId: string,
      role: DayLog["role"],
      location: DayLocation | null,
    ): DayLog => {
      const newLog: DayLog = {
        id: crypto.randomUUID(),
        userId,
        role,
        date: new Date().toISOString().slice(0, 10),
        dayStartTime: new Date().toISOString(),
        dayStartLocation: location,
        dayEndTime: null,
        dayEndLocation: null,
        createdAt: new Date().toISOString(),
      };
      setDayLogs((prev) => [newLog, ...prev]);
      return newLog;
    },
    [setDayLogs],
  );

  const endDay = useCallback(
    (logId: string, location: DayLocation | null) => {
      setDayLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                dayEndTime: new Date().toISOString(),
                dayEndLocation: location,
              }
            : l,
        ),
      );
    },
    [setDayLogs],
  );

  const getTodayLog = useCallback(
    (userId: string): DayLog | undefined => {
      const today = new Date().toISOString().slice(0, 10);
      return dayLogs.find((l) => l.userId === userId && l.date === today);
    },
    [dayLogs],
  );

  const getDayLogsForUser = useCallback(
    (userId: string): DayLog[] => {
      return dayLogs
        .filter((l) => l.userId === userId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    },
    [dayLogs],
  );

  const getDayLogsForDate = useCallback(
    (date: string): DayLog[] => {
      return dayLogs.filter((l) => l.date === date);
    },
    [dayLogs],
  );

  // --- First Visit Reports ---
  const addFVR = useCallback(
    (data: Omit<FirstVisitReport, "id" | "createdAt">): FirstVisitReport => {
      const newFVR: FirstVisitReport = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setFVRs((prev) => [newFVR, ...prev]);
      return newFVR;
    },
    [setFVRs],
  );

  const getLeadFVRs = useCallback(
    (leadId: string): FirstVisitReport[] => {
      return fvrs
        .filter((f) => f.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    [fvrs],
  );

  // --- Sale Orders ---
  const addSaleOrder = useCallback(
    (data: Omit<SaleOrder, "id" | "createdAt">): SaleOrder => {
      const newOrder: SaleOrder = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setSaleOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    [setSaleOrders],
  );

  const getLeadSaleOrders = useCallback(
    (leadId: string): SaleOrder[] => {
      return saleOrders
        .filter((o) => o.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    [saleOrders],
  );

  // --- Order ID Requests ---
  const addOrderIdRequest = useCallback(
    (data: Omit<OrderIdRequest, "id" | "createdAt">): OrderIdRequest => {
      const newReq: OrderIdRequest = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setOrderIdRequests((prev) => [newReq, ...prev]);
      return newReq;
    },
    [setOrderIdRequests],
  );

  const updateOrderIdRequest = useCallback(
    (
      id: string,
      updates: Partial<Omit<OrderIdRequest, "id" | "createdAt">>,
    ) => {
      setOrderIdRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    },
    [setOrderIdRequests],
  );

  const getLeadOrderIdRequests = useCallback(
    (leadId: string): OrderIdRequest[] => {
      return orderIdRequests
        .filter((r) => r.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    [orderIdRequests],
  );

  const getPendingOrderIdRequests = useCallback((): OrderIdRequest[] => {
    return orderIdRequests
      .filter((r) => r.allChecked && r.status === "pending")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orderIdRequests]);

  const value: LMSContextType = {
    users,
    addUser,
    updateUser,
    deleteUser,
    stages,
    addStage,
    updateStage,
    deleteStage,
    reorderStage,
    leads,
    addLead,
    updateLead,
    deleteLead,
    assignLeadToHOD,
    assignLeadToFSE,
    notes,
    addNote,
    getLeadNotes,
    followUps,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    getFSEFollowUps,
    getLeadFollowUps,
    dayLogs,
    startDay,
    endDay,
    getTodayLog,
    getDayLogsForUser,
    getDayLogsForDate,
    fvrs,
    addFVR,
    getLeadFVRs,
    saleOrders,
    addSaleOrder,
    getLeadSaleOrders,
    orderIdRequests,
    addOrderIdRequest,
    updateOrderIdRequest,
    getLeadOrderIdRequests,
    getPendingOrderIdRequests,
  };

  return <LMSContext.Provider value={value}>{children}</LMSContext.Provider>;
}

export function useLMS() {
  const ctx = useContext(LMSContext);
  if (!ctx) throw new Error("useLMS must be used within LMSProvider");
  return ctx;
}
