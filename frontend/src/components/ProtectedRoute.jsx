// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null; // or a spinner
  return user ? children : <Navigate to="/login" replace />;
}
