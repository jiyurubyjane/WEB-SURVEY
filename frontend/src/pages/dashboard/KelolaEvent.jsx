import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../context/AuthContext"; // Asumsi path ini benar
import EventFormModal from "../../components/EventFormModal"; // Asumsi path ini benar
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

    const result = await Swal.fire({
      title: `Anda yakin?`,
      text: `Anda akan ${actionText} event ini.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Ya, ${actionText}!`,
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        // Asumsi backend Anda memiliki endpoint ini
        await apiFetch(`/api/events/${eventId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        });
        Swal.fire('Berhasil!', `Event telah di${newStatus}.`, 'success');
        fetchEvents();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };
  
  const handleDelete = async (eventId) => {
    const result = await Swal.fire({
      title: 'Anda yakin ingin menghapus?',
      text: "Event ini akan dihapus secara permanen dan tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' });
        Swal.fire('Terhapus!', 'Event berhasil dihapus.', 'success');
        fetchEvents();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  // =================================================================
  // === FUNGSI BARU: Untuk menangani klik tombol download ===
  // =================================================================
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
      let filename = `hasil-survei-event-${eventId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?="?([^"]+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
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
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Event</h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
        >
          + Tambah Event Baru
        </button>
      </div>
      
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setFilterStatus('aktif')}
            className={`${filterStatus === 'aktif' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Event Aktif
          </button>
          <button
            onClick={() => setFilterStatus('diarsipkan')}
            className={`${filterStatus === 'diarsipkan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Event Diarsipkan
          </button>
        </nav>
      </div>

      {isLoading && <p className="p-8 text-center">Loading data event...</p>}
      {error && <p className="p-8 text-center text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Event</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                {/* === KOLOM BARU UNTUK HASIL SURVEI === */}
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hasil Survei</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                      <Link to={`/kelola-event/${event.id}`} className="text-blue-600 hover:underline font-semibold">
                        {event.nama_event}
                      </Link>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{event.lokasi}</td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{formatDate(event.tanggal_mulai)} - {formatDate(event.tanggal_selesai)}</td>
                    {/* === TOMBOL DOWNLOAD BARU === */}
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm text-center">
                      <button 
                        onClick={() => handleDownload(event.id)} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-xs transition-transform transform hover:scale-105"
                        title={`Download hasil survei untuk ${event.nama_event}`}
                      >
                        Download
                      </button>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm whitespace-nowrap">
                      <button onClick={() => handleOpenEditModal(event)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button 
                        onClick={() => handleToggleStatus(event.id, event.status)}
                        className="ml-4 text-yellow-600 hover:text-yellow-900 font-medium"
                      >
                        {event.status === 'aktif' ? 'Arsipkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="ml-4 text-red-600 hover:text-red-900 font-medium">Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">Tidak ada event untuk status '{filterStatus}'.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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