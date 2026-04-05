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
}

export interface LeadDocuments {
  rcFrontData: string | null; // data URL (PDF or image)
  rcBackData: string | null;
  oldPolicyData: string | null;
  panCardData: string | null;
  aadhaarFrontData: string | null;
  aadhaarBackData: string | null;
  // File type metadata
  rcFrontType: string | null;
  rcBackType: string | null;
  oldPolicyType: string | null;
  panCardType: string | null;
  aadhaarFrontType: string | null;
  aadhaarBackType: string | null;
}

export interface Lead {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  assignedAgent: string;
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
  documents: LeadDocuments;
  createdAt: string;
  // Business tracking fields (set when status = Completed)
  policyAmount: number;
  commissionPercent: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
