import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from 'sweetalert2';
import logoAplikasi from '../assets/logo.png';
import loginBackground from '../assets/login.png';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      let dashboardPath = '/';
      switch (user.peran) {
        case 'Admin':
          dashboardPath = '/dashboard-admin';
          break;
        case 'Surveyor':
          dashboardPath = '/dashboard-surveyor';
          break;
        case 'Instansi':
          dashboardPath = '/dashboard-instansi';
          break;
      }
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  const handleForgotPassword = () => {
    Swal.fire({
      title: 'Lupa Password?',
      text: 'Silakan hubungi administrator sistem untuk bantuan reset password Anda.',
      icon: 'info',
      confirmButtonText: 'Mengerti',
      confirmButtonColor: '#3085d6',
    });
  };

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg">Anda sudah login. Mengalihkan ke dashboard...</p>
      </div>
    );
  }

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
            Login ke Akun Anda
          </h2>
        </div>
        
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#202262]">
              Alamat Email
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#202262]">
              Password
            </label>
            <div className="mt-1 relative">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="text-right text-sm">
            <button 
              type="button" 
              onClick={handleForgotPassword} 
              className="font-medium text-[#14BBF0] hover:text-[#0085CE] underline bg-transparent border-none cursor-pointer"
            >
              Lupa password?
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#14BBF0] hover:bg-[#0085CE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
        
        <p className="mt-4 text-center text-sm text-[#202262]">
          Sudah punya akun?{' '}
          <Link to="/register" className="font-medium text-[#14BBF0] hover:text-[#0085CE]">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
