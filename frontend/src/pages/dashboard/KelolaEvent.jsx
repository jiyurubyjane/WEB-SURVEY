import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../context/AuthContext";
import EventFormModal from "../../components/EventFormModal";
import Swal from 'sweetalert2';

function KelolaEvent() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [filterStatus, setFilterStatus] = useState('aktif');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/events?status=${filterStatus}`);
      if (!res.ok) throw new Error('Gagal mengambil data event');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const handleOpenAddModal = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (eventId, currentStatus) => {
    const newStatus = currentStatus === 'aktif' ? 'diarsipkan' : 'aktif';
    const actionText = newStatus === 'diarsipkan' ? 'mengarsipkan' : 'mengaktifkan kembali';

    await Swal.fire({
      title: `Anda yakin?`,
      text: `Anda akan ${actionText} event ini.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Ya, ${actionText}!`,
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiFetch(`/api/events/${eventId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          });
          Swal.fire('Berhasil!', `Event telah di${newStatus === 'aktif' ? 'aktifkan' : 'arsip'}.`, 'success');
          fetchEvents();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };
  
  const handleDelete = async (eventId) => {
    await Swal.fire({
      title: 'Anda yakin ingin menghapus?',
      text: "Event ini akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-200 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' });
          Swal.fire({
            title: 'Terhapus!',
            text: 'Event berhasil dihapus',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] transition-colors'
            }
          });
          fetchEvents();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const handleDownload = async (eventId) => {
    Swal.fire({
      title: 'Mempersiapkan Unduhan',
      text: 'Harap tunggu sebentar...',
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
        throw new Error(errorData?.message || 'Gagal mengunduh file. Terjadi kesalahan di server.');
      }

      const contentDisposition = res.headers.get('content-disposition');
      let filename = `hasil-survei-event-${eventId}.xlsx`; // Diubah ke .xlsx sesuai update teman
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?="?([^"]+)"?/i);
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
      console.error('Download error:', err);
      Swal.fire('Gagal', err.message, 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#202262]">Manajemen Event</h1>
            <p className="mt-1 text-gray-500">Buat, kelola, dan lihat semua event Anda di satu tempat.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-[#14BBF0] text-white font-semibold px-5 py-3 rounded-full hover:bg-[#0085CE] transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            <span>Tambah Event</span>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setFilterStatus('aktif')}
                className={`shrink-0 px-1 py-4 text-sm font-medium ${filterStatus === 'aktif' ? 'border-[#14BBF0] text-[#14BBF0] border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Event Aktif
              </button>
              <button
                onClick={() => setFilterStatus('diarsipkan')}
                className={`shrink-0 px-1 py-4 text-sm font-medium ${filterStatus === 'diarsipkan' ? 'border-[#14BBF0] text-[#14BBF0] border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Diarsipkan
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {isLoading && <p className="p-12 text-center text-gray-500">Memuat data event...</p>}
          {error && <p className="p-12 text-center text-red-600">{error}</p>}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Event</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Hasil Survei</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.length > 0 ? (
                    events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/kelola-event/${event.id}`} className="text-sm font-semibold text-[#14BBF0] hover:underline hover:text-[#0085CE]">
                            {event.nama_event}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">{event.lokasi}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(event.tanggal_mulai)} - {formatDate(event.tanggal_selesai)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button 
                            onClick={() => handleDownload(event.id)} 
                            className="bg-green-100 text-green-800 font-semibold py-1 px-3 rounded-full text-xs hover:bg-green-200 transition-colors"
                            title={`Download hasil survei untuk ${event.nama_event}`}
                          >
                            Download
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 sm:gap-4">
                            <button onClick={() => handleOpenEditModal(event)} title="Edit" className="text-gray-500 hover:text-[#14BBF0] transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button onClick={() => handleToggleStatus(event.id, event.status)} title={event.status === 'aktif' ? 'Arsipkan' : 'Aktifkan'} className="text-gray-500 hover:text-yellow-600 transition-colors">
                              {event.status === 'aktif' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h12v1a1 1 0 01-1 1H6a1 1 0 01-1-1zm1-4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                   <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <button onClick={() => handleDelete(event.id)} title="Hapus" className="text-gray-500 hover:text-red-600 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-500">
                        Tidak ada event untuk kategori '{filterStatus}'.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
        eventData={eventToEdit}
      />
    </div>
  );
}

export default KelolaEvent;