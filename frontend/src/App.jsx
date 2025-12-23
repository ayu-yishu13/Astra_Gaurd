import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { LiveDataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react"; // Import Menu icon for mobile

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
  const [isMobileOpen, setIsMobileOpen] = useState(false); // New state for mobile toggle

  const localOnlyRoutes = ["/livetraffic", "/system", "/traffic"];
  const isProtectedFeature = localOnlyRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen text-slate-100 relative bg-transparent overflow-x-hidden">
      <ConstellationBackground />

      {!hideSidebar && (
        <>
          {/* Sidebar now receives mobile state props */}
          <Sidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            isMobileOpen={isMobileOpen} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          
          {/* MOBILE HAMBURGER BUTTON (Visible only on mobile) */}
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-[40] p-2 bg-[#0b1120] border border-cyan-500/30 rounded-lg text-cyan-400 shadow-lg"
          >
            <Menu size={24} />
          </button>
        </>
      )}

      <main
        className={`flex-1 overflow-y-auto p-4 md:p-6 min-h-0 transition-all duration-300
          /* On mobile: 0 margin. On desktop: match sidebar width */
          ml-0 ${!hideSidebar ? (collapsed ? "lg:ml-20" : "lg:ml-64") : "ml-0"}
        `}
      >
        {/* Top Spacer for Mobile (Prevents content from being hidden under hamburger) */}
        {!hideSidebar && <div className="h-12 lg:hidden" />}

        <FeatureGuard requireLocal={isProtectedFeature}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/livetraffic" element={<ProtectedRoute><MainLayout><LiveTraffic /></MainLayout></ProtectedRoute>} />
            <Route path="/flow" element={<ProtectedRoute><MainLayout><FlowPage /></MainLayout></ProtectedRoute>} />
            <Route path="/system" element={<ProtectedRoute><MainLayout><SystemPage /></MainLayout></ProtectedRoute>} />
            <Route path="/traffic" element={<ProtectedRoute><MainLayout><TrafficPage /></MainLayout></ProtectedRoute>} />
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