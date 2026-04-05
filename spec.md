# PB Insurance AI by Prashant – New Lead Full Form

## Current State
- App is 100% client-side React/TypeScript with no backend.
- Leads are stored in-memory in AppContext (useState with SEED_LEADS).
- "New Lead" button currently opens a minimal dialog (admin picks agent) then calls `addLead()` which creates a blank lead with only mobileNumber and assignedAgent set. The user then edits the lead in LeadDetailPage.
- Lead type has: name, mobileNumber, claim (bool|null), ncb, ownerChange (bool|null), docsUploaded (rcFront/rcBack/oldPolicy flags), kycData (pan, aadhaar, etc.), but NO email, NO actual file storage/URLs, NO PAN upload URL, NO aadhaar image URLs.
- There is no multi-step form, no image upload preview, no progress indicator.

## Requested Changes (Diff)

### Add
- `NewLeadFullForm` component: a full-screen multi-step modal/page (3 steps) with progress indicator.
  - Step 1: Basic Details (Full Name text, Mobile Number required, Email ID optional) + Insurance Details (Last Year Claim Yes/No dropdown, NCB % dropdown 0/20/25/35/45/50) + Owner Change (Yes/No).
  - Step 2: Vehicle Details (RC Front Image Upload required, RC Back Image Upload required) + Insurance Details continued (Old Policy Upload optional).
  - Step 3: KYC Documents (PAN Card Upload required, Aadhaar Front Upload required, Aadhaar Back Upload required).
- Image upload fields: each shows a file picker, on select shows an inline thumbnail preview of the chosen image (using object URLs – client-side only, no real server storage since app is browser-only).
- Validation: Mobile required, RC Front required, RC Back required, PAN required, Aadhaar Front required, Aadhaar Back required. Show inline error messages on failed step advance.
- "Save Lead" button on step 3: creates the lead in AppContext with all fields populated (name, mobile, email, claim, ncb, ownerChange, docsUploaded flags, kycData fields mapped from uploads, plus stores preview URL strings in new Lead fields).
- After save: show toast "Lead + Documents Saved Successfully", then switch to LeadDetailPage for the new lead.
- Lead type extended with: `email?: string`, `rcFrontUrl?: string`, `rcBackUrl?: string`, `oldPolicyUrl?: string`, `panUrl?: string`, `aadhaarFrontUrl?: string`, `aadhaarBackUrl?: string`.
- New `addLeadFull(data)` function in AppContext that accepts the fully-populated lead data and returns the new lead ID.

### Modify
- `AppContext`: Add `addLeadFull` function. Extend `createDefaultLead` to accept and preserve new document URL fields.
- `types/index.ts` (embedded in App.tsx): Add `email?`, `rcFrontUrl?`, `rcBackUrl?`, `oldPolicyUrl?`, `panUrl?`, `aadhaarFrontUrl?`, `aadhaarBackUrl?` to the Lead interface.
- `DashboardPage`: Replace the old minimal "New Lead" dialog flow with opening the `NewLeadFullForm`. After form save, show the lead detail page for the created lead. Keep agent-assignment logic: admin can pick agent in the form, agents auto-assign to themselves.
- `LeadDetailPage`: In the documents section, show image thumbnails/previews for uploaded docs (rcFrontUrl, rcBackUrl, oldPolicyUrl, panUrl, aadhaarFrontUrl, aadhaarBackUrl) if present.

### Remove
- The old minimal "Assign New Lead" dialog (`showNewLeadDialog` state + Dialog in DashboardPage) – replaced by the full form.

## Implementation Plan
1. Extend Lead interface with email and document URL fields (`src/frontend/src/types.ts` or inline in App.tsx).
2. Update `createDefaultLead` and `AppContext` to add `addLeadFull(data: Partial<Lead> & { assignedAgent: string }) => string`.
3. Create `src/frontend/src/components/NewLeadFullForm.tsx`:
   - 3-step wizard with progress bar (Step 1/3, 2/3, 3/3).
   - Step 1: Basic + Insurance + Owner Change fields.
   - Step 2: RC Front/Back + Old Policy file pickers with thumbnail preview.
   - Step 3: PAN + Aadhaar Front + Aadhaar Back file pickers with thumbnail preview.
   - Validation before advancing steps.
   - "Save Lead" on step 3 calls addLeadFull, shows toast, then calls onSave(newLeadId).
   - For Admin: agent selector dropdown at top of step 1.
   - File previews use URL.createObjectURL() for instant in-browser preview.
4. Update `DashboardPage`: replace old new-lead dialog with `<NewLeadFullForm>` rendered as a full-screen overlay. onSave(id) navigates to lead detail.
5. Update `LeadDetailPage`: add document preview section showing uploaded image thumbnails if URL fields are present.
