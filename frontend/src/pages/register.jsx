import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [peran, setPeran] = useState("Surveyor");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ nama, email, password, peran }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Pendaftaran berhasil. Silakan login.");
        navigate("/login");
      } else {
        alert(result.error || "Pendaftaran gagal.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Register</h2>

        <div className="mb-4">
          <label htmlFor="nama" className="block text-gray-700 text-sm mb-2">
            Nama:
          </label>
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm mb-2">
            Email:
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 text-sm mb-2">
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="peran" className="block text-gray-700 text-sm mb-2">
            Peran:
          </label>
          <select
            id="peran"
            value={peran}
            onChange={(e) => setPeran(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="Surveyor">Surveyor</option>
            <option value="Admin">Admin</option>
            <option value="Instansi">Instansi</option>
          </select>
        </div>

        <button
          type="button" 
          onClick={handleRegister} 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Daftar
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
