
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import api from "../lib/api";
import { AuthContext } from "./AuthContextValue";

interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  accountStatus: string;
  college: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAppUser(null);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const profile = response.data.data as AppUser;

        if (profile.role === "PLATFORM_ADMIN") {
          setAppUser(profile);
        } else {
          await signOut(auth);
        }
      } catch {
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
