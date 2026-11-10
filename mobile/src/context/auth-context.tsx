
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    onAuthStateChanged,
    type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { logout } from "@/lib/auth";
import api from "@/lib/api";

export interface ApplicationProfile {
    id: string;
    fullName: string;
    email: string;
    role: "STUDENT" | "COMMITTEE_MEMBER" | "COLLEGE_ADMIN" | "PLATFORM_ADMIN";
    accountStatus: "ACTIVE" | "SUSPENDED" | "DISABLED";

    college: {
        id: string;
        name: string;
        code: string;
    } | null;

    student: {
        id: string;
        usn: string;
        fullName: string;
        department: string;
        semester: number;
    } | null;

    requestedVerifications: {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        requestedUsn: string;
        reason: string | null;
        createdAt: string;
        reviewedAt: string | null;
    }[];
}

interface AuthContextType {
    user: User | null;
    profile: ApplicationProfile | null;
    loading: boolean;
    profileLoading: boolean;
    profileError: string | null;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ApplicationProfile | null>(null);

    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        setProfileError(null);

        try {
            const response = await api.get("/auth/me");

            setProfile(response.data.data);
        } catch (error: any) {
            setProfile(null);

            setProfileError(
                error.response?.data?.message ||
                "Unable to retrieve your application profile."
            );
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!auth.currentUser) {
            setProfile(null);
            return;
        }

        await fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!active) return;

            setUser(firebaseUser);
            setProfile(null);
            setProfileError(null);

            if (firebaseUser) {
                setLoading(true);
                setProfileLoading(true);

                try {
                    const response = await api.get("/auth/me");

                    if (active) {
                        setProfile(response.data.data);
                    }
                } catch (error: any) {
                    if (active) {
                        setProfileError(
                            error.response?.data?.message ||
                            "Unable to retrieve your application profile."
                        );
                    }
                } finally {
                    if (active) {
                        setProfileLoading(false);
                        setLoading(false);
                    }
                }
            } else {
                setProfileLoading(false);
                setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        setProfile(null);
        setProfileError(null);
        await logout();
    };

    const value: AuthContextType = {
        user,
        profile,
        loading,
        profileLoading,
        profileError,
        refreshProfile,
        signOut: handleSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
}
