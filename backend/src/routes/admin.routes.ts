
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireRole,
} from "../middleware/authorization.middleware.js";
import { getFirebaseAdminAuth } from "../lib/firebase-admin.js";

const router = Router();

// Every route in this file requires an active platform administrator.
router.use(authenticate, requireActiveUser, requireRole("PLATFORM_ADMIN"));

// GET /api/admin/student-verifications
// List pending student verification requests.
router.get("/student-verifications", async (_req, res) => {
    const verifications = await prisma.studentVerification.findMany({
        where: {
            status: "PENDING",
        },
        select: {
            id: true,
            requestedUsn: true,
            requestedFullName: true,
            requestedDepartment: true,
            requestedSemester: true,
            createdAt: true,
            requester: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    res.status(200).json({
        count: verifications.length,
        verifications,
    });
});

// POST /api/admin/student-verifications/:id/approve
// Approve a student and create or link their Student record.
router.post("/student-verifications/:id/approve", async (req, res) => {
    const verificationId = req.params.id;
    const departmentInput = req.body?.department;
    const semesterInput = req.body?.semester;

    if (
        departmentInput !== undefined &&
        (typeof departmentInput !== "string" || !departmentInput.trim())
    ) {
        res.status(400).json({
            message: "Department must be a non-empty string.",
        });
        return;
    }

    if (
        semesterInput !== undefined &&
        (!Number.isInteger(semesterInput) || semesterInput < 1 || semesterInput > 12)
    ) {
        res.status(400).json({
            message: "Semester must be an integer between 1 and 12.",
        });
        return;
    }

    const result = await prisma.$transaction(
        async (tx) => {
            const verification = await tx.studentVerification.findUnique({
                where: {
                    id: verificationId,
                },
                include: {
                    requester: {
                        select: {
                            id: true,
                            collegeId: true,
                        },
                    },
                },
            });

            if (!verification) {
                return { kind: "NOT_FOUND" as const };
            }

            if (verification.status !== "PENDING") {
                return { kind: "ALREADY_REVIEWED" as const };
            }

            const collegeId = verification.requester.collegeId;

            if (!collegeId) {
                return { kind: "MISSING_COLLEGE" as const };
            }

            const student = await tx.student.findUnique({
                where: {
                    collegeId_usn: {
                        collegeId,
                        usn: verification.requestedUsn,
                    },
                },
            });

            if (student?.userId && student.userId !== verification.userId) {
                return { kind: "ALREADY_LINKED" as const };
            }

            let studentRecord;

            if (student) {
                // Preserve existing student details; only link the account.
                studentRecord = student.userId
                    ? student
                    : await tx.student.update({
                        where: {
                            id: student.id,
                        },
                        data: {
                            userId: verification.userId,
                        },
                    });
            } else {
                const department =
                    typeof departmentInput === "string"
                        ? departmentInput.trim()
                        : verification.requestedDepartment?.trim();

                if (!department) {
                    return { kind: "DEPARTMENT_REQUIRED" as const };
                }

                const semester =
                    semesterInput !== undefined
                        ? semesterInput
                        : verification.requestedSemester;

                studentRecord = await tx.student.create({
                    data: {
                        collegeId,
                        userId: verification.userId,
                        usn: verification.requestedUsn,
                        fullName: verification.requestedFullName,
                        department,
                        semester,
                    },
                });
            }

            await tx.studentVerification.update({
                where: {
                    id: verification.id,
                },
                data: {
                    studentId: studentRecord.id,
                    status: "APPROVED",
                    reviewedById: req.appUser!.id,
                    reviewedAt: new Date(),
                    reason: null,
                },
            });

            await tx.notification.create({
                data: {
                    userId: verification.userId,
                    type: "VERIFICATION",
                    title: "Student verification approved",
                    message: "Your student account has been verified. You can now access your student features.",
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId,
                    action: "STUDENT_VERIFICATION_APPROVED",
                    entityType: "StudentVerification",
                    entityId: verification.id,
                    details: {
                        studentId: studentRecord.id,
                        usn: verification.requestedUsn,
                    },
                },
            });

            return {
                kind: "APPROVED" as const,
                student: studentRecord,
            };
        },
        {
            maxWait: 10000,
            timeout: 20000,
        }
    );

    if (result.kind === "NOT_FOUND") {
        res.status(404).json({ message: "Verification request not found." });
        return;
    }

    if (result.kind === "ALREADY_REVIEWED") {
        res.status(409).json({ message: "This verification request has already been reviewed." });
        return;
    }

    if (result.kind === "MISSING_COLLEGE") {
        res.status(400).json({ message: "The requesting account has no associated college." });
        return;
    }

    if (result.kind === "ALREADY_LINKED") {
        res.status(409).json({ message: "This student record is already linked to another account." });
        return;
    }

    if (result.kind === "DEPARTMENT_REQUIRED") {
        res.status(400).json({
            message: "A department is required to create a new student record. Supply it in the request body.",
        });
        return;
    }

    res.status(200).json({
        message: "Student verification approved successfully.",
        student: result.student,
    });
});

// POST /api/admin/student-verifications/:id/reject
// Reject a verification request with a reason.
router.post("/student-verifications/:id/reject", async (req, res) => {
    const verificationId = req.params.id;
    const reason =
        typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    if (reason.length < 3) {
        res.status(400).json({
            message: "Please provide a rejection reason of at least 3 characters.",
        });
        return;
    }

    const result = await prisma.$transaction(
        async (tx) => {
            const verification = await tx.studentVerification.findUnique({
                where: {
                    id: verificationId,
                },
                include: {
                    requester: {
                        select: {
                            id: true,
                            collegeId: true,
                        },
                    },
                },
            });

            if (!verification) {
                return { kind: "NOT_FOUND" as const };
            }

            if (verification.status !== "PENDING") {
                return { kind: "ALREADY_REVIEWED" as const };
            }

            await tx.studentVerification.update({
                where: {
                    id: verification.id,
                },
                data: {
                    status: "REJECTED",
                    reviewedById: req.appUser!.id,
                    reviewedAt: new Date(),
                    reason,
                },
            });

            await tx.notification.create({
                data: {
                    userId: verification.userId,
                    type: "VERIFICATION",
                    title: "Student verification rejected",
                    message: `Your student verification request was rejected. Reason: ${reason}`,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId: verification.requester.collegeId,
                    action: "STUDENT_VERIFICATION_REJECTED",
                    entityType: "StudentVerification",
                    entityId: verification.id,
                    details: {
                        reason,
                        usn: verification.requestedUsn,
                    },
                },
            });

            return { kind: "REJECTED" as const };
        },
        {
            maxWait: 10000,
            timeout: 20000,
        }
    );

    if (result.kind === "NOT_FOUND") {
        res.status(404).json({ message: "Verification request not found." });
        return;
    }

    if (result.kind === "ALREADY_REVIEWED") {
        res.status(409).json({ message: "This verification request has already been reviewed." });
        return;
    }

    res.status(200).json({
        message: "Student verification rejected successfully.",
    });
});



// POST /api/admin/committee-members
// Create a Committee Member account.
router.post("/committee-members", async (req, res) => {
    const fullName =
        typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";

    const email =
        typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    const password =
        typeof req.body?.password === "string" ? req.body.password : "";

    const collegeCode =
        typeof req.body?.collegeCode === "string"
            ? req.body.collegeCode.trim().toUpperCase()
            : "";

    if (!fullName || !email || !collegeCode) {
        res.status(400).json({
            message: "Full name, email, and college code are required.",
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
        where: { code: collegeCode },
        select: { id: true, name: true, code: true },
    });

    if (!college) {
        res.status(404).json({
            message: "College not found. Check the college code.",
        });
        return;
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        res.status(409).json({
            message: "An account with this email already exists.",
        });
        return;
    }

    const firebaseAuth = getFirebaseAdminAuth();
    let firebaseUid: string | undefined;

    try {
        const firebaseUser = await firebaseAuth.createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: false,
            disabled: false,
        });

        const createdFirebaseUid = firebaseUser.uid;
        firebaseUid = createdFirebaseUid;

        const createdUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firebaseUid: createdFirebaseUid,
                    email,
                    fullName,
                    role: "COMMITTEE_MEMBER",
                    accountStatus: "ACTIVE",
                    collegeId: college.id,
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
                    collegeId: college.id,
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
        });

        res.status(201).json({
            message: "Committee Member account created successfully.",
            user: createdUser,
        });
    } catch (error: any) {
        if (firebaseUid) {
            try {
                await firebaseAuth.deleteUser(firebaseUid);
            } catch (cleanupError) {
                console.error("Firebase account cleanup failed:", cleanupError);
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

        console.error("Committee Member creation failed:", error);

        res.status(500).json({
            message: "Unable to create Committee Member account.",
        });
    }
});



export default router;
