import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen p-4 sm:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <Link to="/dashboard-admin" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Kembali ke Home</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/kelola-event" className="text-sm font-medium text-gray-600 hover:text-[#202262]">
            Kelola Event
          </Link>
          <Link to="/kelola-pengguna" className="text-sm font-medium text-gray-600 hover:text-[#202262]">
            Kelola Pengguna
          </Link>
          <Link to="/input-survei" className="text-sm font-medium text-gray-600 hover:text-[#202262]">
            Input Survei
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;