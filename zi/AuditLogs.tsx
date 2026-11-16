
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
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
import { Close, Search, VisibilityOutlined } from "@mui/icons-material";
import api from "../../lib/api";

interface AuditLog {
    id: string;
    userId: string | null;
    collegeId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    } | null;
    college: {
        id: string;
        name: string;
        code: string;
    } | null;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [entityType, setEntityType] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/audit-logs", {
                params: {
                    search: search.trim() || undefined,
                    action: action || undefined,
                    entityType: entityType || undefined,
                    page: pagination.page,
                },
            });

            setLogs(response.data.auditLogs ?? []);
            setPagination(response.data.pagination);
        } catch (err) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || "Failed to load audit logs."
                    : "An unexpected error occurred."
            );
        } finally {
            setLoading(false);
        }
    }, [search, action, entityType, pagination.page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatLabel = (value: string) =>
        value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );

    const formatDate = (value: string) =>
        new Date(value).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });

    const uniqueActions = [...new Set(logs.map((log) => log.action))].sort();
    const uniqueEntityTypes = [
        ...new Set(logs.map((log) => log.entityType)),
    ].sort();

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
            >
                <Box>
                    <Typography variant="h5">Audit Logs</Typography>
                    <Typography color="text.secondary" variant="body2">
                        Monitor administrative actions and changes across the platform.
                    </Typography>
                </Box>

                <Chip
                    label={`${pagination.total} total events`}
                    variant="outlined"
                />
            </Stack>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search action, entity, user or email..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPagination((current) => ({
                                ...current,
                                page: 1,
                            }));
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <TextField
                        select
                        size="small"
                        label="Action"
                        value={action}
                        onChange={(event) => {
                            setAction(event.target.value);
                            setPagination((current) => ({
                                ...current,
                                page: 1,
                            }));
                        }}
                        sx={{ minWidth: { md: 200 } }}
                    >
                        <MenuItem value="">All actions</MenuItem>
                        {uniqueActions.map((item) => (
                            <MenuItem key={item} value={item}>
                                {formatLabel(item)}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Entity type"
                        value={entityType}
                        onChange={(event) => {
                            setEntityType(event.target.value);
                            setPagination((current) => ({
                                ...current,
                                page: 1,
                            }));
                        }}
                        sx={{ minWidth: { md: 180 } }}
                    >
                        <MenuItem value="">All entities</MenuItem>
                        {uniqueEntityTypes.map((item) => (
                            <MenuItem key={item} value={item}>
                                {formatLabel(item)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : logs.length === 0 ? (
                    <Box sx={{ textAlign: "center", p: 6 }}>
                        <Typography variant="h6" gutterBottom>
                            No audit logs found
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            Administrative activities will appear here when they occur.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Performed By</TableCell>
                                        <TableCell>Entity</TableCell>
                                        <TableCell>College</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Details</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatLabel(log.action)}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {log.user?.fullName ?? "Deleted user"}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {log.user?.email ?? "Unavailable"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={formatLabel(log.entityType)}
                                                    variant="outlined"
                                                />
                                                {log.entityId && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ display: "block" }}
                                                        color="text.secondary"
                                                    >
                                                        {log.entityId.slice(0, 8)}...
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {log.college?.name ?? "Platform"}
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(log.createdAt)}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setSelectedLog(log)}
                                                    aria-label="View audit log details"
                                                >
                                                    <VisibilityOutlined fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider />

                        <Stack
                            direction="row"
                            sx={{
                                p: 2,
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                            spacing={2}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Page {pagination.page} of {pagination.totalPages}
                                {" · "}
                                {pagination.total} records
                            </Typography>

                            <Pagination
                                count={Math.max(1, pagination.totalPages)}
                                page={pagination.page}
                                onChange={(_, page) =>
                                    setPagination((current) => ({
                                        ...current,
                                        page,
                                    }))
                                }
                                color="primary"
                                size="small"
                            />
                        </Stack>
                    </>
                )}
            </Paper>

            <Dialog
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Audit Log Details
                        <IconButton onClick={() => setSelectedLog(null)}>
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers>
                    {selectedLog && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Action
                                </Typography>
                                <Typography sx={{ fontWeight: 600 }}>
                                    {formatLabel(selectedLog.action)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Performed by
                                </Typography>
                                <Typography>
                                    {selectedLog.user?.fullName ?? "Deleted user"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedLog.user?.email ?? "Unavailable"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Role
                                </Typography>
                                <Typography>
                                    {selectedLog.user
                                        ? formatLabel(selectedLog.user.role)
                                        : "Unavailable"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Entity
                                </Typography>
                                <Typography>
                                    {formatLabel(selectedLog.entityType)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedLog.entityId ?? "No entity ID"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    College
                                </Typography>
                                <Typography>
                                    {selectedLog.college?.name ?? "Platform"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Timestamp
                                </Typography>
                                <Typography>
                                    {formatDate(selectedLog.createdAt)}
                                </Typography>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Additional Details
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        overflowX: "auto",
                                        bgcolor: "action.hover",
                                    }}
                                >
                                    <Typography
                                        component="pre"
                                        variant="body2"
                                        sx={{
                                            m: 0,
                                            whiteSpace: "pre-wrap",
                                            overflowWrap: "anywhere",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        {selectedLog.details
                                            ? JSON.stringify(selectedLog.details, null, 2)
                                            : "No additional details"}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
