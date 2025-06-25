import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const result = await res.json();

    if (res.ok) {
      console.log("Login berhasil:", result);
      // Arahkan ke dashboard sesuai peran
      switch (result.peran) {
        case "Admin":
          navigate("/dashboard-admin");
          break;
        case "Surveyor":
          navigate("/dashboard-surveyor");
          break;
        case "Instansi":
          navigate("/dashboard-instansi");
          break;
        default:
          navigate("/");
      }
    } else {
      alert(result.message || "Login gagal");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm mb-2" htmlFor="email">
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

        <div className="mb-6">
          <label className="block text-gray-700 text-sm mb-2" htmlFor="password">
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

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Daftar
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;
