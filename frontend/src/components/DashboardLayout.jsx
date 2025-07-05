import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

function DashboardLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const getNavLinkClass = ({ isActive }) => {
    const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    if (isActive) {
      return `${baseClasses} bg-[#14BBF0] text-white`;
    }
    return `${baseClasses} text-gray-600 hover:bg-gray-200 hover:text-gray-900`;
  };

  const getMobileNavLinkClass = ({ isActive }) => {
    return `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-[#14BBF0] text-white' : 'text-gray-700 hover:bg-gray-100'}`;
  };

  const AdminNav = () => (
    <>
      <NavLink to="/kelola-pengguna" className={getNavLinkClass}>Kelola Pengguna</NavLink>
      <NavLink to="/kelola-event" className={getNavLinkClass}>Kelola Event</NavLink>
      <NavLink to="/input-survei" className={getNavLinkClass}>Input Survei</NavLink>
    </>
  );

  const SurveyorNav = () => (
    <NavLink to="/input-survei" className={getNavLinkClass}>Input Survei</NavLink>
  );
  
  const InstansiNav = () => (
    <NavLink to="/hasil-analisis" className={getNavLinkClass}>Hasil Analisis</NavLink>
  );

  const renderNavLinks = () => {
    switch (user?.peran) {
      case 'Admin': return <AdminNav />;
      case 'Surveyor': return <SurveyorNav />;
      case 'Instansi': return <InstansiNav />;
      default: return null;
    }
  };
  
  const renderMobileNavLinks = () => {
    const closeMenu = () => setIsMenuOpen(false);
    
    const navs = {
      Admin: [
        { path: "/kelola-pengguna", label: "Kelola Pengguna" },
        { path: "/kelola-event", label: "Kelola Event" },
        { path: "/input-survei", label: "Input Survei" },
      ],
      Surveyor: [
        { path: "/input-survei", label: "Input Survei" },
      ],
      Instansi: [
         { path: "/hasil-analisis", label: "Hasil Analisis" },
      ]
    };
    
    const links = navs[user?.peran] || [];

    return (
      <>
        {links.map(link => (
          <NavLink key={link.path} to={link.path} className={getMobileNavLinkClass} onClick={closeMenu}>
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/profil" className={getMobileNavLinkClass} onClick={closeMenu}>
          Profil Saya
        </NavLink>
      </>
    );
  };

  const getDashboardHomePath = () => {
    switch (user?.peran) {
      case 'Admin': return '/dashboard-admin';
      case 'Surveyor': return '/dashboard-surveyor';
      case 'Instansi': return '/dashboard-instansi';
      default: return '/';
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <NavLink to={getDashboardHomePath()} className="text-gray-500 hover:text-gray-900" title="Kembali ke Home">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </NavLink>
              <NavLink to="/profil" title="Profil Saya">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-sm">
                  {user?.nama.charAt(0).toUpperCase()}
                </div>
              </NavLink>
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </div>
            
            <nav className="hidden md:flex items-center gap-2">
              {renderNavLinks()}
            </nav>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-900 focus:outline-none"
                aria-label="Buka menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {renderMobileNavLinks()}
            </nav>
          </div>
        )}
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
