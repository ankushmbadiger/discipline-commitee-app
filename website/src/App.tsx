
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { Box, CircularProgress } from "@mui/material";

import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Login from "./pages/auth/Login";

import { useAuth } from "./context/AuthContext";

import Students from "./pages/dashboard/Students";
import Colleges from "./pages/dashboard/Colleges";
import Users from "./pages/dashboard/Users";
import Reports from "./pages/dashboard/Reports";
import AuditLogs from "./pages/dashboard/AuditLogs";
import StudentVerifications from "./pages/dashboard/StudentVerifications";

function ProtectedRoute() {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!firebaseUser || !appUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { firebaseUser, appUser, loading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress />
              </Box>
            ) : firebaseUser && appUser ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/colleges" element={<Colleges />} />
            <Route path="/students" element={<Students />} />
            <Route
              path="/student-verifications"
              element={<StudentVerifications />}
            />
            <Route path="/users" element={<Users />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
