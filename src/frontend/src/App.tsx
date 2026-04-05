import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import FloatingAIChat from "./components/FloatingAIChat";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import UpdateNotificationBanner from "./components/UpdateNotificationBanner";
import { AppProvider, useApp } from "./context/AppContext";
import CustomerTrackingPage from "./pages/CustomerTrackingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

type AppView = "main" | "customer-tracking";

function AppInner() {
  const { currentUser } = useApp();
  const [view, setView] = useState<AppView>("main");

  if (view === "customer-tracking") {
    return (
      <>
        <CustomerTrackingPage onBack={() => setView("main")} />
        <Toaster position="bottom-right" richColors />
        <UpdateNotificationBanner />
      </>
    );
  }

  return (
    <>
      {currentUser ? (
        <DashboardPage />
      ) : (
        <LoginPage onTrackPolicy={() => setView("customer-tracking")} />
      )}
      {currentUser && <FloatingAIChat />}
      <FloatingWhatsApp />
      <Toaster position="bottom-right" richColors />
      <UpdateNotificationBanner />
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
