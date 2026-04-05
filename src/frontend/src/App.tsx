import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
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

function AppInner() {
  const { currentUser } = useApp();
  const [view, setView] = useState<AppView>("main");

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
      {/* Floating Priya: shown on non-dashboard views (other pages) */}
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
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
