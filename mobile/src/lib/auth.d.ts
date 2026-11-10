import { type User } from "firebase/auth";
export declare function registerWithEmail(email: string, password: string): Promise<User>;
export declare function loginWithEmail(email: string, password: string): Promise<User>;
export declare function logout(): Promise<void>;
export declare function getAuthToken(): Promise<string | null>;
