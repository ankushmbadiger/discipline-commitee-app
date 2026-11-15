
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import {
  AccountBalanceOutlined,
  GroupsOutlined,
  ArticleOutlined,
  AdminPanelSettingsOutlined,
} from "@mui/icons-material";

const stats = [
  {
    title: "Total Colleges",
    value: "—",
    description: "Registered colleges",
    icon: <AccountBalanceOutlined />,
  },
  {
    title: "Total Students",
    value: "—",
    description: "Registered students",
    icon: <GroupsOutlined />,
  },
  {
    title: "Total Reports",
    value: "—",
    description: "Discipline reports",
    icon: <ArticleOutlined />,
  },
  {
    title: "Administrator Accounts",
    value: "—",
    description: "Platform administrators",
    icon: <AdminPanelSettingsOutlined />,
  },
];

export default function Overview() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the Discipline Committee administration dashboard.
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
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
                  <Typography color="text.secondary" variant="body2">
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
                  {stat.value}
                </Typography>

                <Typography variant="caption" color="text.secondary">
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
            Use the sidebar to manage colleges, students, accounts, reports,
            and audit logs.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
