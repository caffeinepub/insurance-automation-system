import { Download, X } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallAppBanner() {
  const { canInstall, dismissed, triggerInstall, dismiss } = useInstallPrompt();

  if (!canInstall || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "130px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        background: "#0f4c35",
        color: "#fff",
        borderRadius: "14px",
        boxShadow: "0 4px 28px rgba(0,0,0,0.3)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        minWidth: "300px",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Download size={18} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
          Install this app
        </div>
        <div style={{ fontSize: "12px", opacity: 0.85 }}>
          For a better experience, install on your device.
        </div>
      </div>
      <button
        type="button"
        onClick={triggerInstall}
        style={{
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.6)",
          padding: "4px",
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
