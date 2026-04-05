import { Toaster } from "@/components/ui/sonner";
import React, { useEffect, useState } from "react";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import InstallAppBanner from "./components/InstallAppBanner";
import PriyaAssistant from "./components/PriyaAssistant";
import UpdateNotificationBanner from "./components/UpdateNotificationBanner";
import { AppProvider, useApp } from "./context/AppContext";
import AdminControlPanel from "./pages/AdminControlPanel";
import CustomerTrackingPage from "./pages/CustomerTrackingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

type AppView = "main" | "customer-tracking" | "admin-panel";

// ── App-Level Error Boundary ──────────────────────────────────────────────────
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("[AppErrorBoundary] caught:", error);
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 3000);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0e1a]">
          <div className="text-white text-center p-8">
            <div className="animate-spin w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xl font-semibold">
              System refreshing, please wait...
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Auto-recovering in 3 seconds
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Form Error Boundary ──────────────────────────────────────────────────────
export class FormErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("[FormErrorBoundary] caught:", error);
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 2000);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-white text-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg font-medium">Loading form...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const { currentUser } = useApp();
  const [view, setView] = useState<AppView>("main");

  // Global error handler for unhandled JS errors
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error("[App] unhandled error:", event.error);
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (view === "customer-tracking") {
    return (
      <>
        <CustomerTrackingPage onBack={() => setView("main")} />
        <Toaster position="bottom-right" richColors />
        <UpdateNotificationBanner />
        <InstallAppBanner />
      </>
    );
  }

  if (view === "admin-panel" && currentUser?.role === "admin") {
    return (
      <>
        <AdminControlPanel onBack={() => setView("main")} />
        <Toaster position="bottom-right" richColors />
        <UpdateNotificationBanner />
        <InstallAppBanner />
      </>
    );
  }

  return (
    <>
      {currentUser ? (
        <DashboardPage onAdminPanel={() => setView("admin-panel")} />
      ) : (
        <LoginPage onTrackPolicy={() => setView("customer-tracking")} />
      )}
      {/* Floating Priya: shown when outside dashboard (other pages) */}
      {currentUser && <PriyaAssistant />}
      <FloatingWhatsApp />
      <Toaster position="bottom-right" richColors />
      <UpdateNotificationBanner />
      <InstallAppBanner />
    </>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </AppErrorBoundary>
  );
}
