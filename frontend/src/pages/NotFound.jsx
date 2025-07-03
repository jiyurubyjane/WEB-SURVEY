import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

function NotFound() {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return "/";
    switch (user.peran) {
      case 'Admin':
        return '/dashboard-admin';
      case 'Surveyor':
        return '/dashboard-surveyor';
      case 'Instansi':
        return '/dashboard-instansi';
      default:
        return '/';
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F8F9FA] p-4 text-center font-sans">
      <div className="max-w-md">
        <h1 className="text-8xl font-black text-[#202262] opacity-10">404</h1>
        <h2 className="mt-2 text-4xl font-extrabold text-[#202262] tracking-tight sm:text-5xl">
          Halaman Tidak Ditemukan
        </h2>
        <p className="mt-4 text-base text-gray-500">
          Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin telah dipindahkan atau URL-nya salah.
        </p>
        <div className="mt-8">
          <Link
            to={getHomePath()}
            className="inline-flex items-center rounded-full bg-[#14BBF0] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#0085CE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14BBF0] transition-colors"
          >
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
