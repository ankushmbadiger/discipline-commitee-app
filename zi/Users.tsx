
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import api from "../../lib/api";

interface College {
    id: string;
    name: string;
    code: string;
}

interface AppUser {
    id: string;
    fullName: string;
    email: string;
    role: string;
    accountStatus: string;
    createdAt: string;
    college: College | null;
}

const roles = [
    "STUDENT",
    "COMMITTEE_MEMBER",
    "COLLEGE_ADMIN",
    "PLATFORM_ADMIN",
];

const statuses = ["ACTIVE", "SUSPENDED", "DISABLED"];

function getStatusColor(status: string) {
    if (status === "ACTIVE") return "success";
    if (status === "SUSPENDED") return "warning";
    return "error";
}

export default function Users() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [collegeId, setCollegeId] = useState("");
    const [accountStatus, setAccountStatus] = useState("");

    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState("");

    // Committee member creation state
    const [createOpen, setCreateOpen] = useState(false);
    const [createRole, setCreateRole] = useState<
        "COMMITTEE_MEMBER" | "COLLEGE_ADMIN"
    >("COMMITTEE_MEMBER");
    const [creating, setCreating] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newCollegeCode, setNewCollegeCode] = useState("");

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/users", {
                params: {
                    search: search || undefined,
                    role: role || undefined,
                    collegeId: collegeId || undefined,
                    accountStatus: accountStatus || undefined,
                },
            });

            setUsers(response.data.users || []);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message || "Unable to load users."
                );
            } else {
                setError("Unable to load users.");
            }
        } finally {
            setLoading(false);
        }
    }, [search, role, collegeId, accountStatus]);

    const fetchColleges = useCallback(async () => {
        try {
            const response = await api.get("/admin/colleges");
            setColleges(response.data.colleges || []);
        } catch {
            setError("Unable to load colleges.");
        }
    }, []);

    useEffect(() => {
        fetchColleges();
    }, [fetchColleges]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(timeout);
    }, [fetchUsers]);

    const handleStatusUpdate = async () => {
        if (!selectedUser || !newStatus) return;

        try {
            setUpdating(true);
            setError("");
            setSuccess("");

            await api.patch(`/admin/users/${selectedUser.id}/status`, {
                accountStatus: newStatus,
            });

            setSuccess(
                `${selectedUser.fullName}'s account status updated successfully.`
            );

            setSelectedUser(null);
            setNewStatus("");
            await fetchUsers();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Unable to update account status."
                );
            } else {
                setError("Unable to update account status.");
            }
        } finally {
            setUpdating(false);
        }
    };

    const openStatusDialog = (user: AppUser) => {
        setSelectedUser(user);
        setNewStatus(user.accountStatus);
        setError("");
        setSuccess("");
    };

    const openCreateDialog = () => {
        setCreateRole("COMMITTEE_MEMBER");
        setNewFullName("");
        setNewEmail("");
        setNewPassword("");
        setNewCollegeCode("");
        setError("");
        setSuccess("");
        setCreateOpen(true);
    };

    const handleCreateAccount = async () => {
        if (
            !newFullName.trim() ||
            !newEmail.trim() ||
            !newPassword ||
            !newCollegeCode
        ) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setCreating(true);
            setError("");
            setSuccess("");

            const endpoint =
                createRole === "COLLEGE_ADMIN"
                    ? "/admin/college-admins"
                    : "/admin/committee-members";

            const response = await api.post(endpoint, {
                fullName: newFullName.trim(),
                email: newEmail.trim(),
                password: newPassword,
                collegeCode: newCollegeCode,
            });

            setCreateOpen(false);
            setNewFullName("");
            setNewEmail("");
            setNewPassword("");
            setNewCollegeCode("");

            setSuccess(
                response.data.message ||
                (createRole === "COLLEGE_ADMIN"
                    ? "College Admin created successfully."
                    : "Committee Member created successfully.")
            );

            await fetchUsers();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Unable to create committee member."
                );
            } else {
                setError("Unable to create committee member.");
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                    mb: 3,
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                }}
                spacing={2}
            >                <Box>
                    <Typography variant="h4" gutterBottom>
                        Users
                    </Typography>
                    <Typography color="text.secondary">
                        Manage registered users and their account access.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={openCreateDialog}
                >
                    Create Account
                </Button>
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError("")}
                >
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

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                >
                    <TextField
                        label="Search name or email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        fullWidth
                        size="small"
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={role}
                            label="Role"
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <MenuItem value="">All roles</MenuItem>
                            {roles.map((item) => (
                                <MenuItem key={item} value={item}>
                                    {item.replaceAll("_", " ")}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>College</InputLabel>
                        <Select
                            value={collegeId}
                            label="College"
                            onChange={(e) => setCollegeId(e.target.value)}
                        >
                            <MenuItem value="">All colleges</MenuItem>
                            {colleges.map((college) => (
                                <MenuItem key={college.id} value={college.id}>
                                    {college.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={accountStatus}
                            label="Status"
                            onChange={(e) => setAccountStatus(e.target.value)}
                        >
                            <MenuItem value="">All statuses</MenuItem>
                            {statuses.map((item) => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setSearch("");
                            setRole("");
                            setCollegeId("");
                            setAccountStatus("");
                        }}
                    >
                        Clear
                    </Button>
                </Stack>
            </Paper>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {users.length} user{users.length !== 1 ? "s" : ""} found
                    {users.length === 200
                        ? " (maximum result limit reached)"
                        : ""}
                </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>User</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                            <TableCell><strong>College</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Joined</strong></TableCell>
                            <TableCell align="right">
                                <strong>Actions</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    align="center"
                                    sx={{ py: 5 }}
                                >
                                    <CircularProgress size={28} />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    align="center"
                                    sx={{ py: 5 }}
                                >
                                    <Typography color="text.secondary">
                                        No users found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {user.fullName}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {user.email}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        {user.role.replaceAll("_", " ")}
                                    </TableCell>

                                    <TableCell>
                                        {user.college
                                            ? `${user.college.name} (${user.college.code})`
                                            : "—"}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={user.accountStatus}
                                            color={getStatusColor(
                                                user.accountStatus
                                            )}
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        {new Date(
                                            user.createdAt
                                        ).toLocaleDateString()}
                                    </TableCell>

                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() =>
                                                openStatusDialog(user)
                                            }
                                            disabled={
                                                user.role === "PLATFORM_ADMIN"
                                            }
                                        >
                                            Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create committee member dialog */}
            <Dialog
                open={createOpen}
                onClose={() => {
                    if (!creating) setCreateOpen(false);
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {createRole === "COLLEGE_ADMIN"
                        ? "Create College Admin"
                        : "Create Committee Member"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {createRole === "COLLEGE_ADMIN"
                            ? "Create an administrator account to manage users and student verifications for the selected college."
                            : "Create a teacher account for your college's discipline committee."}
                    </DialogContentText>

                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Account role</InputLabel>
                            <Select
                                value={createRole}
                                label="Account role"
                                onChange={(e) =>
                                    setCreateRole(
                                        e.target.value as
                                        | "COMMITTEE_MEMBER"
                                        | "COLLEGE_ADMIN"
                                    )
                                }
                            >
                                <MenuItem value="COMMITTEE_MEMBER">
                                    Committee Member
                                </MenuItem>
                                <MenuItem value="COLLEGE_ADMIN">
                                    College Admin
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Full name"
                            value={newFullName}
                            onChange={(e) =>
                                setNewFullName(e.target.value)
                            }
                            fullWidth
                            required
                        />


                        <TextField
                            label="Email address"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Temporary password"
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            fullWidth
                            required
                            helperText="Share this password securely with the committee member."
                        />

                        <FormControl fullWidth required>
                            <InputLabel>College</InputLabel>
                            <Select
                                value={newCollegeCode}
                                label="College"
                                onChange={(e) =>
                                    setNewCollegeCode(e.target.value)
                                }
                            >
                                {colleges.map((college) => (
                                    <MenuItem
                                        key={college.id}
                                        value={college.code}
                                    >
                                        {college.name} ({college.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setCreateOpen(false)}
                        disabled={creating}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleCreateAccount}
                        disabled={
                            creating ||
                            !newFullName.trim() ||
                            !newEmail.trim() ||
                            !newPassword ||
                            !newCollegeCode
                        }
                    >
                        {creating
                            ? "Creating..."
                            : createRole === "COLLEGE_ADMIN"
                                ? "Create College Admin"
                                : "Create Committee Member"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage user status dialog */}
            <Dialog
                open={Boolean(selectedUser)}
                onClose={() => {
                    if (!updating) setSelectedUser(null);
                }}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Manage user account</DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Change the account status for{" "}
                        <strong>{selectedUser?.fullName}</strong>.
                    </DialogContentText>

                    <FormControl fullWidth>
                        <InputLabel>Account status</InputLabel>
                        <Select
                            value={newStatus}
                            label="Account status"
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            {statuses.map((item) => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {newStatus !== selectedUser?.accountStatus && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This change will affect the user's ability to sign
                            in.
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setSelectedUser(null)}
                        disabled={updating}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleStatusUpdate}
                        disabled={
                            updating ||
                            !newStatus ||
                            newStatus === selectedUser?.accountStatus
                        }
                    >
                        {updating ? "Updating..." : "Save changes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
