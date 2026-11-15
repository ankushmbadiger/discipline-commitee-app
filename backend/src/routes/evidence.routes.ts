
import { Router } from "express";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../lib/prisma.js";
import { filebaseClient, filebaseBucket } from "../lib/filebase.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    requireActiveUser,
    requireRole,
} from "../middleware/authorization.middleware.js";


const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            callback(new Error("Only JPEG, PNG, and WebP images are allowed."));
            return;
        }

        callback(null, true);
    },
});


// GET /api/evidence/:reportId
// Publicly retrieve evidence images for a report.
router.get("/:reportId", async (req, res, next) => {
    try {
        const reportIdParam = req.params.reportId;
        const reportId = Array.isArray(reportIdParam)
            ? reportIdParam[0]
            : reportIdParam;

        if (!reportId) {
            res.status(400).json({
                message: "A valid report ID is required.",
            });
            return;
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            select: { id: true },
        });

        if (!report) {
            res.status(404).json({
                message: "Report not found.",
            });
            return;
        }

        const evidence = await prisma.evidence.findMany({
            where: { reportId },
            orderBy: { createdAt: "asc" },
        });

        const images = await Promise.all(
            evidence.map(async (item) => {
                const command = new GetObjectCommand({
                    Bucket: filebaseBucket,
                    Key: item.fileKey,
                });

                const url = await getSignedUrl(
                    filebaseClient,
                    command,
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
        );

        res.json({ images });
    } catch (error) {
        next(error);
    }
});


router.use(authenticate, requireActiveUser, requireRole("COMMITTEE_MEMBER"));

// POST /api/evidence/:reportId
router.post("/:reportId", upload.single("image"), async (req, res, next) => {
    let uploadedKey: string | null = null;

    try {
        const appUser = req.appUser!;
        const reportIdParam = req.params.reportId;
        const reportId = Array.isArray(reportIdParam)
            ? reportIdParam[0]
            : reportIdParam;

        const { kind, involvementId } = req.body;

        if (!reportId) {
            res.status(400).json({
                message: "A valid report ID is required.",
            });
            return;
        }

        if (!appUser.collegeId) {
            res.status(403).json({
                message: "Your account is not assigned to a college.",
            });
            return;
        }

        if (!req.file) {
            res.status(400).json({
                message: "An image file is required.",
            });
            return;
        }

        if (kind !== "IDENTIFICATION" && kind !== "INCIDENT") {
            res.status(400).json({
                message: "Evidence kind must be IDENTIFICATION or INCIDENT.",
            });
            return;
        }

        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                collegeId: appUser.collegeId,
            },
            select: {
                id: true,
            },
        });

        if (!report) {
            res.status(404).json({
                message: "Report not found.",
            });
            return;
        }

        if (involvementId) {
            const involvement = await prisma.reportInvolvement.findFirst({
                where: {
                    id: involvementId,
                    reportId,
                },
                select: {
                    id: true,
                },
            });

            if (!involvement) {
                res.status(400).json({
                    message: "Invalid report involvement.",
                });
                return;
            }
        }

        const extensionByType: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        };

        const extension = extensionByType[req.file.mimetype];
        const fileKey = `${appUser.collegeId}/${reportId}/${randomUUID()}.${extension}`;

        await filebaseClient.send(
            new PutObjectCommand({
                Bucket: filebaseBucket,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        uploadedKey = fileKey;

        const evidence = await prisma.evidence.create({
            data: {
                reportId,
                involvementId: involvementId || null,
                kind,
                fileKey,
                filename: req.file.originalname,
                mimeType: req.file.mimetype,
                fileSize: BigInt(req.file.size),
                uploadedById: appUser.id,
            },
        });

        res.status(201).json({
            message: "Evidence uploaded successfully.",
            evidence: {
                id: evidence.id,
                reportId: evidence.reportId,
                kind: evidence.kind,
                filename: evidence.filename,
                fileSize: evidence.fileSize.toString(),
            },
        });
    } catch (error) {
        if (uploadedKey) {
            try {
                await filebaseClient.send(
                    new DeleteObjectCommand({
                        Bucket: filebaseBucket,
                        Key: uploadedKey,
                    })
                );
            } catch (cleanupError) {
                console.error("Failed to clean up uploaded file:", cleanupError);
            }
        }

        next(error);
    }
});

export default router;
