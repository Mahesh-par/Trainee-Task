import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AdminCurriculumPage } from "./pages/AdminCurriculumPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthPage } from "./pages/AuthPage";
import { TraineeCurriculumPage } from "./pages/TraineeCurriculumPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="admin-login" element={<AuthPage mode="admin-login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/trainee/course" replace />} />
            <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
              <Route path="trainee/course" element={<TraineeCurriculumPage />} />
              <Route path="trainee" element={<Navigate to="/trainee/course" replace />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["admin"]} redirectTo="/admin-login" />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route
                path="admin/curriculum"
                element={<Navigate to="/admin/curriculum/shopify" replace />}
              />
              <Route path="admin/curriculum/:track" element={<AdminCurriculumPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
