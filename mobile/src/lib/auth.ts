import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getIdToken,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

export async function registerWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return getIdToken(user);
}