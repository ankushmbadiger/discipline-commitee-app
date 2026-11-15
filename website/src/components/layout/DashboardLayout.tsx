
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip,
    Typography,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    DashboardOutlined,
    AccountBalanceOutlined,
    GroupsOutlined,
    ManageAccountsOutlined,
    ArticleOutlined,
    HistoryOutlined,
    LightModeOutlined,
    DarkModeOutlined,
    LogoutOutlined,
} from "@mui/icons-material";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
const drawerWidth = 250;

const navigation = [
    { label: "Overview", path: "/", icon: <DashboardOutlined /> },
    { label: "Colleges", path: "/colleges", icon: <AccountBalanceOutlined /> },
    { label: "Students", path: "/students", icon: <GroupsOutlined /> },
    { label: "Users", path: "/users", icon: <ManageAccountsOutlined /> },
    { label: "Reports", path: "/reports", icon: <ArticleOutlined /> },
    { label: "Audit Logs", path: "/audit-logs", icon: <HistoryOutlined /> },
];

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { mode, toggleMode } = useThemeMode();

    const { appUser, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleLogout = async () => {
        setAnchorEl(null);
        await logout();
    };
    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h6">
                        Discipline Committee
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
                            <IconButton onClick={toggleMode} color="inherit">
                                {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
                            </IconButton>
                        </Tooltip>

                        <Typography variant="body2" color="text.secondary">
                            {appUser?.fullName}
                        </Typography>

                        <Tooltip title="Account options">
                            <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                                <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
                                    {appUser?.fullName?.charAt(0).toUpperCase() || "A"}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            <MenuItem onClick={handleLogout}>
                                <LogoutOutlined fontSize="small" sx={{ mr: 1.5 }} />
                                Sign out
                            </MenuItem>
                        </Menu>
                    </Box>                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        bgcolor: "background.paper",
                        borderRight: 1,
                        borderColor: "divider",
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
                                    bgcolor: "action.selected",
                                    color: "primary.main",
                                },
                                "&.Mui-selected .MuiListItemIcon-root": {
                                    color: "primary.main",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
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
