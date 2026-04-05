import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExternalLink, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";

interface LeadDetailPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

type YesNoNull = "yes" | "no" | "";

function boolToYesNo(val: boolean | null): YesNoNull {
  if (val === null) return "";
  return val ? "yes" : "no";
}

function yesNoToBool(val: YesNoNull): boolean | null {
  if (val === "") return null;
  return val === "yes";
}

export default function LeadDetailPanel({
  lead,
  isOpen,
  onClose,
}: LeadDetailPanelProps) {
  const { updateLead, addToast } = useApp();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [claim, setClaim] = useState<YesNoNull>("");
  const [ncb, setNcb] = useState("");
  const [ownerChange, setOwnerChange] = useState<YesNoNull>("");
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    if (lead) {
      setName(lead.name ?? "");
      setMobile(lead.mobileNumber);
      setClaim(boolToYesNo(lead.claim));
      setNcb(lead.ncb.toString());
      setOwnerChange(boolToYesNo(lead.ownerChange));
      setPaymentLink(lead.paymentLink);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    const ncbNum = Number.parseFloat(ncb);
    updateLead(lead.id, {
      name,
      mobileNumber: mobile,
      claim: yesNoToBool(claim),
      ncb: Number.isNaN(ncbNum) ? 0 : ncbNum,
      ownerChange: yesNoToBool(ownerChange),
      paymentLink,
    });
    addToast("success", "Lead details saved.");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            Lead Details
          </SheetTitle>
          <p className="text-xs text-gray-400">
            ID: {lead.id} &bull; Created{" "}
            {new Date(lead.createdAt).toLocaleDateString("en-IN")}
          </p>
        </SheetHeader>

        <div className="space-y-5">
          {/* Mobile */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-mobile"
              className="text-sm font-medium text-gray-700"
            >
              <Phone className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Mobile
            </Label>
            <Input
              id="detail-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="font-mono"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-name"
              className="text-sm font-medium text-gray-700"
            >
              <User className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Name
            </Label>
            <Input
              id="detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
            />
          </div>

          {/* Claim */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Claim</Label>
            <div className="flex gap-2">
              {(["yes", "no", ""] as YesNoNull[]).map((opt) => (
                <button
                  key={opt === "" ? "na" : opt}
                  type="button"
                  onClick={() => setClaim(opt)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    claim === opt
                      ? opt === "yes"
                        ? "bg-green-600 border-green-600 text-white"
                        : opt === "no"
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-gray-200 border-gray-300 text-gray-700"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt === "" ? "N/A" : opt === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* NCB % */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-ncb"
              className="text-sm font-medium text-gray-700"
            >
              NCB %
            </Label>
            <div className="relative">
              <Input
                id="detail-ncb"
                type="number"
                min={0}
                max={100}
                value={ncb}
                onChange={(e) => setNcb(e.target.value)}
                placeholder="0"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Owner Change */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Owner Change
            </Label>
            <div className="flex gap-2">
              {(["yes", "no", ""] as YesNoNull[]).map((opt) => (
                <button
                  key={opt === "" ? "na" : opt}
                  type="button"
                  onClick={() => setOwnerChange(opt)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    ownerChange === opt
                      ? opt === "yes"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : opt === "no"
                          ? "bg-gray-600 border-gray-600 text-white"
                          : "bg-gray-200 border-gray-300 text-gray-700"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt === "" ? "N/A" : opt === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Link */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-payment"
              className="text-sm font-medium text-gray-700"
            >
              <ExternalLink className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Payment Link
            </Label>
            <Input
              id="detail-payment"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="https://pay.example.com/link/..."
            />
            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open link
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
