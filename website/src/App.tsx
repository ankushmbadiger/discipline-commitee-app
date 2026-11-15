
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { Box, CircularProgress } from "@mui/material";

import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Login from "./pages/auth/Login";

import { useAuth } from "./context/AuthContext";

import Students from "./pages/dashboard/Students";

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

function Placeholder({ title }: { title: string }) {
  return (
    <Box>
      <h1>{title}</h1>
      <p>This section is under development.</p>
    </Box>
  );
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
            <Route path="/colleges" element={<Placeholder title="Colleges" />} />
            <Route path="/students" element={<Students />} />
            <Route path="/accounts" element={<Placeholder title="Account Management" />} />
            <Route path="/reports" element={<Placeholder title="Reports" />} />
            <Route path="/audit-logs" element={<Placeholder title="Audit Logs" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
