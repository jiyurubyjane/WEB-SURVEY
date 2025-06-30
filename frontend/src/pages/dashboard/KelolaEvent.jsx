import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../context/AuthContext";
import EventFormModal from "../../components/EventFormModal";

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
    const confirmationText = newStatus === 'diarsipkan' 
      ? 'Anda yakin ingin mengarsipkan event ini?' 
      : 'Anda yakin ingin mengaktifkan kembali event ini?';

    if (window.confirm(confirmationText)) {
      try {
        await apiFetch(`/api/events/${eventId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        });
        fetchEvents();
      } catch (err) {
        alert(err.message);
      }
    }
  };
  
  const handleDelete = async (eventId) => {
    if (window.confirm('Anda yakin ingin menghapus event ini secara permanen?')) {
      try {
        await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' });
        fetchEvents();
      } catch (err) {
        alert(err.message);
      }
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

      {isLoading && <p className="p-8">Loading...</p>}
      {error && <p className="p-8 text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Event</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
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
                  <td colSpan="4" className="text-center py-10 text-gray-500">Tidak ada event.</td>
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
