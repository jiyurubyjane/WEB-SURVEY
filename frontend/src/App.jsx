import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/login";
import Register from "./pages/register";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import PrivateRoute from "./components/PrivateRoute";
import DashboardAdmin from "./pages/dashboard/DashboardAdmin";
import DashboardSurveyor from "./pages/dashboard/DashboardSurveyor";
import DashboardInstansi from "./pages/dashboard/DashboardInstansi";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/dashboard-admin"
        element={
          <PrivateRoute allowedRoles={["Admin"]}>
            <DashboardAdmin />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard-surveyor"
        element={
          <PrivateRoute allowedRoles={["Surveyor"]}>
            <DashboardSurveyor />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard-instansi"
        element={
          <PrivateRoute allowedRoles={["Instansi"]}>
            <DashboardInstansi />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;