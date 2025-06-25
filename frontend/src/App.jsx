// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/login";
import Register from "./pages/register";
import NotFound from "./pages/NotFound";

const DashboardAdmin = () => <div>Dashboard Admin</div>;
const DashboardSurveyor = () => <div>Dashboard Surveyor</div>;
const DashboardInstansi = () => <div>Dashboard Instansi</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/dashboard-surveyor" element={<DashboardSurveyor />} />
        <Route path="/dashboard-instansi" element={<DashboardInstansi />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
