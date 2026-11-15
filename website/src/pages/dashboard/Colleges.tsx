
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
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";

import api from "../../lib/api";

interface College {
    id: string;
    name: string;
    code: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    _count: {
        students: number;
    };
}

const initialForm = {
    name: "",
    code: "",
};

export default function Colleges() {
    const [colleges, setColleges] = useState<College[]>([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCollege, setEditingCollege] = useState<College | null>(null);
    const [form, setForm] = useState(initialForm);

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchColleges = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/colleges");
            setColleges(response.data.colleges);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message || "Unable to load colleges."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchColleges();
    }, [fetchColleges]);

    const filteredColleges = colleges.filter((college) => {
        const query = search.trim().toLowerCase();

        return (
            college.name.toLowerCase().includes(query) ||
            college.code.toLowerCase().includes(query)
        );
    });

    const openAddDialog = () => {
        setEditingCollege(null);
        setForm(initialForm);
        setFormError("");
        setDialogOpen(true);
    };

    const openEditDialog = (college: College) => {
        setEditingCollege(college);
        setForm({
            name: college.name,
            code: college.code,
        });
        setFormError("");
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (saving) return;
        setDialogOpen(false);
    };

    const handleSaveCollege = async (
        event: import("react").FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setFormError("");
        setSuccess("");

        const name = form.name.trim();
        const code = form.code.trim().toUpperCase();

        if (!name || !code) {
            setFormError("Please enter both college name and code.");
            return;
        }

        setSaving(true);

        try {
            if (editingCollege) {
                await api.patch(`/admin/colleges/${editingCollege.id}`, {
                    name,
                    code,
                });

                setSuccess("College updated successfully.");
            } else {
                await api.post("/admin/colleges", {
                    name,
                    code,
                });

                setSuccess("College added successfully.");
            }

            setDialogOpen(false);
            setEditingCollege(null);
            setForm(initialForm);

            await fetchColleges();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setFormError(
                    err.response?.data?.message || "Unable to save college."
                );
            } else {
                setFormError("An unexpected error occurred.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (college: College) => {
        const newStatus =
            college.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        setError("");
        setSuccess("");

        try {
            await api.patch(`/admin/colleges/${college.id}/status`, {
                status: newStatus,
            });

            setSuccess(
                newStatus === "INACTIVE"
                    ? "College deactivated successfully."
                    : "College reactivated successfully."
            );

            await fetchColleges();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Unable to update college status."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Colleges
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                View and manage colleges registered on the platform.
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
                            label="Search colleges"
                            placeholder="Search by college name or code"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            sx={{ flex: 1, minWidth: 220 }}
                        />

                        <Button
                            variant="contained"
                            startIcon={<AddOutlined />}
                            onClick={openAddDialog}
                        >
                            Add College
                        </Button>
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
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 6,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>College Name</TableCell>
                                        <TableCell>College Code</TableCell>
                                        <TableCell>Students</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell align="right">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredColleges.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                align="center"
                                            >
                                                No colleges found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredColleges.map((college) => (
                                            <TableRow
                                                key={college.id}
                                                hover
                                            >
                                                <TableCell>
                                                    {college.name}
                                                </TableCell>

                                                <TableCell>
                                                    {college.code}
                                                </TableCell>

                                                <TableCell>
                                                    {college._count.students}
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={college.status}
                                                        color={
                                                            college.status === "ACTIVE"
                                                                ? "success"
                                                                : "warning"
                                                        }
                                                        variant="outlined"
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    {new Date(
                                                        college.createdAt
                                                    ).toLocaleDateString()}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Tooltip title="Edit college">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() =>
                                                                openEditDialog(college)
                                                            }
                                                            aria-label="Edit college"
                                                        >
                                                            <EditOutlined />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={
                                                            college.status === "ACTIVE"
                                                                ? "Deactivate college"
                                                                : "Reactivate college"
                                                        }
                                                    >
                                                        <IconButton
                                                            color={
                                                                college.status === "ACTIVE"
                                                                    ? "warning"
                                                                    : "success"
                                                            }
                                                            onClick={() =>
                                                                handleStatusChange(college)
                                                            }
                                                            aria-label={
                                                                college.status === "ACTIVE"
                                                                    ? "Deactivate college"
                                                                    : "Reactivate college"
                                                            }
                                                        >
                                                            {college.status === "ACTIVE" ? (
                                                                <BlockOutlined />
                                                            ) : (
                                                                <CheckCircleOutlined />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
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
                            Showing {filteredColleges.length} of {colleges.length} colleges.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                fullWidth
                maxWidth="sm"
            >
                <Box component="form" onSubmit={handleSaveCollege}>
                    <DialogTitle>
                        {editingCollege ? "Edit College" : "Add College"}
                    </DialogTitle>

                    <DialogContent>
                        {formError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formError}
                            </Alert>
                        )}

                        <TextField
                            label="College Name"
                            fullWidth
                            required
                            margin="normal"
                            value={form.name}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    name: event.target.value,
                                })
                            }
                        />

                        <TextField
                            label="College Code"
                            fullWidth
                            required
                            margin="normal"
                            value={form.code}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    code: event.target.value.toUpperCase(),
                                })
                            }
                            helperText="2–20 characters: letters, numbers, hyphens or underscores."
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={closeDialog} disabled={saving}>
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingCollege
                                    ? "Save Changes"
                                    : "Add College"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
}
