
import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

interface AppUser {
  id: string;
  role: string;
  accountStatus: string;
  collegeId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}

export async function requireActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const firebaseUid = req.firebaseUser?.uid;

    if (!firebaseUid) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
      select: {
        id: true,
        role: true,
        accountStatus: true,
        collegeId: true,
      },
    });

    if (!user) {
      res.status(403).json({
        message: "Application account not found.",
      });
      return;
    }

    if (user.accountStatus !== "ACTIVE") {
      res.status(403).json({
        message: "Your account is not active.",
      });
      return;
    }

    req.appUser = user;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      res.status(403).json({
        message: "Application authorization required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.appUser.role)) {
      res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
}
