import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Unauthorized() {
  const { user } = useAuth();

  const dashboardPath = user ? `/dashboard-${user.peran.toLowerCase()}` : "/login";

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-9xl font-extrabold text-red-500">403</h1>
      <h2 className="text-3xl font-bold text-gray-800">Akses Ditolak</h2>
      <p className="mt-4 text-gray-500">
        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Link to={dashboardPath} className="mt-6">
        <button className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700">
          Kembali ke Dashboard
        </button>
      </Link>
    </div>
  );
}

export default Unauthorized;