
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlined from "@mui/icons-material/CancelOutlined";

import api from "../../lib/api";

interface Verification {
    id: string;
    requestedUsn: string;
    requestedFullName: string;
    requestedDepartment: string | null;
    requestedSemester: number | null;
    createdAt: string;
    requester: {
        id: string;
        fullName: string;
        email: string;
        college: {
            id: string;
            name: string;
            code: string;
        } | null;
    };
}

const initialApprovalForm = {
    department: "",
    semester: "",
};

export default function StudentVerifications() {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selected, setSelected] = useState<Verification | null>(null);
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [rejectionOpen, setRejectionOpen] = useState(false);

    const [approvalForm, setApprovalForm] = useState(initialApprovalForm);
    const [rejectionReason, setRejectionReason] = useState("");

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchVerifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/student-verifications");
            setVerifications(response.data.verifications ?? []);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load student verification requests."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const openApproval = (verification: Verification) => {
        setSelected(verification);
        setApprovalForm({
            department: verification.requestedDepartment ?? "",
            semester: verification.requestedSemester?.toString() ?? "",
        });
        setFormError("");
        setApprovalOpen(true);
    };

    const openRejection = (verification: Verification) => {
        setSelected(verification);
        setRejectionReason("");
        setFormError("");
        setRejectionOpen(true);
    };

    const handleApprove = async () => {
        if (!selected) return;

        const department = approvalForm.department.trim();
        const semester = approvalForm.semester.trim();

        if (!department) {
            setFormError("Department is required to approve this request.");
            return;
        }

        if (
            semester &&
            (!Number.isInteger(Number(semester)) ||
                Number(semester) < 1 ||
                Number(semester) > 12)
        ) {
            setFormError("Semester must be between 1 and 12.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            await api.post(
                `/admin/student-verifications/${selected.id}/approve`,
                {
                    department,
                    ...(semester ? { semester: Number(semester) } : {}),
                }
            );

            setApprovalOpen(false);
            setSelected(null);
            setSuccess(
                `${selected.requestedFullName} has been verified successfully.`
            );

            await fetchVerifications();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setFormError(
                    err.response?.data?.message ||
                    "Unable to approve this verification request."
                );
            } else {
                setFormError("An unexpected error occurred.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selected) return;

        const reason = rejectionReason.trim();

        if (reason.length < 3) {
            setFormError("Please enter a reason of at least 3 characters.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            await api.post(
                `/admin/student-verifications/${selected.id}/reject`,
                { reason }
            );

            setRejectionOpen(false);
            setSelected(null);
            setSuccess(
                `${selected.requestedFullName}'s verification request was rejected.`
            );

            await fetchVerifications();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setFormError(
                    err.response?.data?.message ||
                    "Unable to reject this verification request."
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
            <Stack
                direction="row"
                sx={{
                    mb: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Student Verifications
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Review and approve student account verification requests.
                    </Typography>
                </Box>

                <Tooltip title="Refresh requests">
                    <span>
                        <IconButton
                            onClick={fetchVerifications}
                            disabled={loading}
                            color="primary"
                        >
                            <RefreshOutlined />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    onClose={() => setSuccess("")}
                >
                    {success}
                </Alert>
            )}

            <Card variant="outlined">
                <CardContent>
                    <Stack
                        direction="row"
                        sx={{
                            mb: 2,
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Pending Requests
                        </Typography>

                        <Chip
                            label={`${verifications.length} pending`}
                            color={verifications.length ? "warning" : "default"}
                            size="small"
                        />
                    </Stack>

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : verifications.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 6 }}>
                            <CheckCircleOutlined
                                color="success"
                                sx={{ fontSize: 42, mb: 1 }}
                            />
                            <Typography sx={{ fontWeight: 600 }}>
                                No pending verification requests
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                New student requests will appear here.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Student</TableCell>
                                        <TableCell>College</TableCell>
                                        <TableCell>Academic Details</TableCell>
                                        <TableCell>Requested</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {verifications.map((verification) => (
                                        <TableRow key={verification.id} hover>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {verification.requestedFullName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {verification.requestedUsn}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {verification.requester.email}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {verification.requester.college?.name ?? "Not associated"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {verification.requester.college?.code ?? ""}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {verification.requestedDepartment || "Department not provided"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {verification.requestedSemester
                                                        ? `Semester ${verification.requestedSemester}`
                                                        : "Semester not provided"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(verification.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ justifyContent: "flex-end" }}
                                                >
                                                    <Tooltip title="Approve">
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => openApproval(verification)}
                                                        >
                                                            <CheckCircleOutlined />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Reject">
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => openRejection(verification)}
                                                        >
                                                            <CancelOutlined />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={approvalOpen}
                onClose={() => !saving && setApprovalOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Approve Student Verification</DialogTitle>

                <DialogContent>
                    {selected && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 600 }}>
                                {selected.requestedFullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selected.requestedUsn} · {selected.requester.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selected.requester.college?.name ?? "No associated college"}
                            </Typography>
                        </Box>
                    )}

                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Department"
                            fullWidth
                            required
                            value={approvalForm.department}
                            onChange={(event) =>
                                setApprovalForm((previous) => ({
                                    ...previous,
                                    department: event.target.value,
                                }))
                            }
                        />

                        <TextField
                            label="Semester"
                            type="number"
                            fullWidth
                            value={approvalForm.semester}
                            slotProps={{
                                htmlInput: { min: 1, max: 12 },
                            }}
                            onChange={(event) =>
                                setApprovalForm((previous) => ({
                                    ...previous,
                                    semester: event.target.value,
                                }))
                            }
                            helperText="Optional. Enter a value between 1 and 12."
                        />
                    </Stack>

                    {formError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {formError}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setApprovalOpen(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleApprove}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={22} /> : "Approve"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={rejectionOpen}
                onClose={() => !saving && setRejectionOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Reject Student Verification</DialogTitle>

                <DialogContent>
                    {selected && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Rejecting {selected.requestedFullName} ({selected.requestedUsn}).
                        </Typography>
                    )}

                    <TextField
                        label="Reason for rejection"
                        fullWidth
                        required
                        multiline
                        minRows={3}
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        helperText="This reason will be sent to the student."
                    />

                    {formError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {formError}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setRejectionOpen(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReject}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={22} /> : "Reject"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
