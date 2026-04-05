import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "./context/AppContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

function AppInner() {
  const { currentUser } = useApp();
  return (
    <>
      {currentUser ? <DashboardPage /> : <LoginPage />}
      <Toaster position="bottom-right" richColors />
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
