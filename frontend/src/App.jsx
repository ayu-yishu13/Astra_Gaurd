import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LiveDataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { useState } from "react";

// --- IMPORT THE GUARD ---
import FeatureGuard from "./components/FeatureGuard"; 

import AuthPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveTraffic from "./components/dashboard/LiveDashboard";
import FlowPage from "./pages/FlowPage";
import SettingsPage from "./pages/SettingsPage";
import InfoPage from "./pages/InfoPage";
import ThreatIntel from "./pages/ThreatIntel";
import Reports from "./pages/ReportsPage";
import TrafficPage from "./pages/TrafficPage";
import IncidentsPage from "./pages/IncidentsPage";
import SystemPage from "./pages/SystemPage";
import ResponsePage from "./pages/ResponsePage";
import MlmodelPage from "./pages/MLModelsPage";
import ConstellationBackground from "./components/ConstellationBackground";
import SamplePred from "./pages/MLAttackSamplesPage";
import Aichat from "./pages/ChatAssistant";
import MainLayout from "./components/MainLayout";

function AppLayout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";
  const [collapsed, setCollapsed] = useState(false);

  // 🛠️ DEFINE LOCAL-ONLY ROUTES HERE
  const localOnlyRoutes = ["/livetraffic", "/flow", "/system", "/traffic"];
  const isProtectedFeature = localOnlyRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen text-slate-100 relative bg-transparent">
      <ConstellationBackground />

      {!hideSidebar && (
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0 transition-all duration-300
          ${collapsed ? "ml-20" : "ml-64"}
        `}
      >
        {/* Wrap the Routes in the FeatureGuard. 
            It will only trigger the popup if the current path is in localOnlyRoutes 
            AND the user is not on localhost.
        */}
        <FeatureGuard requireLocal={isProtectedFeature}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            
            {/* These routes will now trigger the popup if deployed */}
            <Route path="/livetraffic" element={<ProtectedRoute><MainLayout><LiveTraffic /></MainLayout></ProtectedRoute>} />
            <Route path="/flow" element={<ProtectedRoute><MainLayout><FlowPage /></MainLayout></ProtectedRoute>} />
            <Route path="/system" element={<ProtectedRoute><MainLayout><SystemPage /></MainLayout></ProtectedRoute>} />
            <Route path="/traffic" element={<ProtectedRoute><MainLayout><TrafficPage /></MainLayout></ProtectedRoute>} />
            
            {/* These routes work fine in the cloud (Database/AI based) */}
            <Route path="/settings" element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><MainLayout><InfoPage /></MainLayout></ProtectedRoute>} />
            <Route path="/samplepred" element={<ProtectedRoute><MainLayout><SamplePred /></MainLayout></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><MainLayout><IncidentsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/threats" element={<ProtectedRoute><MainLayout><ThreatIntel /></MainLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
            <Route path="/response" element={<ProtectedRoute><MainLayout><ResponsePage /></MainLayout></ProtectedRoute>} />
            <Route path="/mlmodels" element={<ProtectedRoute><MainLayout><MlmodelPage /></MainLayout></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Aichat /></ProtectedRoute>} />
          </Routes>
        </FeatureGuard>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LiveDataProvider>
        <Router>
          <AppLayout />
        </Router>
      </LiveDataProvider>
    </AuthProvider>
  );
}