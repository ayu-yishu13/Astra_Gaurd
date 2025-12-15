// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const defaultSettings = {
  theme: "Cyber Blue",
  autoRefresh: true,
  soundAlerts: true,
  aiSensitivity: 70,
  responseMode: "Semi-Auto",
  ipConfig: "127.0.0.1",
  portConfig: "5000",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsUnsub, setSettingsUnsub] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthLoading(true);
      if (u) {
        setUser(u);
        // load settings from Firestore
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // create default settings for new user
          await setDoc(docRef, {
            settings: defaultSettings,
            createdAt: serverTimestamp(),
          });
          setSettings(defaultSettings);
        } else {
          const d = docSnap.data();
          setSettings(d.settings || defaultSettings);
        }
        // real-time listener — updates settings in UI when changed elsewhere
        const unsubSettings = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.settings) setSettings(data.settings);
          }
        });
        setSettingsUnsub(() => unsubSettings);
      } else {
        // user logged out
        setUser(null);
        setSettings(defaultSettings);
        if (settingsUnsub) settingsUnsub();
      }
      setAuthLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line
  }, []);

  // register
  async function register(email, password, displayName) {
    const creds = await createUserWithEmailAndPassword(auth, email, password);
    // optional: set displayName
    if (displayName) {
      try {
        await updateProfile(creds.user, { displayName });
      } catch (e) {
        console.warn("Update profile failed:", e);
      }
    }
    // send verification (optional)
    try {
      await sendEmailVerification(creds.user);
      toast.success("Verification email sent (check inbox).");
    } catch {}
    return creds.user;
  }

  // login
  async function login(email, password) {
    const creds = await signInWithEmailAndPassword(auth, email, password);
    return creds.user;
  }

  // logout
  async function logout() {
    if (settingsUnsub) settingsUnsub();
    await signOut(auth);
  }

  // Save settings to Firestore for current user
  async function saveSettings(newSettings) {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, { settings: newSettings }, { merge: true });
    setSettings(newSettings);
    toast.success("Settings synced to cloud");
  }

  const value = {
    user,
    authLoading,
    settings,
    setSettings,
    saveSettings,
    register,
    login,
    logout,
  };


  // 🟢 Apply theme globally whenever settings.theme changes
useEffect(() => {
  if (!settings?.theme) return;

  const body = document.body;
  body.classList.remove("theme-cyber", "theme-crimson", "theme-emerald", "theme-default");

  switch (settings.theme) {
    case "Cyber Blue":
      body.classList.add("theme-cyber");
      break;
    case "Crimson Dark":
      body.classList.add("theme-crimson");
      break;
    case "Emerald Matrix":
      body.classList.add("theme-emerald");
      break;
    default:
      body.classList.add("theme-default");
  }
}, [settings.theme]);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
