
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

router.patch("/colleges/:id/status", async (req, res) => {
    const { id } = req.params;
    const status = req.body?.status;

    if (status !== "ACTIVE" && status !== "INACTIVE") {
        res.status(400).json({
            message: "Status must be ACTIVE or INACTIVE.",
        });
        return;
    }

    try {
        const college = await prisma.$transaction(async (tx) => {
            const existingCollege = await tx.college.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    status: true,
                },
            });

            if (!existingCollege) {
                return null;
            }

            const updatedCollege = await tx.college.update({
                where: { id },
                data: { status },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    status: true,
                    _count: {
                        select: {
                            students: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId: id,
                    action:
                        status === "ACTIVE"
                            ? "COLLEGE_ACTIVATED"
                            : "COLLEGE_DEACTIVATED",
                    entityType: "College",
                    entityId: id,
                    details: {
                        previousStatus: existingCollege.status,
                        newStatus: status,
                    },
                },
            });

            return updatedCollege;
        });

        if (!college) {
            res.status(404).json({
                message: "College not found.",
            });
            return;
        }

        res.status(200).json({
            message: `College ${status.toLowerCase()} successfully.`,
            college,
        });
    } catch (error) {
        throw error;
    }
});


// GET /api/admin/users
// List platform users with optional filters.
router.get("/users", async (req, res, next) => {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const role =
            typeof req.query.role === "string"
                ? req.query.role
                : undefined;

        const collegeId =
            typeof req.query.collegeId === "string"
                ? req.query.collegeId
                : undefined;

        const accountStatus =
            typeof req.query.accountStatus === "string"
                ? req.query.accountStatus
                : undefined;

        const users = await prisma.user.findMany({
            where: {
                ...(search
                    ? {
                        OR: [
                            {
                                fullName: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }
                    : {}),
                ...(role ? { role: role as any } : {}),
                ...(collegeId ? { collegeId } : {}),
                ...(accountStatus
                    ? { accountStatus: accountStatus as any }
                    : {}),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                accountStatus: true,
                createdAt: true,
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 200,
        });

        res.json({ users });
    } catch (error) {
        next(error);
    }
});


// PATCH /api/admin/users/:id/status
// Activate, suspend, or disable a user account.
router.patch("/users/:id/status", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { accountStatus } = req.body;

        const allowedStatuses = ["ACTIVE", "SUSPENDED", "DISABLED"];

        if (!allowedStatuses.includes(accountStatus)) {
            res.status(400).json({
                message: "Invalid account status.",
            });
            return;
        }

        // Prevent the logged-in administrator from disabling themselves.
        if (req.appUser?.id === id) {
            res.status(400).json({
                message: "You cannot change your own account status.",
            });
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                firebaseUid: true,
                role: true,
                accountStatus: true,
                collegeId: true,
            },
        });

        if (!targetUser) {
            res.status(404).json({
                message: "User not found.",
            });
            return;
        }

        // Prevent deactivating the last active College Admin.
        if (
            targetUser.role === "COLLEGE_ADMIN" &&
            targetUser.accountStatus === "ACTIVE" &&
            accountStatus !== "ACTIVE"
        ) {
            const activeCollegeAdmins = await prisma.user.count({
                where: {
                    collegeId: targetUser.collegeId,
                    role: "COLLEGE_ADMIN",
                    accountStatus: "ACTIVE",
                },
            });

            if (activeCollegeAdmins <= 1) {
                res.status(400).json({
                    message:
                        "Cannot deactivate the last active College Admin of this college.",
                });
                return;
            }
        }
        if (targetUser.accountStatus === accountStatus) {
            res.json({
                message: "User already has this account status.",
                user: {
                    id: targetUser.id,
                    fullName: targetUser.fullName,
                    email: targetUser.email,
                    role: targetUser.role,
                    accountStatus: targetUser.accountStatus,
                },
            });
            return;
        }

        const firebaseAuth = getFirebaseAdminAuth();

        const previousDisabled = targetUser.accountStatus !== "ACTIVE";
        const nextDisabled = accountStatus !== "ACTIVE";

        // Update Firebase first so sign-in access is synchronized.
        await firebaseAuth.updateUser(targetUser.firebaseUid, {
            disabled: nextDisabled,
        });

        try {
            const updatedUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.update({
                    where: { id },
                    data: { accountStatus },
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        accountStatus: true,
                        createdAt: true,
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
                        action: "USER_ACCOUNT_STATUS_CHANGED",
                        entityType: "USER",
                        entityId: id,
                        details: {
                            previousStatus: targetUser.accountStatus,
                            newStatus: accountStatus,
                            targetEmail: targetUser.email,
                        },
                    },
                });

                return user;
            });

            res.json({
                message: "User account status updated successfully.",
                user: updatedUser,
            });
        } catch (databaseError) {
            // Restore Firebase if the database update fails.
            try {
                await firebaseAuth.updateUser(targetUser.firebaseUid, {
                    disabled: previousDisabled,
                });
            } catch (rollbackError) {
                console.error("Firebase status rollback failed:", rollbackError);
            }

            throw databaseError;
        }
    } catch (error) {
        next(error);
    }
});



// GET /api/admin/colleges
// List colleges for Platform Admin.
router.get("/colleges", async (_req, res, next) => {
    try {
        const colleges = await prisma.college.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({ colleges });
    } catch (error) {
        next(error);
    }
});


