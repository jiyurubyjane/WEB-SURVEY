import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

// Komponen untuk setiap kartu menu agar kode tidak berulang
const MenuCard = ({ to, bgColor, title, description, buttonTextColor }) => (
  <Link to={to} className="flex-1 min-h-[320px] md:min-h-[400px]">
    <div
      className={`h-full text-white p-8 rounded-3xl flex flex-col justify-between shadow-xl transform hover:-translate-y-2 transition-transform duration-300`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Grup Judul dan Deskripsi */}
      <div>
        <h3 className="text-3xl font-bold">{title}</h3>
        <p className="font-light text-base mt-2 opacity-90">{description}</p>
      </div>

      {/* Tombol Mulai */}
      <div
        className="bg-white font-bold px-6 py-3 rounded-full flex items-center justify-center self-end text-lg"
        style={{ color: buttonTextColor }}
      >
        <span className="flex items-center gap-2">
          Mulai
          <span className="text-2xl">→</span>
        </span>
      </div>
    </div>
  </Link>
);

function DashboardAdmin() {
  const { logout } = useAuth();

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8F9FA] p-8 lg:p-12 font-sans">
      <header className="flex justify-between items-center w-full mb-12 lg:mb-16">
        <button
          onClick={logout}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          Logout
        </button>
        <h2 className="hidden sm:block text-sm font-bold tracking-widest" style={{ color: '#202262' }}>
          HOME PAGE
        </h2>
      </header>
      
      <main className="flex flex-1 flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        <div className="w-full lg:w-1/3">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight" style={{ color: '#202262' }}>
            Apa yang Ingin Anda Lakukan?
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 w-full lg:w-2/3">
          <MenuCard
            to="/kelola-pengguna"
            bgColor="red"
            title="Kelola Pengguna"
            description="Atur dan lihat daftar pengguna yang terdaftar."
            buttonTextColor="#202262"
          />
          <MenuCard
            to="/kelola-event"
            bgColor="#FFAD01"
            title="Kelola Event"
            description="Buat, edit, dan kelola semua event olahraga."
            buttonTextColor="#202262"
          />
          <MenuCard
            to="/input-survei"
            bgColor="#A80151"
            title="Input Survey"
            description="Mulai masukkan data hasil survei dari responden."
            buttonTextColor="#202262"
          />
        </div>
      </main>

      <div className="absolute bottom-8 left-8 text-blue-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l6-6m0 0l-6 0m6 0v6"
          />
        </svg>
      </div>
    </div>
  );
}

export default DashboardAdmin;