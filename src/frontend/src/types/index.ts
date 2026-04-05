export type UserRole = "admin" | "agent";

export type WorkflowStatus =
  | "Docs Pending"
  | "Docs Received"
  | "Details Completed"
  | "Quotation Ready"
  | "PB Action Required"
  | "KYC Pending"
  | "KYC Completed"
  | "Payment Sent"
  | "Completed";

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  "Docs Pending",
  "Docs Received",
  "Details Completed",
  "Quotation Ready",
  "PB Action Required",
  "KYC Pending",
  "KYC Completed",
  "Payment Sent",
  "Completed",
];

export interface AppUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  whatsapp_number?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobileNumber: string;
  assignedAgent: string;
  agentId?: string; // mirrors assignedAgent email — used for agent mapping
  workflowStatus: WorkflowStatus;
  rcStatus: string;
  claim: boolean | null;
  ncb: number;
  ownerChange: boolean | null;
  detailsStatus: string;
  quoteStatus: string;
  quoteAmount: number;
  agentConfirmStatus: string;
  kycStatus: string;
  kycData: {
    pan: string;
    dob: string;
    aadhaar: string;
    panVerified: boolean;
    docsUploaded: boolean;
  };
  paymentStatus: string;
  paymentLink: string;
  reminderCount: number;
  policyStatus: string;
  policyNumber: string;
  pbStatus: string;
  rating: number | null;
  currentStep: number;
  docsUploaded: {
    rcFront: boolean;
    rcBack: boolean;
    oldPolicy: boolean;
  };
  createdAt: string;
  // Business tracking fields (set when status = Completed)
  policyAmount: number;
  commissionPercent: number;
  // Document upload URLs (object URLs, client-side only)
  email?: string;
  rcFrontUrl?: string;
  rcBackUrl?: string;
  oldPolicyUrl?: string;
  panUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
