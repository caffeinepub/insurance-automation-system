import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Lead {
    paymentStatus: Status;
    pbStatus: Status;
    assignedAgent: AgentId;
    claimStatus: Status;
    policyStatus: Status;
    createdAt: Time;
    ncbPercent: bigint;
    mobileNumber: string;
    updatedAt: Time;
    kycStatus: Status;
    reminderCount: bigint;
    leadId: LeadId;
    rating: bigint;
    rcStatus: Status;
    quoteStatus: Status;
    ownerChange: boolean;
    premiumAmount: bigint;
}
export type UserId = Principal;
export type LeadId = bigint;
export type Time = bigint;
export type AgentId = Principal;
export interface User {
    principal: UserId;
    name: string;
    role: Role;
    email: string;
}
export enum Role {
    admin = "admin",
    agent = "agent"
}
export enum Status {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export interface backendInterface {
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
    assignLead(leadId: LeadId, agentId: AgentId): Promise<void>;
    createLead(mobileNumber: string): Promise<LeadId>;
    createUser(principal: UserId, email: string, role: Role, name: string): Promise<void>;
    getAllLeads(): Promise<Array<Lead>>;
    getLead(leadId: LeadId): Promise<Lead>;
    getLeadsByAgent(agentId: AgentId): Promise<Array<Lead>>;
    getUser(principal: UserId): Promise<User>;
    updateLead(leadId: LeadId, lead: Lead): Promise<void>;
    updateLeadStatus(leadId: LeadId, status: Status): Promise<void>;
}
