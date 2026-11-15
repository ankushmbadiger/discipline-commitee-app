
import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  requireActiveUser,
  requireRole,
} from "../middleware/authorization.middleware.js";

const router = Router();

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function handleDatabaseError(error: unknown, res: any) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res.status(409).json({
      message: "A student with this USN already exists in this college.",
    });
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    res.status(400).json({ message: "Invalid college reference." });
    return true;
  }

  return false;
}

// All student-management routes require an active administrator.
router.use(
  authenticate,
  requireActiveUser,
  requireRole("PLATFORM_ADMIN", "COLLEGE_ADMIN")
);

// GET /api/students?search=...
// Platform Admin can list across colleges or filter by collegeId.
// College Admin is always restricted to their own college.
router.get("/", async (req, res, next) => {
  try {
    const appUser = req.appUser!;

    let collegeId: string | undefined;

    if (appUser.role === "COLLEGE_ADMIN") {
      if (!appUser.collegeId) {
        res.status(403).json({ message: "Your account has no college assigned." });
        return;
      }

      collegeId = appUser.collegeId;
    } else if (typeof req.query.collegeId === "string") {
      if (!isUuid(req.query.collegeId)) {
        res.status(400).json({ message: "Invalid college ID." });
        return;
      }

      collegeId = req.query.collegeId;
    }

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const students = await prisma.student.findMany({
      where: {
        ...(collegeId ? { collegeId } : {}),
        ...(search
          ? {
              OR: [
                { usn: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
                { department: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
      take: 200,
    });

    res.json({ students });
  } catch (error) {
    next(error);
  }
});

// POST /api/students
router.post("/", async (req, res, next) => {
  try {
    const appUser = req.appUser!;

    const { usn, fullName, department, semester } = req.body;

    if (
      typeof usn !== "string" ||
      !usn.trim() ||
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof department !== "string" ||
      !department.trim()
    ) {
      res.status(400).json({
        message: "USN, full name and department are required.",
      });
      return;
    }

    if (
      semester !== undefined &&
      semester !== null &&
      (!Number.isInteger(semester) || semester < 1)
    ) {
      res.status(400).json({
        message: "Semester must be a positive integer.",
      });
      return;
    }

    let collegeId: string;

    if (appUser.role === "COLLEGE_ADMIN") {
      if (!appUser.collegeId) {
        res.status(403).json({ message: "Your account has no college assigned." });
        return;
      }

      collegeId = appUser.collegeId;
    } else {
      if (
        typeof req.body.collegeId !== "string" ||
        !isUuid(req.body.collegeId)
      ) {
        res.status(400).json({
          message: "A valid collegeId is required.",
        });
        return;
      }

      collegeId = req.body.collegeId;
    }

    const student = await prisma.$transaction(async (tx) => {
      const createdStudent = await tx.student.create({
        data: {
          collegeId,
          usn: usn.trim().toUpperCase(),
          fullName: fullName.trim(),
          department: department.trim(),
          semester: semester ?? null,
        },
        include: {
          college: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: appUser.id,
          collegeId,
          action: "STUDENT_CREATED",
          entityType: "STUDENT",
          entityId: createdStudent.id,
          details: {
            usn: createdStudent.usn,
            fullName: createdStudent.fullName,
          },
        },
      });

      return createdStudent;
    });

    res.status(201).json({
      message: "Student added successfully.",
      student,
    });
  } catch (error) {
    if (handleDatabaseError(error, res)) return;
    next(error);
  }
});

// PATCH /api/students/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const appUser = req.appUser!;
    const studentId = req.params.id;

    if (!isUuid(studentId)) {
      res.status(400).json({ message: "Invalid student ID." });
      return;
    }

    const { usn, fullName, department, semester } = req.body;

    if (
      usn !== undefined &&
      (typeof usn !== "string" || !usn.trim())
    ) {
      res.status(400).json({ message: "USN cannot be empty." });
      return;
    }

    if (
      fullName !== undefined &&
      (typeof fullName !== "string" || !fullName.trim())
    ) {
      res.status(400).json({ message: "Full name cannot be empty." });
      return;
    }

    if (
      department !== undefined &&
      (typeof department !== "string" || !department.trim())
    ) {
      res.status(400).json({ message: "Department cannot be empty." });
      return;
    }

    if (
      semester !== undefined &&
      semester !== null &&
      (!Number.isInteger(semester) || semester < 1)
    ) {
      res.status(400).json({
        message: "Semester must be a positive integer.",
      });
      return;
    }

    const scope =
      appUser.role === "COLLEGE_ADMIN"
        ? { id: studentId, collegeId: appUser.collegeId ?? "" }
        : { id: studentId };

    const existingStudent = await prisma.student.findFirst({
      where: scope,
    });

    if (!existingStudent) {
      res.status(404).json({ message: "Student not found." });
      return;
    }

    const student = await prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          ...(usn !== undefined ? { usn: usn.trim().toUpperCase() } : {}),
          ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
          ...(department !== undefined ? { department: department.trim() } : {}),
          ...(semester !== undefined ? { semester } : {}),
        },
        include: {
          college: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: appUser.id,
          collegeId: existingStudent.collegeId,
          action: "STUDENT_UPDATED",
          entityType: "STUDENT",
          entityId: studentId,
          details: {
            updatedFields: Object.keys(req.body).filter((field) =>
              ["usn", "fullName", "department", "semester"].includes(field)
            ),
          },
        },
      });

      return updatedStudent;
    });

    res.json({
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    if (handleDatabaseError(error, res)) return;
    next(error);
  }
});

export default router;
