
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material";

import {
    DashboardOutlined,
    AccountBalanceOutlined,
    GroupsOutlined,
    ManageAccountsOutlined,
    ArticleOutlined,
    HistoryOutlined,
} from "@mui/icons-material";

import { Outlet, useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 250;

const navigation = [
    { label: "Overview", path: "/", icon: <DashboardOutlined /> },
    { label: "Colleges", path: "/colleges", icon: <AccountBalanceOutlined /> },
    { label: "Students", path: "/students", icon: <GroupsOutlined /> },
    { label: "Accounts", path: "/accounts", icon: <ManageAccountsOutlined /> },
    { label: "Reports", path: "/reports", icon: <ArticleOutlined /> },
    { label: "Audit Logs", path: "/audit-logs", icon: <HistoryOutlined /> },
];

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    borderBottom: "1px solid #E2E8F0",
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h6">
                        Discipline Committee
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Platform Administrator
                        </Typography>
                        <Avatar sx={{ bgcolor: "primary.main" }}>A</Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        borderRight: "1px solid #E2E8F0",
                    },
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                    >
                        DC Admin
                    </Typography>
                </Toolbar>

                <Divider />

                <List sx={{ px: 1.5, py: 2 }}>
                    {navigation.map((item) => (
                        <ListItemButton
                            key={item.path}
                            selected={location.pathname === item.path}
                            onClick={() => navigate(item.path)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                "&.Mui-selected": {
                                    bgcolor: "#DBEAFE",
                                    color: "#2563EB",
                                },
                                "&.Mui-selected .MuiListItemIcon-root": {
                                    color: "#2563EB",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    bgcolor: "background.default",
                    p: 3,
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
