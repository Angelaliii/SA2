"use client";

import { User, onAuthStateChanged } from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "../firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Use a separate state to track client-side initialization
  const [mounted, setMounted] = useState(false);

  // This useEffect ensures we only run the auth listener on the client side
  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("auth changed:", firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return { user, loading };
  }, [user, loading]);

  // Memoize the default context value for server rendering or initial client load
  const defaultContextValue = useMemo(() => {
    return { user: null, loading: true };
  }, []);

  // During first render on the server or client hydration,
  // don't show any content that depends on authentication
  if (!mounted) {
    return (
      <AuthContext.Provider value={defaultContextValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
