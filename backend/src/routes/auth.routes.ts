import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireActiveUser } from "../middleware/authorization.middleware.js";

const router = Router();

// GET /api/auth/me
// Return the authenticated user's application profile.
router.get(
    "/me",
    authenticate,
    requireActiveUser,
    async (req, res, next) => {
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
                    fullName: true,
                    email: true,
                    role: true,
                    accountStatus: true,

                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },

                    student: {
                        select: {
                            id: true,
                            usn: true,
                            fullName: true,
                            department: true,
                            semester: true,
                        },
                    },

                    requestedVerifications: {
                        select: {
                            id: true,
                            status: true,
                            requestedUsn: true,
                            reason: true,
                            createdAt: true,
                            reviewedAt: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 1,
                    },
                },
            });

            if (!user) {
                res.status(404).json({
                    message: "Application account not found.",
                });
                return;
            }

            res.status(200).json({
                message: "Profile retrieved successfully.",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
);



class RegistrationError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "RegistrationError";
    }
}

router.post(
    "/register-student",
    authenticate,
    async (req, res, next) => {
        try {
            const firebaseUser = req.firebaseUser;

            if (!firebaseUser?.uid || !firebaseUser.email) {
                res.status(400).json({
                    message: "Your Firebase account must have an email address.",
                });
                return;
            }

            const body = req.body ?? {};

            const {
                collegeCode,
                usn,
                fullName,
                department,
                semester,
            } = body as {
                collegeCode?: unknown;
                usn?: unknown;
                fullName?: unknown;
                department?: unknown;
                semester?: unknown;
            };

            if (
                typeof collegeCode !== "string" ||
                typeof usn !== "string" ||
                typeof fullName !== "string" ||
                !collegeCode.trim() ||
                !usn.trim() ||
                !fullName.trim()
            ) {
                res.status(400).json({
                    message: "College code, USN and full name are required.",
                });
                return;
            }

            if (
                department !== undefined &&
                department !== null &&
                typeof department !== "string"
            ) {
                res.status(400).json({
                    message: "Department must be text.",
                });
                return;
            }

            if (
                semester !== undefined &&
                semester !== null &&
                (
                    typeof semester !== "number" ||
                    !Number.isInteger(semester) ||
                    semester < 1 ||
                    semester > 12
                )
            ) {
                res.status(400).json({
                    message: "Semester must be a number between 1 and 12.",
                });
                return;
            }

            const normalizedCollegeCode = collegeCode.trim().toUpperCase();
            const normalizedUsn = usn.trim().toUpperCase();
            const normalizedName = fullName.trim();
            const normalizedEmail = firebaseUser.email.trim().toLowerCase();

            const result = await prisma.$transaction(async (tx) => {
                const college = await tx.college.findUnique({
                    where: {
                        code: normalizedCollegeCode,
                    },
                });

                if (!college) {
                    throw new RegistrationError(
                        "Invalid college code.",
                        404
                    );
                }

                const existingUser = await tx.user.findFirst({
                    where: {
                        OR: [
                            { firebaseUid: firebaseUser.uid },
                            { email: normalizedEmail },
                        ],
                    },
                });

                if (existingUser) {
                    throw new RegistrationError(
                        "An application account already exists for this Firebase account or email.",
                        409
                    );
                }

                const user = await tx.user.create({
                    data: {
                        firebaseUid: firebaseUser.uid,
                        email: normalizedEmail,
                        fullName: normalizedName,
                        role: "STUDENT",
                        accountStatus: "ACTIVE",
                        collegeId: college.id,
                    },
                });

                const verification = await tx.studentVerification.create({
                    data: {
                        userId: user.id,
                        requestedUsn: normalizedUsn,
                        requestedFullName: normalizedName,
                        requestedDepartment:
                            typeof department === "string"
                                ? department.trim() || null
                                : null,
                        requestedSemester:
                            typeof semester === "number" ? semester : null,
                        status: "PENDING",
                        method: "MANUAL_REVIEW",
                    },
                });

                return {
                    userId: user.id,
                    verificationId: verification.id,
                    fullName: normalizedName,
                    usn: normalizedUsn,
                    collegeName: college.name,
                    verificationStatus: verification.status,
                };
            }, {
                maxWait: 10000,
                timeout: 20000,
            });


            res.status(201).json({
                message: "Registration submitted. Await administrator verification.",
                data: result,
            });
        } catch (error) {
            if (error instanceof RegistrationError) {
                res.status(error.statusCode).json({
                    message: error.message,
                });
                return;
            }

            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                res.status(409).json({
                    message: "An account or registration request already exists.",
                });
                return;
            }

            next(error);
        }
    }
);


// GET /api/auth/student/cases
// Return only cases associated with the authenticated, verified student.
router.get(
    "/student/cases",
    authenticate,
    requireActiveUser,
    async (req, res, next) => {
        try {
            const appUser = req.appUser;

            if (!appUser || appUser.role !== "STUDENT") {
                res.status(403).json({
                    message: "Only student accounts can access student cases.",
                });
                return;
            }

            const student = await prisma.student.findUnique({
                where: {
                    userId: appUser.id,
                },
                select: {
                    id: true,
                    usn: true,
                    fullName: true,
                },
            });

            if (!student) {
                res.status(403).json({
                    message: "Your student identity has not been verified yet.",
                });
                return;
            }

            const cases = await prisma.reportInvolvement.findMany({
                where: {
                    studentId: student.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    identityStatus: true,
                    description: true,
                    appeals: {
                        select: {
                            id: true,
                            status: true,
                            createdAt: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                    report: {
                        select: {
                            id: true,
                            reportNumber: true,
                            category: true,
                            status: true,
                            incidentAt: true,
                            createdAt: true,
                            location: true,
                        },
                    },
                },
            });

            res.status(200).json({
                message: "Student cases retrieved successfully.",
                data: {
                    student,
                    cases,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);



export default router;