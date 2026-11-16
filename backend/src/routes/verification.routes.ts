
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireVerificationPermission,
} from "../middleware/authorization.middleware.js";

const router = Router();

router.use(
    authenticate,
    requireActiveUser,
    requireVerificationPermission
);

// GET /api/verifications
// List pending verification requests visible to the current reviewer.
router.get("/", async (req, res, next) => {
    try {
        const isPlatformAdmin = req.appUser!.role === "PLATFORM_ADMIN";

        const verifications = await prisma.studentVerification.findMany({
            where: {
                status: "PENDING",
                ...(!isPlatformAdmin
                    ? { requester: { collegeId: req.appUser!.collegeId! } }
                    : {}),
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
    } catch (error) {
        next(error);
    }
});


 
// POST /api/verifications/:id/approve
// Approve a student verification and create or link their Student record.
router.post("/:id/approve", async (req, res, next) => {
    try {
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
            (!Number.isInteger(semesterInput) ||
                semesterInput < 1 ||
                semesterInput > 12)
        ) {
            res.status(400).json({
                message: "Semester must be an integer between 1 and 12.",
            });
            return;
        }

        const result = await prisma.$transaction(
            async (tx) => {
                const verification =
                    await tx.studentVerification.findUnique({
                        where: { id: verificationId },
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

                if (verification.userId === req.appUser!.id) {
                    return { kind: "SELF_REVIEW" as const };
                }

                const collegeId = verification.requester.collegeId;

                if (!collegeId) {
                    return { kind: "MISSING_COLLEGE" as const };
                }

                if (
                    req.appUser!.role !== "PLATFORM_ADMIN" &&
                    collegeId !== req.appUser!.collegeId
                ) {
                    return { kind: "FORBIDDEN" as const };
                }

                const student = await tx.student.findUnique({
                    where: {
                        collegeId_usn: {
                            collegeId,
                            usn: verification.requestedUsn,
                        },
                    },
                });

                if (
                    student?.userId &&
                    student.userId !== verification.userId
                ) {
                    return { kind: "ALREADY_LINKED" as const };
                }

                let studentRecord;

                if (student) {
                    studentRecord = student.userId
                        ? student
                        : await tx.student.update({
                              where: { id: student.id },
                              data: { userId: verification.userId },
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
                    where: { id: verification.id },
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
                        message:
                            "Your student account has been verified. You can now access your student features.",
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
            res.status(404).json({
                message: "Verification request not found.",
            });
            return;
        }

        if (result.kind === "ALREADY_REVIEWED") {
            res.status(409).json({
                message: "This verification request has already been reviewed.",
            });
            return;
        }

        if (result.kind === "SELF_REVIEW") {
            res.status(403).json({
                message: "You cannot review your own verification request.",
            });
            return;
        }

        if (result.kind === "MISSING_COLLEGE") {
            res.status(400).json({
                message: "The requesting account has no associated college.",
            });
            return;
        }

        if (result.kind === "FORBIDDEN") {
            res.status(403).json({
                message: "You cannot review requests from another college.",
            });
            return;
        }

        if (result.kind === "ALREADY_LINKED") {
            res.status(409).json({
                message:
                    "This student record is already linked to another account.",
            });
            return;
        }

        if (result.kind === "DEPARTMENT_REQUIRED") {
            res.status(400).json({
                message:
                    "A department is required to create a new student record.",
            });
            return;
        }

        res.status(200).json({
            message: "Student verification approved successfully.",
            student: result.student,
        });
    } catch (error) {
        next(error);
    }
});


 
// POST /api/verifications/:id/reject
// Reject a student verification request with a reason.
router.post("/:id/reject", async (req, res, next) => {
    try {
        const verificationId = req.params.id;
        const reason =
            typeof req.body?.reason === "string"
                ? req.body.reason.trim()
                : "";

        if (reason.length < 3) {
            res.status(400).json({
                message:
                    "Please provide a rejection reason of at least 3 characters.",
            });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const verification =
                await tx.studentVerification.findUnique({
                    where: { id: verificationId },
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

            if (verification.userId === req.appUser!.id) {
                return { kind: "SELF_REVIEW" as const };
            }

            const collegeId = verification.requester.collegeId;

            if (
                req.appUser!.role !== "PLATFORM_ADMIN" &&
                collegeId !== req.appUser!.collegeId
            ) {
                return { kind: "FORBIDDEN" as const };
            }

            await tx.studentVerification.update({
                where: { id: verification.id },
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
                    collegeId,
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
        });

        if (result.kind === "NOT_FOUND") {
            res.status(404).json({
                message: "Verification request not found.",
            });
            return;
        }

        if (result.kind === "ALREADY_REVIEWED") {
            res.status(409).json({
                message:
                    "This verification request has already been reviewed.",
            });
            return;
        }

        if (result.kind === "SELF_REVIEW") {
            res.status(403).json({
                message: "You cannot review your own verification request.",
            });
            return;
        }

        if (result.kind === "FORBIDDEN") {
            res.status(403).json({
                message:
                    "You cannot review requests from another college.",
            });
            return;
        }

        res.status(200).json({
            message: "Student verification rejected successfully.",
        });
    } catch (error) {
        next(error);
    }
});


 
// // DELETE /api/college-admin/committee-members/:id/verification-permission
// // Revoke a Committee Member's verification-review permission.
// router.delete(
//     "/committee-members/:id/verification-permission",
//     async (req, res, next) => {
//         try {
//             const collegeId = req.appUser!.collegeId;
//             const committeeMemberId = req.params.id;

//             if (!collegeId) {
//                 res.status(403).json({
//                     message: "Your account is not assigned to a college.",
//                 });
//                 return;
//             }

//             const permission =
//                 await prisma.committeeVerificationPermission.findFirst({
//                     where: {
//                         userId: committeeMemberId,
//                         collegeId,
//                         revokedAt: null,
//                     },
//                 });

//             if (!permission) {
//                 res.status(404).json({
//                     message:
//                         "No active verification-review permission exists for this Committee Member.",
//                 });
//                 return;
//             }

//             await prisma.$transaction(async (tx) => {
//                 await tx.committeeVerificationPermission.update({
//                     where: { id: permission.id },
//                     data: {
//                         revokedAt: new Date(),
//                         revokedById: req.appUser!.id,
//                     },
//                 });

//                 await tx.auditLog.create({
//                     data: {
//                         userId: req.appUser!.id,
//                         collegeId,
//                         action: "VERIFICATION_PERMISSION_REVOKED",
//                         entityType: "CommitteeVerificationPermission",
//                         entityId: permission.id,
//                         details: {
//                             committeeMemberId,
//                         },
//                     },
//                 });
//             });

//             res.status(200).json({
//                 message:
//                     "Verification-review permission revoked successfully.",
//             });
//         } catch (error) {
//             next(error);
//         }
//     }
// );


export default router;

