
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
import {
    Close,
    Search,
    VisibilityOutlined,
} from "@mui/icons-material";
import api from "../../lib/api";

interface Evidence {
    id: string;
    kind: string;
    filename: string;
    mimeType: string;
    url: string;
}

interface Involvement {
    reportedName: string | null;
    reportedUsn: string | null;
    reportedDepartment: string | null;
    reportedSemester: number | null;
    identityStatus: string;
    description: string | null;
}

interface Report {
    id: string;
    reportNumber: string;
    category: string;
    description: string;
    location: string | null;
    status: string;
    createdAt: string;
    teacher: string;
    teacherRole: string;
    college: string;
    involvements: Involvement[];
    evidence: Evidence[];
}

export default function Reports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/reports");
            setReports(response.data.reports ?? []);
        } catch (err) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || "Failed to load reports."
                    : "An unexpected error occurred."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const filteredReports = reports.filter((report) => {
        const query = search.toLowerCase();

        return [
            report.reportNumber,
            report.category,
            report.description,
            report.teacher,
            report.college,
            ...report.involvements.flatMap((item) => [
                item.reportedName ?? "",
                item.reportedUsn ?? "",
            ]),
        ].some((value) => value.toLowerCase().includes(query));
    });

    const formatLabel = (value: string) =>
        value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );

    const statusColor = (
        status: string
    ): "success" | "warning" | "error" | "default" => {
        if (status === "RESOLVED") return "success";
        if (status === "SUBMITTED") return "warning";
        if (status === "REJECTED") return "error";
        return "default";
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
            >
                <Box>
                    <Typography variant="h5">Reports</Typography>
                    <Typography color="text.secondary" variant="body2">
                        View and inspect disciplinary reports across colleges.
                    </Typography>
                </Box>

                <Chip
                    label={`${reports.length} total reports`}
                    variant="outlined"
                />
            </Stack>

            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search report number, student, USN, teacher or college..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
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
                ) : filteredReports.length === 0 ? (
                    <Box sx={{ textAlign: "center", p: 6 }}>
                        <Typography color="text.secondary">
                            {search ? "No matching reports found." : "No reports have been submitted yet."}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Report</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Student / Person</TableCell>
                                    <TableCell>College</TableCell>
                                    <TableCell>Reported By</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Details</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredReports.map((report) => (
                                    <TableRow key={report.id} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600 }} variant="body2">
                                                {report.reportNumber}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>{formatLabel(report.category)}</TableCell>

                                        <TableCell>
                                            {report.involvements.length > 0
                                                ? report.involvements
                                                    .map((item) => item.reportedName || item.reportedUsn || "Unidentified")
                                                    .join(", ")
                                                : "—"}
                                        </TableCell>

                                        <TableCell>{report.college}</TableCell>
                                        <TableCell>{report.teacher}</TableCell>

                                        <TableCell>
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={formatLabel(report.status)}
                                                color={statusColor(report.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <IconButton
                                                aria-label="View report details"
                                                onClick={() => setSelectedReport(report)}
                                            >
                                                <VisibilityOutlined />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog
                open={Boolean(selectedReport)}
                onClose={() => setSelectedReport(null)}
                fullWidth
                maxWidth="md"
            >
                {selectedReport && (
                    <>
                        <DialogTitle>
                            <Stack
                                direction="row"
                                sx={{ justifyContent: "space-between", alignItems: "center" }}
                            >
                                <Box>
                                    <Typography variant="h6">
                                        {selectedReport.reportNumber}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatLabel(selectedReport.category)}
                                    </Typography>
                                </Box>
                                <IconButton onClick={() => setSelectedReport(null)}>
                                    <Close />
                                </IconButton>
                            </Stack>
                        </DialogTitle>

                        <DialogContent dividers>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                    <Chip
                                        label={formatLabel(selectedReport.status)}
                                        color={statusColor(selectedReport.status)}
                                    />
                                    <Chip label={selectedReport.college} variant="outlined" />
                                </Stack>

                                <Divider />

                                <Typography variant="subtitle2">Incident description</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                    {selectedReport.description}
                                </Typography>

                                <Typography variant="subtitle2">Location</Typography>
                                <Typography variant="body2">
                                    {selectedReport.location || "Not specified"}
                                </Typography>

                                <Divider />

                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Student / Person details
                                </Typography>

                                {selectedReport.involvements.length === 0 ? (
                                    <Typography color="text.secondary" variant="body2">
                                        No involvement details available.
                                    </Typography>
                                ) : (
                                    selectedReport.involvements.map((item, index) => (
                                        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                                            <Stack spacing={1}>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {item.reportedName || "Unidentified person"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    USN: {item.reportedUsn || "Not available"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Department: {item.reportedDepartment || "Not available"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Semester: {item.reportedSemester ?? "Not available"}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={formatLabel(item.identityStatus)}
                                                    sx={{ alignSelf: "flex-start" }}
                                                />
                                                {item.description && (
                                                    <Typography variant="body2">
                                                        Description: {item.description}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))
                                )}

                                <Divider />

                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Report information
                                </Typography>
                                <Typography variant="body2">
                                    Reported by: {selectedReport.teacher}
                                </Typography>
                                <Typography variant="body2">
                                    Date: {new Date(selectedReport.createdAt).toLocaleString()}
                                </Typography>

                                <Divider />

                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Evidence
                                </Typography>

                                {selectedReport.evidence.length === 0 ? (
                                    <Typography color="text.secondary" variant="body2">
                                        No evidence attached.
                                    </Typography>
                                ) : (
                                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
                                        {selectedReport.evidence.map((item) => (
                                            <Box key={item.id} sx={{ maxWidth: 220 }}>
                                                {item.mimeType.startsWith("image/") ? (
                                                    <Box
                                                        component="img"
                                                        src={item.url}
                                                        alt={item.filename}
                                                        sx={{
                                                            width: 200,
                                                            height: 160,
                                                            objectFit: "cover",
                                                            borderRadius: 1,
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2">
                                                        {item.filename}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" sx={{ display: "block" }}>
                                                    {item.filename}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Stack>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
