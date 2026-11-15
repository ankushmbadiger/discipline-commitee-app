import { Router } from "express";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import prisma from "../lib/prisma.js"; import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireRole,
} from "../middleware/authorization.middleware.js";
import { filebaseClient, filebaseBucket } from "../lib/filebase.js";
const router = Router();

const categories = [
    "CLASSROOM_DISRUPTION",
    "MISCONDUCT",
    "PROPERTY_DAMAGE",
    "BULLYING",
    "INDISCIPLINE",
    "OTHER",
] as const;

// GET /api/reports
// Public feed of disciplinary reports.
router.get("/", async (_req, res, next) => {
    try {
        const reports = await prisma.report.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                creator: {
                    select: {
                        fullName: true,
                        role: true,
                    },
                },
                college: {
                    select: {
                        name: true,
                    },
                },
                involvements: {
                    select: {
                        reportedName: true,
                        reportedUsn: true,
                        reportedDepartment: true,
                        reportedSemester: true,
                        identityStatus: true,
                        description: true,
                    },
                },
                evidence: {
                    select: {
                        id: true,
                        kind: true,
                        filename: true,
                        mimeType: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        const reportsWithImages = await Promise.all(
            reports.map(async (report) => {
                const evidence = await prisma.evidence.findMany({
                    where: {
                        reportId: report.id,
                    },
                    select: {
                        id: true,
                        fileKey: true,
                        kind: true,
                        filename: true,
                        mimeType: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                });

                return {
                    id: report.id,
                    createdById: report.createdById,
                    reportNumber: report.reportNumber,
                    category: report.category,
                    description: report.description,
                    location: report.location,
                    status: report.status,
                    createdAt: report.createdAt,
                    teacher: report.creator.fullName,
                    teacherRole: report.creator.role,
                    college: report.college.name,
                    involvements: report.involvements,
                    evidence: await Promise.all(
                        evidence.map(async (item) => {
                            const { GetObjectCommand } = await import(
                                "@aws-sdk/client-s3"
                            );
                            const { getSignedUrl } = await import(
                                "@aws-sdk/s3-request-presigner"
                            );

                            const url = await getSignedUrl(
                                filebaseClient,
                                new GetObjectCommand({
                                    Bucket: filebaseBucket,
                                    Key: item.fileKey,
                                }),
                                { expiresIn: 3600 }
                            );

                            return {
                                id: item.id,
                                kind: item.kind,
                                filename: item.filename,
                                mimeType: item.mimeType,
                                url,
                            };
                        })
                    ),
                };
            })
        );

        res.json({
            reports: reportsWithImages,
        });
    } catch (error) {
        next(error);
    }
});



// DELETE /api/reports/:id
// Committee members can delete their own reports.
// Platform admins can delete any report.
router.delete("/:id", authenticate, requireActiveUser, async (req, res, next) => {
    try {
        const appUser = req.appUser!;

        if (
            appUser.role !== "COMMITTEE_MEMBER" &&
            appUser.role !== "PLATFORM_ADMIN"
        ) {
            res.status(403).json({
                message: "You do not have permission to delete reports.",
            });
            return;
        }

        const reportIdParam = req.params.id;
        const reportId = Array.isArray(reportIdParam)
            ? reportIdParam[0]
            : reportIdParam;

        if (!reportId) {
            res.status(400).json({
                message: "A valid report ID is required.",
            });
            return;
        }
        const result = await prisma.$transaction(async (tx) => {
            const report = await tx.report.findUnique({
                where: { id: reportId },
                select: {
                    id: true,
                    reportNumber: true,
                    createdById: true,
                    collegeId: true,
                    evidence: {
                        select: {
                            fileKey: true,
                        },
                    },
                    involvements: {
                        select: {
                            appeals: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!report) {
                return { status: "NOT_FOUND" as const };
            }

            if (
                appUser.role === "COMMITTEE_MEMBER" &&
                report.createdById !== appUser.id
            ) {
                return { status: "FORBIDDEN" as const };
            }

            const hasAppeals = report.involvements.some(
                (involvement) => involvement.appeals.length > 0
            );

            if (hasAppeals) {
                return { status: "HAS_APPEALS" as const };
            }

            await tx.auditLog.create({
                data: {
                    userId: appUser.id,
                    collegeId: report.collegeId,
                    action: "REPORT_DELETED",
                    entityType: "REPORT",
                    entityId: report.id,
                    details: {
                        reportNumber: report.reportNumber,
                        deletedByRole: appUser.role,
                    },
                },
            });

            await tx.report.delete({
                where: { id: report.id },
            });

            return {
                status: "DELETED" as const,
                reportNumber: report.reportNumber,
                fileKeys: report.evidence.map((item) => item.fileKey),
            };
        });

        if (result.status === "NOT_FOUND") {
            res.status(404).json({ message: "Report not found." });
            return;
        }

        if (result.status === "FORBIDDEN") {
            res.status(403).json({
                message: "You can only delete reports created by you.",
            });
            return;
        }

        if (result.status === "HAS_APPEALS") {
            res.status(409).json({
                message: "This report cannot be deleted because it has associated appeals.",
            });
            return;
        }

        // Remove evidence objects from Filebase after the database transaction.
        try {
            for (let i = 0; i < result.fileKeys.length; i += 1000) {
                const batch = result.fileKeys.slice(i, i + 1000);

                const response = await filebaseClient.send(
                    new DeleteObjectsCommand({
                        Bucket: filebaseBucket,
                        Delete: {
                            Objects: batch.map((Key) => ({ Key })),
                            Quiet: true,
                        },
                    })
                );

                if (response.Errors?.length) {
                    console.error(
                        "Some report evidence files could not be deleted from Filebase:",
                        response.Errors
                    );
                }
            }
        } catch (storageError) {
            console.error(
                "Failed to clean up report evidence from Filebase:",
                storageError
            );
        }

        res.json({
            message: "Report deleted successfully.",
            reportNumber: result.reportNumber,
        });
    } catch (error) {
        next(error);
    }
});




// Committee members only: create reports.
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
