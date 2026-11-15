
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This section is under development.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/colleges" element={<Placeholder title="Colleges" />} />
          <Route path="/students" element={<Placeholder title="Student Management" />} />
          <Route path="/accounts" element={<Placeholder title="Account Management" />} />
          <Route path="/reports" element={<Placeholder title="Reports" />} />
          <Route path="/audit-logs" element={<Placeholder title="Audit Logs" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
