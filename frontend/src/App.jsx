import { Routes, Route } from "react-router-dom";

// Komponen Layout
import DashboardLayout from "./components/DashboardLayout.jsx"; // <-- PATH SUDAH DIPERBAIKI

// Halaman-halaman
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import NotFound from "./pages/NotFound.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import DashboardAdmin from "./pages/dashboard/DashboardAdmin.jsx";
import DashboardSurveyor from "./pages/dashboard/DashboardSurveyor.jsx";
import DashboardInstansi from "./pages/dashboard/DashboardInstansi.jsx";
import KelolaEvent from "./pages/dashboard/KelolaEvent.jsx";
import InputSurveyPage from "./pages/InputSurveyPage.jsx";
import KelolaPenggunaPage from "./pages/dashboard/KelolaPenggunaPage.jsx"; 

function App() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Rute Dashboard Lain (Tidak Memakai Layout) */}
      <Route path="/dashboard-surveyor" element={<PrivateRoute allowedRoles={["Surveyor"]}><DashboardSurveyor /></PrivateRoute>} />
      <Route path="/dashboard-instansi" element={<PrivateRoute allowedRoles={["Instansi"]}><DashboardInstansi /></PrivateRoute>} />
      
      {/* Grup Rute Admin dengan Layout */}
      <Route 
        element={
          <PrivateRoute allowedRoles={["Admin", "Surveyor"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/kelola-event" element={<KelolaEvent />} />
        <Route path="/kelola-pengguna" element={<KelolaPenggunaPage />} />
        <Route path="/input-survei" element={<InputSurveyPage />} />
      </Route>

      {/* Rute "Catch-all" */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
