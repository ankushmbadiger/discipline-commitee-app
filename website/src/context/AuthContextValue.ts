import { createContext } from "react";
import type { User } from "firebase/auth";

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

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);