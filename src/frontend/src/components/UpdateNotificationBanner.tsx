import { RefreshCw } from "lucide-react";
import { useServiceWorkerUpdate } from "../hooks/useServiceWorkerUpdate";

export default function UpdateNotificationBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "#1e3a5f",
        color: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minWidth: "280px",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "2px" }}>
          New update available
        </div>
        <div style={{ fontSize: "13px", opacity: 0.85 }}>
          Please refresh to get the latest version.
        </div>
      </div>
      <button
        type="button"
        onClick={applyUpdate}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontWeight: 600,
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
        }}
      >
        <RefreshCw size={15} />
        Refresh
      </button>
    </div>
  );
}
