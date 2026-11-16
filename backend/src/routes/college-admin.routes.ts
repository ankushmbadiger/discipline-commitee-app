
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireRole,
} from "../middleware/authorization.middleware.js";
import { getFirebaseAdminAuth } from "../lib/firebase-admin.js";

const router = Router();

router.use(
    authenticate,
    requireActiveUser,
    requireRole("COLLEGE_ADMIN")
);

// POST /api/college-admin/committee-members/:id/verification-permission
// Grant a Committee Member permission to review student verifications.
router.post(
    "/committee-members/:id/verification-permission",
    async (req, res, next) => {
        try {
            const collegeId = req.appUser!.collegeId;
            const committeeMemberId = req.params.id;

            if (!collegeId) {
                res.status(403).json({
                    message: "Your account is not assigned to a college.",
                });
                return;
            }

            const college = await prisma.college.findUnique({
                where: { id: collegeId },
                select: { status: true },
            });

            if (!college || college.status !== "ACTIVE") {
                res.status(403).json({
                    message: "Your college is not active.",
                });
                return;
            }

            const member = await prisma.user.findFirst({
                where: {
                    id: committeeMemberId,
                    collegeId,
                    role: "COMMITTEE_MEMBER",
                    accountStatus: "ACTIVE",
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            });

            if (!member) {
                res.status(404).json({
                    message:
                        "Active Committee Member not found in your college.",
                });
                return;
            }

            const existingPermission =
                await prisma.committeeVerificationPermission.findFirst({
                    where: {
                        userId: member.id,
                        collegeId,
                        revokedAt: null,
                    },
                });

            if (existingPermission) {
                res.status(409).json({
                    message:
                        "This Committee Member already has verification-review permission.",
                });
                return;
            }

            const permission = await prisma.$transaction(async (tx) => {
                const created = await tx.committeeVerificationPermission.create({
                    data: {
                        userId: member.id,
                        collegeId,
                        grantedById: req.appUser!.id,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        userId: req.appUser!.id,
                        collegeId,
                        action: "VERIFICATION_PERMISSION_GRANTED",
                        entityType: "CommitteeVerificationPermission",
                        entityId: created.id,
                        details: {
                            committeeMemberId: member.id,
                            committeeMemberEmail: member.email,
                        },
                    },
                });

                return created;
            });

            res.status(201).json({
                message:
                    "Verification-review permission granted successfully.",
                permission,
                committeeMember: member,
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/college-admin/committee-members/:id/verification-permission
// Revoke a Committee Member's verification-review permission.
router.delete(
    "/committee-members/:id/verification-permission",
    async (req, res, next) => {
        try {
            const collegeId = req.appUser!.collegeId;
            const committeeMemberId = req.params.id;

            if (!collegeId) {
                res.status(403).json({
                    message: "Your account is not assigned to a college.",
                });
                return;
            }

            const college = await prisma.college.findUnique({
                where: { id: collegeId },
                select: { status: true },
            });

            if (!college || college.status !== "ACTIVE") {
                res.status(403).json({
                    message: "Your college is not active.",
                });
                return;
            }

            const permission =
                await prisma.committeeVerificationPermission.findFirst({
                    where: {
                        userId: committeeMemberId,
                        collegeId,
                        revokedAt: null,
                    },
                });

            if (!permission) {
                res.status(404).json({
                    message:
                        "No active verification-review permission exists for this Committee Member.",
                });
                return;
            }

            await prisma.$transaction(async (tx) => {
                await tx.committeeVerificationPermission.update({
                    where: { id: permission.id },
                    data: {
                        revokedAt: new Date(),
                        revokedById: req.appUser!.id,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        userId: req.appUser!.id,
                        collegeId,
                        action: "VERIFICATION_PERMISSION_REVOKED",
                        entityType: "CommitteeVerificationPermission",
                        entityId: permission.id,
                        details: { committeeMemberId },
                    },
                });
            });

            res.status(200).json({
                message:
                    "Verification-review permission revoked successfully.",
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/college-admin/committee-members
// List Committee Members belonging to the current College Admin's college.
router.get("/committee-members", async (req, res, next) => {
    try {
        const collegeId = req.appUser!.collegeId;

        if (!collegeId) {
            res.status(403).json({
                message: "Your account is not assigned to a college.",
            });
            return;
        }

        const members = await prisma.user.findMany({
            where: {
                collegeId,
                role: "COMMITTEE_MEMBER",
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                accountStatus: true,
                createdAt: true,
                verificationPermissions: {
                    where: {
                        revokedAt: null,
                    },
                    select: {
                        id: true,
                        grantedAt: true,
                        grantedBy: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            count: members.length,
            committeeMembers: members.map((member) => ({
                ...member,
                hasVerificationPermission:
                    member.verificationPermissions.length > 0,
                verificationPermissions: undefined,
            })),
        });
    } catch (error) {
        next(error);
    }
});




// POST /api/college-admin/committee-members
// Create a Committee Member in the current College Admin's college.
router.post("/committee-members", async (req, res, next) => {
    let firebaseUid: string | undefined;

    try {
        const fullName =
            typeof req.body?.fullName === "string"
                ? req.body.fullName.trim()
                : "";

        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            typeof req.body?.password === "string"
                ? req.body.password
                : "";

        const collegeId = req.appUser!.collegeId;

        if (!collegeId) {
            res.status(403).json({
                message: "Your account is not assigned to a college.",
            });
            return;
        }

        if (!fullName || !email) {
            res.status(400).json({
                message: "Full name and email are required.",
            });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({
                message: "Password must contain at least 8 characters.",
            });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({
                message: "Please provide a valid email address.",
            });
            return;
        }

        const college = await prisma.college.findUnique({
            where: { id: collegeId },
            select: { id: true, name: true, code: true, status: true },
        });

        if (!college || college.status !== "ACTIVE") {
            res.status(403).json({
                message: "Your college is not active.",
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        const firebaseAuth = getFirebaseAdminAuth();

        const firebaseUser = await firebaseAuth.createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: false,
            disabled: false,
        });

        firebaseUid = firebaseUser.uid;

        const createdUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firebaseUid: firebaseUser.uid,
                    email,
                    fullName,
                    role: "COMMITTEE_MEMBER",
                    accountStatus: "ACTIVE",
                    collegeId,
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    accountStatus: true,
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId,
                    action: "COMMITTEE_MEMBER_CREATED",
                    entityType: "User",
                    entityId: user.id,
                    details: {
                        email,
                        role: "COMMITTEE_MEMBER",
                    },
                },
            });

            return user;
        }, {
            timeout: 15000,
        });

        res.status(201).json({
            message: "Committee Member account created successfully.",
            user: createdUser,
        });
    } catch (error: any) {
        if (firebaseUid) {
            try {
                await getFirebaseAdminAuth().deleteUser(firebaseUid);
            } catch (cleanupError) {
                console.error(
                    "Firebase account cleanup failed:",
                    cleanupError
                );
            }
        }

        if (error.code === "auth/email-already-exists") {
            res.status(409).json({
                message: "This email is already registered in Firebase.",
            });
            return;
        }

        if (error.code === "P2002") {
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        next(error);
    }
});



export default router;
