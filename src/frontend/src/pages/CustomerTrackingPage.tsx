import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Phone,
  Search,
  Shield,
} from "lucide-react";
import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";

interface CustomerTrackingPageProps {
  onBack: () => void;
}

function downloadPolicy(lead: Lead) {
  const issuedDate = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const policyAmountStr = lead.policyAmount
    ? `Rs.${lead.policyAmount.toLocaleString("en-IN")}`
    : "N/A";

  const content = [
    "================================================",
    "           INSURANCE POLICY DOCUMENT            ",
    "================================================",
    "",
    `Policy Number   : ${lead.policyNumber || "N/A"}`,
    `Customer Name   : ${lead.name || "Unknown Customer"}`,
    `Mobile Number   : ${lead.mobileNumber}`,
    `Policy Status   : ${lead.workflowStatus}`,
    `Policy Amount   : ${policyAmountStr}`,
    `Issue Date      : ${issuedDate}`,
    "",
    "------------------------------------------------",
    "",
    "This is an auto-generated policy summary.",
    "For any queries, contact your insurance agent.",
    "",
    "Powered by InsureFlow - Insurance Automation",
    "================================================",
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `policy-${lead.policyNumber || lead.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CustomerTrackingPage({
  onBack,
}: CustomerTrackingPageProps) {
  const { leads } = useApp();
  const [mobile, setMobile] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundLead, setFoundLead] = useState<Lead | null | undefined>(
    undefined,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = mobile.replace(/\D/g, "");
    const match = leads.find(
      (l) => l.mobileNumber.replace(/\D/g, "") === normalized,
    );
    setFoundLead(match ?? null);
    setSearched(true);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(val);
    if (searched) {
      setSearched(false);
      setFoundLead(undefined);
    }
  };

  const isCompleted = foundLead?.workflowStatus === "Completed";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.13 0.015 255) 0%, oklch(0.2 0.02 262) 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            InsureFlow
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Insurance Automation System
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Track Your Policy
              </h2>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6 ml-12">
            Enter your registered mobile number to check your policy status.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="mobile"
                className="text-sm font-medium text-gray-700"
              >
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={handleMobileChange}
                required
                maxLength={10}
                pattern="[0-9]{10}"
                className="h-11"
                data-ocid="tracking.input"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm"
              disabled={mobile.length !== 10}
              data-ocid="tracking.submit_button"
            >
              <Search className="w-4 h-4 mr-2" />
              Track Policy
            </Button>
          </form>

          {/* Results — not found */}
          {searched && foundLead === null && (
            <div
              className="mt-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-center"
              data-ocid="tracking.error_state"
            >
              <p className="text-sm font-semibold text-orange-800 mb-1">
                No Policy Found
              </p>
              <p className="text-xs text-orange-600 leading-relaxed">
                We couldn&apos;t find any policy linked to this mobile number.
                Please contact your insurance agent.
              </p>
            </div>
          )}

          {/* Results — found */}
          {searched && foundLead && (
            <div
              className="mt-6 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
              data-ocid="tracking.success_state"
            >
              {/* Card top */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-medium mb-0.5">
                      Policy Holder
                    </p>
                    <p className="text-white font-semibold text-lg leading-tight">
                      {foundLead.name || "Unknown Customer"}
                    </p>
                    <p className="text-blue-200 text-xs mt-0.5">
                      {foundLead.mobileNumber}
                    </p>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>

              {/* Card details */}
              <div className="px-5 py-4 space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Policy Status
                  </span>
                  <StatusBadge status={foundLead.workflowStatus} />
                </div>

                {/* Policy number */}
                {foundLead.policyNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Policy Number
                    </span>
                    <span className="text-xs font-mono text-gray-800 font-semibold">
                      {foundLead.policyNumber}
                    </span>
                  </div>
                )}

                {/* Policy Amount */}
                {isCompleted && foundLead.policyAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Policy Amount
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      Rs.{foundLead.policyAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {/* Payment link */}
                  {foundLead.paymentLink && (
                    <a
                      href={foundLead.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                      data-ocid="tracking.primary_button"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Pay Now
                    </a>
                  )}

                  {/* Download policy (only if Completed) */}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => downloadPolicy(foundLead)}
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                      data-ocid="tracking.secondary_button"
                    >
                      <Download className="w-4 h-4" />
                      Download Policy
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              data-ocid="tracking.link"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
