import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton,
    Chip,
    Tooltip,
} from "@mui/material";

import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import api from "../../lib/api";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";

interface College {
    id: string;
    name: string;
    code: string;
}

interface Student {
    id: string;
    usn: string;
    fullName: string;
    department: string;
    semester: number | null;
    status: "ACTIVE" | "INACTIVE" | "GRADUATED";
    college: College;
}

const initialForm = {
    collegeId: "",
    usn: "",
    fullName: "",
    department: "",
    semester: "",
};

export default function Students() {
    const [students, setStudents] = useState<Student[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [search, setSearch] = useState("");
    const [collegeId, setCollegeId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchColleges = useCallback(async () => {
        try {
            const response = await api.get("/admin/colleges");
            setColleges(response.data.colleges);
        } catch {
            setError("Unable to load colleges.");
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params: Record<string, string> = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (collegeId) {
                params.collegeId = collegeId;
            }

            const response = await api.get("/students", { params });
            setStudents(response.data.students);
        } catch {
            setError("Unable to load students. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [search, collegeId]);

    useEffect(() => {
        fetchColleges();
    }, [fetchColleges]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStudents();
        }, 300);

        return () => clearTimeout(timeout);
    }, [fetchStudents]);

    const openAddDialog = () => {
        setEditingStudent(null);
        setForm({
            ...initialForm,
            collegeId: collegeId,
        });
        setFormError("");
        setDialogOpen(true);
    };

    const openEditDialog = (student: Student) => {
        setEditingStudent(student);
        setForm({
            collegeId: student.college.id,
            usn: student.usn,
            fullName: student.fullName,
            department: student.department,
            semester: student.semester?.toString() ?? "",
        });
        setFormError("");
        setDialogOpen(true);
    };

    const handleStatusChange = async (student: Student) => {
        const newStatus =
            student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        setError("");
        setSuccess("");

        try {
            await api.patch(`/students/${student.id}/status`, {
                status: newStatus,
            });

            setSuccess(
                newStatus === "INACTIVE"
                    ? "Student deactivated successfully."
                    : "Student reactivated successfully."
            );

            await fetchStudents();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message || "Unable to update student status."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        }
    };

    const closeAddDialog = () => {
        if (saving) return;
        setDialogOpen(false);
    };

    const handleAddStudent = async (event: import("react").SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");
        setSuccess("");

        if (!form.collegeId) {
            setFormError("Please select a college.");
            return;
        }

        setSaving(true);

        const studentData = {
            usn: form.usn.trim(),
            fullName: form.fullName.trim(),
            department: form.department.trim(),
            semester: form.semester ? Number(form.semester) : null,
        };

        try {
            if (editingStudent) {
                await api.patch(`/students/${editingStudent.id}`, studentData);
                setSuccess("Student updated successfully.");
            } else {
                await api.post("/students", {
                    collegeId: form.collegeId,
                    ...studentData,
                });
                setSuccess("Student added successfully.");
            }

            setDialogOpen(false);
            setEditingStudent(null);
            setForm(initialForm);
            await fetchStudents();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setFormError(
                    err.response?.data?.message || "Unable to save student."
                );
            } else {
                setFormError("An unexpected error occurred.");
            }
        } finally {
            setSaving(false);
        }
    };
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Students
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                View and manage registered student records across colleges.
            </Typography>

            <Card>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            mb: 3,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                        }}
                    >
                        <TextField
                            label="Search students"
                            placeholder="Search by USN, name or department"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            sx={{ flex: 1, minWidth: 220 }}
                        />

                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <FormControl sx={{ minWidth: 220 }}>
                                <InputLabel>College</InputLabel>

                                <Select
                                    value={collegeId}
                                    label="College"
                                    onChange={(event) => setCollegeId(event.target.value)}
                                >
                                    <MenuItem value="">All colleges</MenuItem>

                                    {colleges.map((college) => (
                                        <MenuItem key={college.id} value={college.id}>
                                            {college.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                startIcon={<AddOutlined />}
                                onClick={openAddDialog}
                            >
                                Add Student
                            </Button>
                        </Box>
                    </Box>

                    {success && (
                        <Alert
                            severity="success"
                            sx={{ mb: 2 }}
                            onClose={() => setSuccess("")}
                        >
                            {success}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>USN</TableCell>
                                        <TableCell>Student Name</TableCell>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Semester</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>College</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                No students found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student) => (
                                            <TableRow key={student.id} hover>
                                                <TableCell>{student.usn}</TableCell>
                                                <TableCell>{student.fullName}</TableCell>
                                                <TableCell>{student.department}</TableCell>
                                                <TableCell>{student.semester ?? "—"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={student.status}
                                                        color={
                                                            student.status === "ACTIVE"
                                                                ? "success"
                                                                : student.status === "INACTIVE"
                                                                    ? "warning"
                                                                    : "default"
                                                        }
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{student.college.name}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Edit student">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => openEditDialog(student)}
                                                            aria-label="Edit student"
                                                        >
                                                            <EditOutlined />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {student.status !== "GRADUATED" && (
                                                        <Tooltip
                                                            title={
                                                                student.status === "ACTIVE"
                                                                    ? "Deactivate student"
                                                                    : "Reactivate student"
                                                            }
                                                        >
                                                            <IconButton
                                                                color={student.status === "ACTIVE" ? "warning" : "success"}
                                                                onClick={() => handleStatusChange(student)}
                                                                aria-label={
                                                                    student.status === "ACTIVE"
                                                                        ? "Deactivate student"
                                                                        : "Reactivate student"
                                                                }
                                                            >
                                                                {student.status === "ACTIVE" ? (
                                                                    <BlockOutlined />
                                                                ) : (
                                                                    <CheckCircleOutlined />
                                                                )}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {!loading && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 2 }}
                        >
                            Showing {students.length} students (maximum 200 per request).
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={dialogOpen}
                onClose={closeAddDialog}
                fullWidth
                maxWidth="sm"
            >
                <Box component="form" onSubmit={handleAddStudent}>
                    <DialogTitle>
                        {editingStudent ? "Edit Student" : "Add Student"}
                    </DialogTitle>

                    <DialogContent>
                        {formError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formError}
                            </Alert>
                        )}

                        <FormControl fullWidth required margin="normal">
                            <InputLabel>College</InputLabel>

                            <Select
                                value={form.collegeId}
                                label="College"
                                onChange={(event) =>
                                    setForm({ ...form, collegeId: event.target.value })
                                }
                            >
                                {colleges.map((college) => (
                                    <MenuItem key={college.id} value={college.id}>
                                        {college.name} ({college.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="USN"
                            fullWidth
                            required
                            margin="normal"
                            value={form.usn}
                            onChange={(event) =>
                                setForm({ ...form, usn: event.target.value })
                            }
                        />

                        <TextField
                            label="Full name"
                            fullWidth
                            required
                            margin="normal"
                            value={form.fullName}
                            onChange={(event) =>
                                setForm({ ...form, fullName: event.target.value })
                            }
                        />

                        <TextField
                            label="Department"
                            fullWidth
                            required
                            margin="normal"
                            value={form.department}
                            onChange={(event) =>
                                setForm({ ...form, department: event.target.value })
                            }
                        />

                        <TextField
                            label="Semester"
                            type="number"
                            fullWidth
                            margin="normal"
                            value={form.semester}
                            onChange={(event) =>
                                setForm({ ...form, semester: event.target.value })
                            }
                            slotProps={{
                                htmlInput: { min: 1, step: 1 },
                            }}
                            helperText="Optional"
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={closeAddDialog} disabled={saving}>
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                        >
                            {saving
                                ? editingStudent
                                    ? "Saving..."
                                    : "Adding..."
                                : editingStudent
                                    ? "Save Changes"
                                    : "Add Student"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
}
