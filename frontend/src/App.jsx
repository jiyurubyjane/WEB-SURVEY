import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout.jsx";

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
import ProfilePage from "./pages/ProfilePage.jsx";
import HasilAnalisisPage from "./pages/dashboard/HasilAnalisisPage.jsx";
import EventDetailPage from "./pages/dashboard/EventDetailPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/dashboard-admin" element={<PrivateRoute allowedRoles={["Admin"]}><DashboardAdmin /></PrivateRoute>} />
      <Route path="/dashboard-surveyor" element={<PrivateRoute allowedRoles={["Surveyor"]}><DashboardSurveyor /></PrivateRoute>} />
      <Route path="/dashboard-instansi" element={<PrivateRoute allowedRoles={["Instansi"]}><DashboardInstansi /></PrivateRoute>} />
      
      <Route 
        element={
          <PrivateRoute allowedRoles={["Admin", "Surveyor", "Instansi"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/kelola-event" element={<KelolaEvent />} />
        <Route path="/kelola-event/:eventId" element={<EventDetailPage />} />
        <Route path="/kelola-pengguna" element={<KelolaPenggunaPage />} />
        <Route path="/input-survei" element={<InputSurveyPage />} />
        <Route path="/hasil-analisis/:eventId" element={<HasilAnalisisPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
