
import { Router } from "express";
import { randomBytes } from "node:crypto";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireRole,
} from "../middleware/authorization.middleware.js";

const router = Router();

const categories = [
    "CLASSROOM_DISRUPTION",
    "MISCONDUCT",
    "PROPERTY_DAMAGE",
    "BULLYING",
    "INDISCIPLINE",
    "OTHER",
] as const;

router.use(
    authenticate,
    requireActiveUser,
    requireRole("COMMITTEE_MEMBER")
);

// POST /api/reports
// Create a disciplinary report.
router.post("/", async (req, res, next) => {
    try {
        const appUser = req.appUser!;

        if (!appUser.collegeId) {
            res.status(403).json({
                message: "Your account is not assigned to a college.",
            });
            return;
        }

        const {
            category,
            description,
            location,
            identificationMethod,
            student,
            personDescription,
        } = req.body ?? {};

        if (
            typeof category !== "string" ||
            !categories.includes(category as (typeof categories)[number])
        ) {
            res.status(400).json({
                message: "A valid report category is required.",
            });
            return;
        }

        if (
            typeof description !== "string" ||
            !description.trim() ||
            description.trim().length > 5000
        ) {
            res.status(400).json({
                message: "Description is required and must not exceed 5000 characters.",
            });
            return;
        }

        if (
            identificationMethod !== "ID_CARD" &&
            identificationMethod !== "NO_ID"
        ) {
            res.status(400).json({
                message: "Identification method must be ID_CARD or NO_ID.",
            });
            return;
        }

        if (
            location !== undefined &&
            location !== null &&
            typeof location !== "string"
        ) {
            res.status(400).json({
                message: "Location must be a string.",
            });
            return;
        }

        if (
            identificationMethod === "NO_ID" &&
            (typeof personDescription !== "string" ||
                !personDescription.trim())
        ) {
            res.status(400).json({
                message: "A description of the unidentified person is required.",
            });
            return;
        }

        let studentRecord: {
            id: string;
            usn: string;
            fullName: string;
            department: string;
            semester: number | null;
        } | null = null;

        let reportedUsn: string | null = null;
        let reportedName: string | null = null;
        let reportedDepartment: string | null = null;
        let reportedSemester: number | null = null;

        if (identificationMethod === "ID_CARD") {
            if (
                !student ||
                typeof student.usn !== "string" ||
                !student.usn.trim()
            ) {
                res.status(400).json({
                    message: "Student USN is required when using an ID card.",
                });
                return;
            }

            reportedUsn = student.usn.trim().toUpperCase();
            if (!reportedUsn) {
                res.status(400).json({
                    message: "Student USN cannot be empty.",
                });
                return;
            }
            if (
                student.fullName !== undefined &&
                typeof student.fullName !== "string"
            ) {
                res.status(400).json({
                    message: "Student name must be a string.",
                });
                return;
            }

            if (
                student.department !== undefined &&
                typeof student.department !== "string"
            ) {
                res.status(400).json({
                    message: "Student department must be a string.",
                });
                return;
            }

            if (
                student.semester !== undefined &&
                student.semester !== null &&
                (!Number.isInteger(student.semester) ||
                    student.semester < 1 ||
                    student.semester > 12)
            ) {
                res.status(400).json({
                    message: "Student semester must be a valid integer.",
                });
                return;
            }

            studentRecord = await prisma.student.findUnique({
                where: {
                    collegeId_usn: {
                        collegeId: appUser.collegeId,
                        usn: reportedUsn!,
                    },
                },
                select: {
                    id: true,
                    usn: true,
                    fullName: true,
                    department: true,
                    semester: true,
                },
            });

            reportedName =
                studentRecord?.fullName ??
                student.fullName?.trim() ??
                null;

            reportedDepartment =
                studentRecord?.department ??
                student.department?.trim() ??
                null;

            reportedSemester =
                studentRecord?.semester ??
                student.semester ??
                null;
        }

        const year = new Date().getFullYear();
        const randomSuffix = randomBytes(4)
            .toString("hex")
            .toUpperCase();

        const reportNumber = `DC-${year}-${randomSuffix}`;

        const report = await prisma.$transaction(async (tx) => {
            const createdReport = await tx.report.create({
                data: {
                    collegeId: appUser.collegeId!,
                    createdById: appUser.id,
                    reportNumber,
                    category: category as (typeof categories)[number],
                    description: description.trim(),
                    location:
                        typeof location === "string" && location.trim()
                            ? location.trim()
                            : null,

                    involvements: {
                        create: {
                            studentId: studentRecord?.id ?? null,
                            reportedUsn,
                            reportedName,
                            reportedDepartment,
                            reportedSemester,

                            identityStatus: studentRecord
                                ? "IDENTIFIED"
                                : "UNIDENTIFIED",

                            description:
                                identificationMethod === "NO_ID"
                                    ? personDescription.trim()
                                    : null,
                        },
                    },
                },
                include: {
                    involvements: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: appUser.id,
                    collegeId: appUser.collegeId!,
                    action: "REPORT_CREATED",
                    entityType: "REPORT",
                    entityId: createdReport.id,
                    details: {
                        reportNumber: createdReport.reportNumber,
                        category: createdReport.category,
                        identificationMethod,
                    },
                },
            });

            return createdReport;
        });

        res.status(201).json({
            message: "Report created successfully.",
            report,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
