
import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ModulePlaceholder from "./pages/ModulePlaceholder.jsx";
import MainLayout from "./layouts/MainLayout.jsx";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading Nova HMS...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this module.</p>
      </div>
    );
  }

  return children;
}

const modules = [
  ["/patients", "patients.view"],
  ["/appointments", "appointments.view"],
  ["/doctors", "doctors.view"],
  ["/departments", "departments.view"],
  ["/medical-records", "patients.view"],
  ["/laboratory", "patients.view"],
  ["/pharmacy", "patients.view"],
  ["/admissions", "patients.view"],
  ["/billing", "billing.view"],
  ["/reports", "reports.view"],
  ["/users", "users.view"],
  ["/settings", "settings.view"],
];

function ApplicationRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            index
            element={
              <PermissionRoute permission="dashboard.view">
                <Dashboard />
              </PermissionRoute>
            }
          />

          {modules.map(([path, permission]) => (
            <Route
              key={path}
              path={path.slice(1)}
              element={
                <PermissionRoute permission={permission}>
                  <ModulePlaceholder />
                </PermissionRoute>
              }
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ApplicationRoutes />
    </AuthProvider>
  );
}

