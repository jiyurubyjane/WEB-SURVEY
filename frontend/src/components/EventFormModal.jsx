import { useState, useEffect } from 'react';
import { apiFetch } from '../context/AuthContext';

function EventFormModal({ isOpen, onClose, onSuccess, eventData }) {
  const isEditMode = Boolean(eventData?.id);
  const initialFormData = {
    nama_event: '', lokasi: '', tanggal_mulai: '', tanggal_selesai: '',
    deskripsi: '', jumlah_peserta: '', skala_event: 'Lokal',
    kategori_olahraga_id: null, sponsors: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [kategoriQuery, setKategoriQuery] = useState('');
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentSponsor, setCurrentSponsor] = useState('');

  useEffect(() => {
    if (isOpen && eventData) {
      setFormData({
        nama_event: eventData.nama_event || '',
        lokasi: eventData.lokasi || '',
        tanggal_mulai: eventData.tanggal_mulai?.split('T')[0] || '',
        tanggal_selesai: eventData.tanggal_selesai?.split('T')[0] || '',
        deskripsi: eventData.deskripsi || '',
        jumlah_peserta: eventData.jumlah_peserta || '',
        skala_event: eventData.skala_event || 'Lokal',
        kategori_olahraga_id: eventData.kategori_olahraga_id || null,
        sponsors: eventData.sponsors || [],
      });
      setKategoriQuery(eventData.nama_cabor || '');
    } else {
      setFormData(initialFormData);
      setKategoriQuery('');
    }
  }, [eventData, isOpen]);

  useEffect(() => {
    if (kategoriQuery.length < 2) {
      setKategoriOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/kategori-olahraga?q=${kategoriQuery}`);
        const data = await res.json();
        setKategoriOptions(data);
      } catch (err) {
        console.error("Gagal mencari kategori:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [kategoriQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSponsor = () => {
    if (currentSponsor && !formData.sponsors.includes(currentSponsor)) {
      setFormData(prev => ({ ...prev, sponsors: [...prev.sponsors, currentSponsor] }));
      setCurrentSponsor('');
    }
  };
  
  const handleRemoveSponsor = (sponsorToRemove) => {
    setFormData(prev => ({ ...prev, sponsors: prev.sponsors.filter(s => s !== sponsorToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const url = isEditMode ? `/api/events/${eventData.id}` : '/api/events';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, { method, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan event');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Event' : 'Tambah Event Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input type="text" name="nama_event" value={formData.nama_event} onChange={handleInputChange} placeholder="Nama Event" className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} placeholder="Deskripsi Singkat Event" className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3"></textarea>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} placeholder="Lokasi" className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            <input type="number" name="jumlah_peserta" value={formData.jumlah_peserta} onChange={handleInputChange} placeholder="Estimasi Jumlah Peserta" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Tanggal Mulai</label>
              <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="text-sm text-gray-500">Tanggal Selesai</label>
              <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input type="text" value={kategoriQuery} onChange={(e) => setKategoriQuery(e.target.value)} placeholder="Ketik untuk cari Kategori Olahraga..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {kategoriOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
                  {kategoriOptions.map(opt => (
                    <li key={opt.id} onClick={() => { setFormData(prev => ({...prev, kategori_olahraga_id: opt.id})); setKategoriQuery(opt.nama_cabor); setKategoriOptions([]); }} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{opt.nama_cabor}</li>
                  ))}
                </ul>
              )}
            </div>
            <select name="skala_event" value={formData.skala_event} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="Lokal">Lokal</option>
              <option value="Nasional">Nasional</option>
              <option value="Internasional">Internasional</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Sponsor</label>
            <div className="flex gap-2">
              <input type="text" value={currentSponsor} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSponsor(); } }} onChange={(e) => setCurrentSponsor(e.target.value)} placeholder="Nama Sponsor" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <button type="button" onClick={handleAddSponsor} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm">Tambah</button>
            </div>
            <ul className="mt-2 space-y-1">
              {formData.sponsors.map((sponsor, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded-md text-sm">
                  <span>{sponsor}</span>
                  <button type="button" onClick={() => handleRemoveSponsor(sponsor)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui Event' : 'Simpan Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;
