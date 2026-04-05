import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import type { AppUser, Lead, ToastMessage, WorkflowStatus } from "../types";

export const AGENTS: AppUser[] = [
  {
    email: "agent1@insurance.com",
    password: "agent123",
    name: "Raj Kumar",
    role: "agent",
  },
  {
    email: "agent2@insurance.com",
    password: "agent234",
    name: "Priti Singh",
    role: "agent",
  },
  {
    email: "agent3@insurance.com",
    password: "agent345",
    name: "Anil Verma",
    role: "agent",
  },
];

const USERS: AppUser[] = [
  {
    email: "admin@insurance.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  ...AGENTS,
];

export function getAgentName(email: string): string {
  const found = USERS.find((u) => u.email === email);
  return found ? found.name : email;
}

function generateMobile(): string {
  const prefixes = ["6", "7", "8", "9"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return prefix + rest;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createDefaultLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: generateId(),
    name: "",
    mobileNumber: generateMobile(),
    assignedAgent: "agent1@insurance.com",
    workflowStatus: "Docs Pending",
    rcStatus: "Docs Pending",
    claim: null,
    ncb: 0,
    ownerChange: null,
    detailsStatus: "Details Pending",
    quoteStatus: "Quote Pending",
    quoteAmount: 0,
    agentConfirmStatus: "Pending",
    kycStatus: "KYC Pending",
    kycData: {
      pan: "",
      dob: "",
      aadhaar: "",
      panVerified: false,
      docsUploaded: false,
    },
    paymentStatus: "Payment Pending",
    paymentLink: "",
    reminderCount: 0,
    policyStatus: "Policy Pending",
    policyNumber: "",
    pbStatus: "Pending",
    rating: null,
    currentStep: 1,
    docsUploaded: { rcFront: false, rcBack: false, oldPolicy: false },
    createdAt: new Date().toISOString(),
    policyAmount: 0,
    commissionPercent: 0,
    ...overrides,
  };
}

const SEED_LEADS: Lead[] = [
  createDefaultLead({
    id: "lead001",
    name: "Priya Sharma",
    mobileNumber: "9876543210",
    assignedAgent: "agent1@insurance.com",
    workflowStatus: "Completed",
    rcStatus: "Docs Received",
    docsUploaded: { rcFront: true, rcBack: true, oldPolicy: false },
    claim: false,
    ncb: 20,
    ownerChange: false,
    detailsStatus: "Details Completed",
    quoteStatus: "Quote Ready",
    quoteAmount: 12500,
    agentConfirmStatus: "Confirmed",
    kycStatus: "KYC Completed",
    kycData: {
      pan: "ABCDE1234F",
      dob: "1985-06-15",
      aadhaar: "123456789012",
      panVerified: true,
      docsUploaded: true,
    },
    paymentStatus: "Payment Done",
    paymentLink: "https://pay.pbpartners.com/link/abc123",
    reminderCount: 2,
    policyStatus: "Completed",
    policyNumber: "POL-2024-001",
    pbStatus: "Active",
    rating: 5,
    currentStep: 10,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    policyAmount: 14500,
    commissionPercent: 15,
  }),
  createDefaultLead({
    id: "lead002",
    name: "Arjun Mehta",
    mobileNumber: "8765432109",
    assignedAgent: "agent2@insurance.com",
    workflowStatus: "KYC Pending",
    rcStatus: "Docs Received",
    docsUploaded: { rcFront: true, rcBack: true, oldPolicy: true },
    claim: true,
    ncb: 0,
    ownerChange: true,
    detailsStatus: "Details Completed",
    quoteStatus: "Quote Ready",
    quoteAmount: 18750,
    agentConfirmStatus: "Confirmed",
    kycStatus: "KYC In Progress",
    kycData: {
      pan: "PQRST5678G",
      dob: "1992-03-22",
      aadhaar: "",
      panVerified: true,
      docsUploaded: false,
    },
    paymentStatus: "Payment Pending",
    paymentLink: "",
    reminderCount: 0,
    policyStatus: "Policy Pending",
    policyNumber: "",
    pbStatus: "Pending",
    rating: null,
    currentStep: 5,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }),
  createDefaultLead({
    id: "lead003",
    name: "Sunita Patel",
    mobileNumber: "7654321098",
    assignedAgent: "agent1@insurance.com",
    workflowStatus: "Payment Sent",
    rcStatus: "Docs Received",
    docsUploaded: { rcFront: true, rcBack: true, oldPolicy: false },
    claim: false,
    ncb: 35,
    ownerChange: false,
    detailsStatus: "Details Completed",
    quoteStatus: "Quote Ready",
    quoteAmount: 9800,
    agentConfirmStatus: "Confirmed",
    kycStatus: "KYC Completed",
    kycData: {
      pan: "LMNOP9012H",
      dob: "1978-11-30",
      aadhaar: "987654321098",
      panVerified: true,
      docsUploaded: true,
    },
    paymentStatus: "Payment Sent",
    paymentLink: "https://pay.pbpartners.com/link/def456",
    reminderCount: 1,
    policyStatus: "Policy Pending",
    policyNumber: "",
    pbStatus: "Pending",
    rating: null,
    currentStep: 7,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }),
  createDefaultLead({
    id: "lead004",
    name: "Vikram Nair",
    mobileNumber: "9123456789",
    assignedAgent: "agent3@insurance.com",
    workflowStatus: "Completed",
    rcStatus: "Docs Received",
    docsUploaded: { rcFront: true, rcBack: true, oldPolicy: true },
    claim: false,
    ncb: 50,
    ownerChange: false,
    detailsStatus: "Details Completed",
    quoteStatus: "Quote Ready",
    quoteAmount: 22000,
    agentConfirmStatus: "Confirmed",
    kycStatus: "KYC Completed",
    kycData: {
      pan: "VWXYZ3456I",
      dob: "1990-07-08",
      aadhaar: "456789012345",
      panVerified: true,
      docsUploaded: true,
    },
    paymentStatus: "Payment Done",
    paymentLink: "https://pay.pbpartners.com/link/ghi789",
    reminderCount: 0,
    policyStatus: "Completed",
    policyNumber: "POL-2024-004",
    pbStatus: "Active",
    rating: 4,
    currentStep: 10,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    policyAmount: 24200,
    commissionPercent: 12,
  }),
  createDefaultLead({
    id: "lead005",
    name: "",
    mobileNumber: "8234567890",
    assignedAgent: "agent2@insurance.com",
    workflowStatus: "Docs Pending",
    rcStatus: "Docs Pending",
    docsUploaded: { rcFront: false, rcBack: false, oldPolicy: false },
    claim: null,
    ncb: 0,
    ownerChange: null,
    detailsStatus: "Details Pending",
    quoteStatus: "Quote Pending",
    quoteAmount: 0,
    agentConfirmStatus: "Pending",
    kycStatus: "KYC Pending",
    kycData: {
      pan: "",
      dob: "",
      aadhaar: "",
      panVerified: false,
      docsUploaded: false,
    },
    paymentStatus: "Payment Pending",
    paymentLink: "",
    reminderCount: 0,
    policyStatus: "Policy Pending",
    policyNumber: "",
    pbStatus: "Pending",
    rating: null,
    currentStep: 1,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  }),
  createDefaultLead({
    id: "lead006",
    name: "Divya Reddy",
    mobileNumber: "6345678901",
    assignedAgent: "agent3@insurance.com",
    workflowStatus: "Quotation Ready",
    rcStatus: "Docs Received",
    docsUploaded: { rcFront: true, rcBack: true, oldPolicy: false },
    claim: true,
    ncb: 25,
    ownerChange: false,
    detailsStatus: "Details Completed",
    quoteStatus: "Quote Pending",
    quoteAmount: 0,
    agentConfirmStatus: "Pending",
    kycStatus: "KYC Pending",
    kycData: {
      pan: "",
      dob: "",
      aadhaar: "",
      panVerified: false,
      docsUploaded: false,
    },
    paymentStatus: "Payment Pending",
    paymentLink: "",
    reminderCount: 0,
    policyStatus: "Policy Pending",
    policyNumber: "",
    pbStatus: "Pending",
    rating: null,
    currentStep: 3,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }),
];

interface AppContextType {
  currentUser: AppUser | null;
  leads: Lead[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addLead: (assignedAgent?: string) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const user = USERS.find(
      (u) => u.email === email && u.password === password,
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addLead = useCallback((assignedAgent?: string) => {
    const agent = assignedAgent ?? "agent1@insurance.com";
    const newLead = createDefaultLead({ assignedAgent: agent });
    setLeads((prev) => [newLead, ...prev]);
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        leads,
        login,
        logout,
        addLead,
        updateLead,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
