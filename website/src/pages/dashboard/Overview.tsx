
import { useEffect, useState } from "react";
import axios from "axios";

import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
} from "@mui/material";

import {
    AccountBalanceOutlined,
    GroupsOutlined,
    ArticleOutlined,
    AdminPanelSettingsOutlined,
} from "@mui/icons-material";

import api from "../../lib/api"

interface OverviewStats {
    totalColleges: number;
    totalStudents: number;
    totalReports: number;
    totalAdministrators: number;
}

const stats = [
    {
        title: "Total Colleges",
        key: "totalColleges",
        description: "Registered colleges",
        icon: <AccountBalanceOutlined />,
    },
    {
        title: "Total Students",
        key: "totalStudents",
        description: "Registered students",
        icon: <GroupsOutlined />,
    },
    {
        title: "Total Reports",
        key: "totalReports",
        description: "Discipline reports",
        icon: <ArticleOutlined />,
    },
    {
        title: "Administrator Accounts",
        key: "totalAdministrators",
        description: "Platform administrators",
        icon: <AdminPanelSettingsOutlined />,
    },
] as const;

export default function Overview() {
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadOverview = async () => {
            try {
                const response = await api.get("/admin/overview");

                if (cancelled) return;

                setOverview(response.data);
                setError("");
            } catch (err) {
                if (cancelled) return;

                setError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message ||
                              "Unable to load dashboard statistics."
                        : "An unexpected error occurred."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadOverview();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Overview
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Welcome to the Discipline Committee administration dashboard.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {stats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.key}>
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        {stat.title}
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: "#DBEAFE",
                                            color: "primary.main",
                                            borderRadius: 2,
                                            width: 42,
                                            height: 42,
                                        }}
                                    >
                                        {stat.icon}
                                    </Box>
                                </Box>

                                <Typography variant="h4" sx={{ mb: 0.5 }}>
                                    {loading ? (
                                        <CircularProgress size={24} />
                                    ) : overview ? (
                                        overview[stat.key].toLocaleString()
                                    ) : (
                                        "—"
                                    )}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {stat.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Getting started
                    </Typography>

                    <Typography color="text.secondary">
                        Use the sidebar to manage colleges, students, accounts,
                        reports, and audit logs.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
