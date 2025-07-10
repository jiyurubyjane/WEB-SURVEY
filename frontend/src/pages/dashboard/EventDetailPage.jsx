import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../context/AuthContext';
import loginBg from '../../assets/login.png';
import EventFormModal from "../../components/EventFormModal";

const InfoChip = ({ icon, text }) => (
  <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/20">
    <div className="flex-shrink-0 text-white/80">{icon}</div>
    <span className="text-sm font-medium text-white">{text}</span>
  </div>
);

function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 

  const fetchEventDetail = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/events/${eventId}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil detail event.');
      }
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

  const handleEditSuccess = () => {
    fetchEventDetail(); 
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const backgroundStyle = {
    backgroundImage: `url(${loginBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  if (isLoading) return <div className="text-center py-20">Memuat detail event...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!event) return <div className="text-center py-20">Event tidak ditemukan.</div>;

  return (
    <>
      <div style={backgroundStyle} className="min-h-screen font-sans -m-8">
        <div className="bg-black/20 min-h-screen flex flex-col justify-center p-4 sm:p-8">
          <main className="w-full max-w-7xl mx-auto">
            <div className="text-white mb-10">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">{event.nama_event}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-3 bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">Deskripsi Event</h3>
                <p className="text-white/80 leading-relaxed mb-8">{event.deskripsi || 'Tidak ada deskripsi.'}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoChip 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    text={event.lokasi}
                  />
                  <InfoChip 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    text={`${formatDate(event.tanggal_mulai)} - ${formatDate(event.tanggal_selesai)}`}
                  />
                  <InfoChip 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    text={`${event.jumlah_peserta} Peserta`}
                  />
                   <InfoChip 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8v-5z" /></svg>}
                    text={event.nama_cabor || 'Tidak ada kategori'}
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-8">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Sponsor</h3>
                  {event.sponsors && event.sponsors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {event.sponsors.map((sponsor, index) => (
                        <span key={index} className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/70">Tidak ada sponsor untuk event ini.</p>
                  )}
                </div>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4">Aksi</h3>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full text-center bg-white/20 text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#14BBF0] hover:text-white transition-colors"
                      >
                          Edit Event
                      </button>
                      
                        <Link to="/input-survei" className="w-full">
                            <button className="w-full text-center bg-white/20 text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#14BBF0] hover:text-white transition-colors">
                                Input Survey
                            </button>
                        </Link>
                    </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <EventFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        eventData={event}
      />
    </>
  );
}

export default EventDetailPage;