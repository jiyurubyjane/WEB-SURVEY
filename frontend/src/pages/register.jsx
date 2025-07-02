import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../context/AuthContext";
import Swal from 'sweetalert2';
import logoAplikasi from '../assets/logo.png';
import loginBackground from '../assets/login.png';

function Register() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    peran: 'Surveyor'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Pendaftaran berhasil. Silakan login.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        }).then(() => {
          navigate("/login");
        });
      } else {
        throw new Error(result.error || "Pendaftaran gagal.");
      }
    } catch (error) {
      Swal.fire({
        title: 'Oops...',
        text: error.message || 'Terjadi kesalahan jaringan.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <Link to="/" className="absolute top-6 left-6 text-white bg-black bg-opacity-20 rounded-full p-2 hover:bg-opacity-40 transition-colors duration-200 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <Link to="/">
            <img src={logoAplikasi} alt="Logo Aplikasi" className="h-12 w-auto mx-auto" />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-[#202262]">
            Buat Akun Baru
          </h2>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-[#202262]">Nama Lengkap</label>
            <input id="nama" name="nama" type="text" required value={formData.nama} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#202262]">Alamat Email</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#202262]">Password</label>
            <input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="peran" className="block text-sm font-medium text-[#202262]">Daftar Sebagai</label>
            <select id="peran" name="peran" value={formData.peran} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="Surveyor">Surveyor</option>
              <option value="Instansi">Instansi</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#14BBF0] hover:bg-[#0085CE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </div>
        </form>
        
        <p className="mt-4 text-center text-sm text-[#202262]">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-[#14BBF0] hover:text-[#0085CE]">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
