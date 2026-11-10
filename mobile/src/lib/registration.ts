
import { FirebaseError } from "firebase/app";
import { registerWithEmail, loginWithEmail } from "./auth";
import api from "./api";

export interface StudentRegistrationInput {
  email: string;
  password: string;
  collegeCode: string;
  usn: string;
  fullName: string;
  department?: string;
  semester?: number;
}

export async function registerStudent(input: StudentRegistrationInput) {
  let firebaseUser;

  try {
    firebaseUser = await registerWithEmail(input.email, input.password);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "auth/email-already-in-use"
    ) {
      firebaseUser = await loginWithEmail(input.email, input.password);
    } else {
      throw error;
    }
  }

  const response = await api.post("/auth/register-student", {
    collegeCode: input.collegeCode,
    usn: input.usn,
    fullName: input.fullName,
    department: input.department,
    semester: input.semester,
  });

  return {
    firebaseUser,
    registration: response.data,
  };
}
