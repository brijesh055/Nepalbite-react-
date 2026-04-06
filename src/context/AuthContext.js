// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail,
  signOut, updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Sign in with email + password
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Register customer
  const register = async (name, email, phone, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email, phone: phone || "",
      role: "customer",
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  // Forgot password — sends email automatically
  const forgotPassword = (email) => sendPasswordResetEmail(auth, email);

  // Sign out
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
