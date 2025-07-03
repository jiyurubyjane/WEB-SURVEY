import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Unauthorized() {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return "/login";
    switch (user.peran) {
      case 'Admin':
        return '/dashboard-admin';
      case 'Surveyor':
        return '/dashboard-surveyor';
      case 'Instansi':
        return '/dashboard-instansi';
      default:
        return '/login';
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F8F9FA] p-4 text-center font-sans">
      <div className="max-w-md">
        <h1 className="text-8xl font-black text-red-500 opacity-10">403</h1>
        <h2 className="mt-2 text-4xl font-extrabold text-red-600 tracking-tight sm:text-5xl">
          Akses Ditolak
        </h2>
        <p className="mt-4 text-base text-gray-500">
          Maaf, Anda tidak memiliki izin untuk mengakses halaman yang Anda tuju.
        </p>
        <div className="mt-8">
          <Link
            to={getHomePath()}
            className="inline-flex items-center rounded-full bg-[#14BBF0] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#0085CE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14BBF0] transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
