import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  MessageCircle,
  Phone,
  Shield,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import { AGENTS, useApp } from "../context/AppContext";

interface WhatsAppLeadModalProps {
  isAdmin: boolean;
  onClose: () => void;
  onLeadCreated: (leadId: string) => void;
}

export default function WhatsAppLeadModal({
  isAdmin,
  onClose,
  onLeadCreated,
}: WhatsAppLeadModalProps) {
  const { addLeadFull, addToast } = useApp();
  const [message, setMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]?.email ?? "");
  const [parseResult, setParseResult] = useState<{
    mobile?: string;
    isInsurance?: boolean;
    error?: string;
    parsed: boolean;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  const handleParse = () => {
    if (!message.trim()) return;
    const mobileMatch = message.match(/[6-9]\d{9}/);
    const insuranceKeywords =
      /insurance|policy|rc|vehicle|car|bike|renew|motor/i;
    const isInsurance = insuranceKeywords.test(message);
    setParseResult({
      mobile: mobileMatch ? mobileMatch[0] : undefined,
      isInsurance,
      error: !mobileMatch
        ? "No 10-digit Indian mobile number found"
        : undefined,
      parsed: true,
    });
  };

  const handleCreate = () => {
    if (!parseResult?.mobile) return;
    setCreating(true);
    try {
      const newId = addLeadFull({
        mobileNumber: parseResult.mobile,
        assignedAgent: isAdmin
          ? selectedAgent
          : (AGENTS[0]?.email ?? "agent1@insurance.com"),
        name: "",
      });
      addToast("success", `Lead created for ${parseResult.mobile}`);
      onLeadCreated(newId);
    } catch {
      addToast("error", "Failed to create lead");
    } finally {
      setCreating(false);
    }
  };

  // Sample quick-paste messages for testing
  const sampleMessages = [
    "Hi, I need car insurance renewal. My number is 9876543211",
    "Need bike policy for my vehicle RC number. Call 8123456789",
    "Motor insurance query, 7012345678",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      data-ocid="whatsapp_lead.modal"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 mb-0 md:mb-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#075e54] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Create Lead from WhatsApp</h2>
              <p className="text-xs text-white/70">
                Paste a customer message to auto-extract details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            data-ocid="whatsapp_lead.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick sample messages */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">
              Quick test messages:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sampleMessages.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => setMessage(msg)}
                  className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 hover:bg-green-100 transition-colors truncate max-w-[200px]"
                >
                  {msg.substring(0, 40)}&#8230;
                </button>
              ))}
            </div>
          </div>

          {/* Paste area */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Paste WhatsApp Message
            </Label>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setParseResult(null);
              }}
              placeholder={
                "Paste the WhatsApp message here\u2026\nExample: Hi, I need to renew my car insurance. My mobile is 9876543210"
              }
              className="min-h-[100px] text-sm resize-none"
              data-ocid="whatsapp_lead.textarea"
            />
          </div>

          {/* Parse button */}
          <Button
            type="button"
            onClick={handleParse}
            disabled={!message.trim()}
            className="w-full bg-[#075e54] hover:bg-[#064e46] text-white"
            data-ocid="whatsapp_lead.parse_button"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Parse &amp; Extract
          </Button>

          {/* Parse Result */}
          {parseResult?.parsed && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Extracted Info
              </p>

              {/* Mobile */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    parseResult.mobile ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <Phone
                    className={`w-4 h-4 ${parseResult.mobile ? "text-green-600" : "text-red-500"}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mobile Number</p>
                  {parseResult.mobile ? (
                    <p className="text-sm font-bold text-gray-900">
                      {parseResult.mobile}
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">
                      Not found &#8212; {parseResult.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Insurance detection */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    parseResult.isInsurance ? "bg-blue-100" : "bg-yellow-100"
                  }`}
                >
                  {parseResult.isInsurance ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Insurance Related</p>
                  <Badge
                    variant={parseResult.isInsurance ? "default" : "secondary"}
                    className={`text-xs ${
                      parseResult.isInsurance
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {parseResult.isInsurance
                      ? "\u2713 Detected"
                      : "Not detected"}
                  </Badge>
                </div>
              </div>

              {/* Agent selector (admin only) */}
              {isAdmin && parseResult.mobile && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium">
                    Assign to Agent
                  </p>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#075e54]/30 bg-white"
                    data-ocid="whatsapp_lead.select"
                  >
                    {AGENTS.map((a) => (
                      <option key={a.email} value={a.email}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Create button */}
              {parseResult.mobile && (
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-ocid="whatsapp_lead.submit_button"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {creating ? "Creating..." : "Create Lead"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
