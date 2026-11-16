
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



export async function requireVerificationPermission(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = req.appUser;

        if (!user) {
            res.status(403).json({
                message: "Application authorization required.",
            });
            return;
        }

        // Platform Admin has global verification access.
        if (user.role === "PLATFORM_ADMIN") {
            next();
            return;
        }

        // College-scoped roles require an active college.
        if (
            user.role !== "COLLEGE_ADMIN" &&
            user.role !== "COMMITTEE_MEMBER"
        ) {
            res.status(403).json({
                message: "You do not have permission to review student verifications.",
            });
            return;
        }

        if (!user.collegeId) {
            res.status(403).json({
                message: "Your account is not associated with a college.",
            });
            return;
        }

        const college = await prisma.college.findUnique({
            where: { id: user.collegeId },
            select: { status: true },
        });

        if (!college || college.status !== "ACTIVE") {
            res.status(403).json({
                message: "Your college is not active.",
            });
            return;
        }

        // College Admin automatically has access to their college.
        if (user.role === "COLLEGE_ADMIN") {
            next();
            return;
        }

        // Committee Members need an active delegated permission.
        const permission =
            await prisma.committeeVerificationPermission.findFirst({
                where: {
                    userId: user.id,
                    collegeId: user.collegeId,
                    revokedAt: null,
                },
                select: {
                    id: true,
                },
            });

        if (!permission) {
            res.status(403).json({
                message: "You do not have permission to review student verifications.",
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
}
