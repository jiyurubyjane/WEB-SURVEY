import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.peran)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

export default PrivateRoute;