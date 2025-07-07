import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import loginBg from '../../assets/login.png';
import logo from '../../assets/logo.png';

function DashboardSurveyor() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const backgroundStyle = {
    backgroundImage: `url(${loginBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div style={backgroundStyle} className="min-h-screen flex flex-col font-sans text-slate-800 relative">
      <div className="relative z-10 flex flex-col flex-grow">
        
        <header className="flex justify-between items-center w-full p-4 sm:p-8">
          <div className="flex-1 flex justify-start">
            <button
              onClick={logout}
              className="bg-[#14BBF0] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#0085CE] transition-colors shadow-md"
            >
              Logout
            </button>
          </div>
          
          <div className="flex-none">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
          </div>

          <div className="flex-1 flex justify-end">
            <h2 className="hidden sm:block text-sm font-bold tracking-widest uppercase" style={{ color: 'white' }}>
              HOME PAGE
            </h2>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl text-white font-bold leading-tight">
              Selamat Datang, {user.nama}!
            </h1>
            <p className="mt-4 text-lg text-white">
              Anda login sebagai <strong>{user.peran}</strong>. Siap untuk memulai survei?
            </p>
            <div className="mt-10">
              <Link to="/input-survei">
                <button className="bg-white text-[#202262] font-bold text-lg px-10 py-4 rounded-full hover:bg-[#14BBF0] transition-transform transform hover:scale-105 shadow-xl">
                  Mulai Input Data Survei
                </button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-white">
          <p>&copy; {new Date().getFullYear()} Survey App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default DashboardSurveyor;