// POST /api/admin/colleges
// Create a new college.
router.post("/colleges", async (req, res) => {
    const name =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const code =
        typeof req.body?.code === "string"
            ? req.body.code.trim().toUpperCase()
            : "";

    if (!name || !code) {
        res.status(400).json({
            message: "College name and code are required.",
        });
        return;
    }

    if (name.length > 150) {
        res.status(400).json({
            message: "College name cannot exceed 150 characters.",
        });
        return;
    }

    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
        res.status(400).json({
            message: "College code must be 2–20 characters and contain only letters, numbers, hyphens, or underscores.",
        });
        return;
    }

    try {
        const college = await prisma.$transaction(async (tx) => {
            const createdCollege = await tx.college.create({
                data: {
                    name,
                    code,
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    status: true,
                    createdAt: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId: createdCollege.id,
                    action: "COLLEGE_CREATED",
                    entityType: "College",
                    entityId: createdCollege.id,
                    details: {
                        name,
                        code,
                    },
                },
            });

            return createdCollege;
        });

        res.status(201).json({
            message: "College created successfully.",
            college,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({
                message: "A college with this code already exists.",
            });
            return;
        }

        throw error;
    }
});


// PATCH /api/admin/colleges/:id
// Update a college's name and code.
router.patch("/colleges/:id", async (req, res) => {
    const { id } = req.params;

    const name =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const code =
        typeof req.body?.code === "string"
            ? req.body.code.trim().toUpperCase()
            : "";

    if (!name || !code) {
        res.status(400).json({
            message: "College name and code are required.",
        });
        return;
    }

    if (name.length > 150) {
        res.status(400).json({
            message: "College name cannot exceed 150 characters.",
        });
        return;
    }

    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
        res.status(400).json({
            message: "College code must be 2–20 characters and contain only letters, numbers, hyphens, or underscores.",
        });
        return;
    }

    try {
        const existingCollege = await prisma.college.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existingCollege) {
            res.status(404).json({
                message: "College not found.",
            });
            return;
        }

        const college = await prisma.$transaction(async (tx) => {
            const updatedCollege = await tx.college.update({
                where: { id },
                data: {
                    name,
                    code,
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            students: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: req.appUser!.id,
                    collegeId: id,
                    action: "COLLEGE_UPDATED",
                    entityType: "College",
                    entityId: id,
                    details: {
                        name,
                        code,
                    },
                },
            });

            return updatedCollege;
        });

        res.status(200).json({
            message: "College updated successfully.",
            college,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({
                message: "A college with this code already exists.",
            });
            return;
        }

        if (error.code === "P2025") {
            res.status(404).json({
                message: "College not found.",
            });
            return;
        }

        throw error;
    }
});



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



    // PATCH /api/admin/colleges/:id/status
    // Activate or deactivate a college.



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

// POST /api/admin/college-admins
// Create a College Admin account.
router.post("/college-admins", async (req, res) => {
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
        select: {
            id: true,
            name: true,
            code: true,
            status: true,
        },
    });

    if (!college) {
        res.status(404).json({
            message: "College not found. Check the college code.",
        });
        return;
    }

    if (college.status !== "ACTIVE") {
        res.status(400).json({
            message: "Cannot create an administrator for an inactive college.",
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

        firebaseUid = firebaseUser.uid;

        const createdUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firebaseUid: firebaseUser.uid,
                    email,
                    fullName,
                    role: "COLLEGE_ADMIN",
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
                    action: "COLLEGE_ADMIN_CREATED",
                    entityType: "User",
                    entityId: user.id,
                    details: {
                        email,
                        role: "COLLEGE_ADMIN",
                    },
                },
            });

            return user;
        });

        res.status(201).json({
            message: "College Admin account created successfully.",
            user: createdUser,
        });
    } catch (error: any) {
        if (firebaseUid) {
            try {
                await firebaseAuth.deleteUser(firebaseUid);
            } catch (cleanupError) {
                console.error(
                    "Firebase account cleanup failed:",
                    cleanupError
                );
            }
        }

        if (
            error.code === "auth/email-already-exists" ||
            error.code === "P2002"
        ) {
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        console.error("College Admin creation failed:", error);

        res.status(500).json({
            message: "Unable to create College Admin account.",
        });
    }
});

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




// GET /api/admin/audit-logs
// Retrieve paginated audit logs for the platform administrator.
router.get("/audit-logs", async (req, res, next) => {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const action =
            typeof req.query.action === "string"
                ? req.query.action.trim()
                : "";

        const entityType =
            typeof req.query.entityType === "string"
                ? req.query.entityType.trim()
                : "";

        const page = Math.max(
            1,
            Number.parseInt(String(req.query.page ?? "1"), 10) || 1
        );

        const limit = 50;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (action) {
            where.action = action;
        }

        if (entityType) {
            where.entityType = entityType;
        }

        if (search) {
            where.OR = [
                { action: { contains: search, mode: "insensitive" } },
                { entityType: { contains: search, mode: "insensitive" } },
                { entityId: { contains: search, mode: "insensitive" } },
                {
                    user: {
                        is: {
                            OR: [
                                {
                                    fullName: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    email: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                    },
                },
            ];
        }

        const [auditLogs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            auditLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});



export default router;
