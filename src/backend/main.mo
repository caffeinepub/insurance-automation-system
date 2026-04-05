import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

actor {
  type LeadId = Nat;
  type UserId = Principal;
  type AgentId = Principal;

  type Status = { #pending; #inProgress; #completed };

  type Lead = {
    leadId : LeadId;
    mobileNumber : Text;
    assignedAgent : AgentId;
    rcStatus : Status;
    claimStatus : Status;
    ncbPercent : Nat;
    ownerChange : Bool;
    quoteStatus : Status;
    kycStatus : Status;
    paymentStatus : Status;
    policyStatus : Status;
    pbStatus : Status;
    premiumAmount : Nat;
    rating : Nat;
    reminderCount : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Role = { #admin; #agent };

  type User = {
    principal : UserId;
    email : Text;
    role : Role;
    name : Text;
  };

  module Lead {
    public func compare(lead1 : Lead, lead2 : Lead) : Order.Order {
      Nat.compare(lead1.leadId, lead2.leadId);
    };
  };

  var nextLeadId = 0;
  let leads = Map.empty<LeadId, Lead>();
  let users = Map.empty<UserId, User>();

  public shared ({ caller }) func createLead(mobileNumber : Text) : async LeadId {
    let leadId = nextLeadId;
    nextLeadId += 1;

    let newLead = {
      leadId;
      mobileNumber;
      assignedAgent = caller;
      rcStatus = #pending;
      claimStatus = #pending;
      ncbPercent = 0;
      ownerChange = false;
      quoteStatus = #pending;
      kycStatus = #pending;
      paymentStatus = #pending;
      policyStatus = #pending;
      pbStatus = #pending;
      premiumAmount = 0;
      rating = 0;
      reminderCount = 0;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    leads.add(leadId, newLead);
    leadId;
  };

  public shared ({ caller }) func updateLead(leadId : LeadId, lead : Lead) : async () {
    if (not leads.containsKey(leadId)) { Runtime.trap("Lead not found") };
    leads.add(leadId, { lead with updatedAt = Time.now() });
  };

  public query ({ caller }) func getLead(leadId : LeadId) : async Lead {
    switch (leads.get(leadId)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) { lead };
    };
  };

  public query ({ caller }) func getAllLeads() : async [Lead] {
    leads.values().toArray().sort();
  };

  public query ({ caller }) func getLeadsByAgent(agentId : AgentId) : async [Lead] {
    leads.values().toArray().filter(func(lead) { lead.assignedAgent == agentId });
  };

  public shared ({ caller }) func createUser(principal : UserId, email : Text, role : Role, name : Text) : async () {
    if (users.containsKey(principal)) { Runtime.trap("User already exists") };
    let user = {
      principal;
      email;
      role;
      name;
    };
    users.add(principal, user);
  };

  public query ({ caller }) func getUser(principal : UserId) : async User {
    switch (users.get(principal)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  public shared ({ caller }) func assignLead(leadId : LeadId, agentId : AgentId) : async () {
    switch (leads.get(leadId)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) {
        let updatedLead = { lead with assignedAgent = agentId; updatedAt = Time.now() };
        leads.add(leadId, updatedLead);
      };
    };
  };

  public shared ({ caller }) func updateLeadStatus(leadId : LeadId, status : Status) : async () {
    switch (leads.get(leadId)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) {
        let updatedLead = { lead with rcStatus = status; updatedAt = Time.now() };
        leads.add(leadId, updatedLead);
      };
    };
  };
};
