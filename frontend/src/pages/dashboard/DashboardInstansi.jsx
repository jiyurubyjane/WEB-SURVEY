import React, { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import logo from '../../assets/logo.png';
import loginBg from '../../assets/login.png';

function DashboardInstansi() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllEvents = async () => {
      setIsLoading(true);
      try {
        const activeRes = await apiFetch('/api/events?status=aktif');
        const archivedRes = await apiFetch('/api/events?status=diarsipkan');
        
        if (!activeRes.ok || !archivedRes.ok) {
          throw new Error('Gagal mengambil data event.');
        }

        const activeEvents = await activeRes.json();
        const archivedEvents = await archivedRes.json();
        
        setEvents([...activeEvents, ...archivedEvents].sort((a, b) => new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai)));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  const handleDownload = async (eventId, eventName) => {
    Swal.fire({
      title: 'Mempersiapkan Unduhan',
      text: `Mengunduh laporan untuk event: ${eventName}`,
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await apiFetch(`/api/events/${eventId}/hasil-survei/download`);

      if (res.status === 404) {
        throw new Error('Tidak ada data survei yang ditemukan untuk event ini.');
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Gagal mengunduh file.');
      }

      const contentDisposition = res.headers.get('content-disposition');
      let filename = `hasil_survei_${eventName.replace(/ /g, "_")}.xlsx`;
      
      if (contentDisposition) {
        // --- PERBAIKAN LOGIKA PARSING FILENAME ---
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      Swal.close();
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  };

  const filteredEvents = events.filter(event => 
    event.nama_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const backgroundStyle = {
    backgroundImage: `url(${loginBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div style={backgroundStyle} className="min-h-screen font-sans">
      <div className="bg-black/20 min-h-screen">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/10 border-b border-white/10">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                  <div className="flex-1 flex justify-start">
                      <button
                          onClick={logout}
                          className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                          Logout
                      </button>
                  </div>
                  <div className="flex-none">
                      <img src={logo} alt="Logo" className="h-10 w-auto" />
                  </div>
                  <div className="flex-1 flex justify-end items-center gap-4 text-white">
                       <Link to="/profile" className="hover:text-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      </Link>
                      <span className="text-sm font-medium hidden sm:block">HOMEPAGE</span>
                  </div>
              </div>
          </div>
        </header>
        
        <main className="max-w-screen-xl mx-auto p-4 md:p-8">
          <div className="text-center text-white pt-12 pb-16">
            <h1 className="text-5xl md:text-6xl font-bold">Selamat Datang, {user?.nama}!</h1>
            <p className="mt-4 text-lg max-w-2xl mx-auto opacity-90">Jelajahi hasil survei dari berbagai event olahraga untuk mendapatkan wawasan mendalam.</p>
             <div className="mt-8 max-w-lg mx-auto relative">
                <input 
                  type="text"
                  placeholder="Cari nama event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-white/30 rounded-full text-white bg-white/20 focus:ring-2 focus:ring-white placeholder:text-gray-300"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
              </div>
          </div>

          {isLoading && <p className="text-center py-10 text-white">Memuat event...</p>}
          {error && <p className="text-center py-10 text-red-300">{error}</p>}
          
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length > 0 ? filteredEvents.map(event => (
                <div key={event.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col justify-between border border-white/20 shadow-2xl">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white pr-4">{event.nama_event}</h3>
                      <span className={`flex-shrink-0 inline-block px-2 py-1 text-xs font-semibold rounded-full ${event.status === 'aktif' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'}`}>
                        {event.status === 'aktif' ? 'Aktif' : 'Selesai'}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mt-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      {event.lokasi}
                    </p>
                    <p className="text-sm text-white/80 mt-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                      {formatDate(event.tanggal_mulai)}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link to={`/hasil-analisis/${event.id}`} className="w-full text-center bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#14BBF0] text-white transition-colors">
                      Lihat Analitik
                    </Link>
                    <button 
                        onClick={() => handleDownload(event.id, event.nama_event)}
                        className="w-full bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-500 transition-colors"
                    >
                        Download
                    </button>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-3 text-center py-16 text-white/70 bg-white/10 rounded-xl">
                  <p>Tidak ada event yang cocok dengan pencarian Anda.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardInstansi;
