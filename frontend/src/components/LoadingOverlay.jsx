// src/components/LoadingOverlay.jsx
export default function LoadingOverlay({ show, message = "Processing..." }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-400 mb-3 mx-auto"></div>
        <p className="text-cyan-300 font-semibold">{message}</p>
      </div>
    </div>
  );
}
