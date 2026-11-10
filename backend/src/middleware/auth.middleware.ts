import type { Request, Response, NextFunction } from "express";
import { FirebaseAuthError } from "firebase-admin/auth";

import { getFirebaseAdminAuth } from "../lib/firebase-admin.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  try {
    const decodedToken =
      await getFirebaseAdminAuth().verifyIdToken(token);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
      return;
    }

    next(error);
  }
}
