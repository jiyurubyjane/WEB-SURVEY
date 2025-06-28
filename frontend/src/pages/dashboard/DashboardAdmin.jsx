import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

function DashboardAdmin() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">
        Selamat Datang di Dashboard, {user.nama}!
      </h1>
      <p>Anda login sebagai: <strong>{user.peran}</strong></p>

      <hr />

      <h3 className="text-lg font-semibold">Menu Anda:</h3>
      <div className="flex gap-4 flex-wrap">
        <Link to="/kelola-pengguna">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Kelola Pengguna</button>
        </Link>
        <Link to="/kelola-event">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Kelola Event</button>
        </Link>
        
        <Link to="/input-survei">
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Input Data Survei</button>
        </Link>
      </div>

      <button onClick={logout} className="text-red-600 underline block mt-6">
        Logout
      </button>
    </div>
  );
}

export default DashboardAdmin;