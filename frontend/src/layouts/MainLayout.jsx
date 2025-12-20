// src/layouts/MainLayout.jsx
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen text-slate-100 relative">

      {/* Sidebar (glass) */}
      <Sidebar />

      {/* Main content should NOT override background */}
      <main
        className="flex-1 overflow-auto p-6 relative z-10"
        style={{ background: "transparent" }}
      >
        {children}
      </main>

      {/* Transparent background carrier */}
      <div className="absolute inset-0 -z-10 pointer-events-none bg-transparent" />
    </div>
  );
}
