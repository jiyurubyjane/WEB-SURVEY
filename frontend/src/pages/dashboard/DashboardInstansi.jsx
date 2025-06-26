import { useAuth } from "../../context/AuthContext";

function DashboardInstansi() {
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
      <p>Belum ada fitur khusus untuk instansi. Stay tuned ya!</p>
      
      <button onClick={logout} className="text-red-600 underline block mt-6">
        Logout
      </button>
    </div>
  );
}

export default DashboardInstansi;