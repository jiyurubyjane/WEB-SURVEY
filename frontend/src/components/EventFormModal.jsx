import React, { useState, useEffect } from 'react';
import { apiFetch } from '../context/AuthContext';
import Swal from 'sweetalert2';

function EventFormModal({ isOpen, onClose, onSuccess, eventData }) {
  const isEditMode = Boolean(eventData?.id);
  const initialFormData = {
    nama_event: '', lokasi: '', tanggal_mulai: '', tanggal_selesai: '',
    deskripsi: '', jumlah_peserta: '', skala_event: 'Lokal',
    kategori_olahraga_id: null, sponsors: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [kategoriQuery, setKategoriQuery] = useState('');
  const [kategoriDisplay, setKategoriDisplay] = useState('');
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentSponsor, setCurrentSponsor] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setKategoriQuery('');
      setKategoriDisplay('');
      setError('');
      return;
    }

    if (!isEditMode) {
      setFormData(initialFormData);
      setKategoriQuery('');
      setKategoriDisplay('');
    } else if (isEditMode && eventData?.id) {
      const fetchFullEvent = async () => {
        try {
          const res = await apiFetch(`/api/events/${eventData.id}`);
          if (!res.ok) throw new Error('Gagal memuat detail event untuk diedit.');
          const fullEventData = await res.json();
          
          setFormData({
            nama_event: fullEventData.nama_event || '',
            lokasi: fullEventData.lokasi || '',
            tanggal_mulai: fullEventData.tanggal_mulai?.split('T')[0] || '',
            tanggal_selesai: fullEventData.tanggal_selesai?.split('T')[0] || '',
            deskripsi: fullEventData.deskripsi || '',
            jumlah_peserta: fullEventData.jumlah_peserta || '',
            skala_event: fullEventData.skala_event || 'Lokal',
            kategori_olahraga_id: fullEventData.kategori_olahraga_id || null,
            sponsors: fullEventData.sponsors || [],
          });
          setKategoriDisplay(fullEventData.nama_cabor || '');
          setKategoriQuery('');
        } catch (err) {
          setError(err.message);
        }
      };
      fetchFullEvent();
    }
  }, [eventData, isOpen, isEditMode]);

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
    
    const payload = { ...formData };
    if (!payload.kategori_olahraga_id && kategoriDisplay) {
        payload.nama_kategori_baru = kategoriDisplay;
    }
    
    const url = isEditMode ? `/api/events/${eventData.id}` : '/api/events';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan event');
      
      Swal.fire({
        title: 'Berhasil!',
        text: `Event telah berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire('Gagal!', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0]";
  const selectClasses = `${inputClasses} appearance-none`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#202262]">{isEditMode ? 'Edit Event' : 'Tambah Event Baru'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Event</label>
            <input type="text" name="nama_event" value={formData.nama_event} onChange={handleInputChange} placeholder="Contoh: Pekan Olahraga Nasional" className={inputClasses} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} placeholder="Deskripsi singkat mengenai event" className={inputClasses} rows="3"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
              <input type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} placeholder="Contoh: Jakarta" className={inputClasses} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Jumlah Peserta</label>
              <input type="number" name="jumlah_peserta" value={formData.jumlah_peserta} onChange={handleInputChange} placeholder="Contoh: 1000" className={inputClasses} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
              <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange} className={inputClasses} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Olahraga</label>
              <input 
                type="text" 
                value={kategoriDisplay} 
                onChange={(e) => {
                  setKategoriDisplay(e.target.value);
                  setKategoriQuery(e.target.value);
                  setFormData(prev => ({...prev, kategori_olahraga_id: null}));
                }} 
                placeholder="Ketik untuk cari atau tambah baru..." 
                className={inputClasses} 
              />
              {kategoriOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {kategoriOptions.map(opt => (
                    <li key={opt.id} onClick={() => { 
                      setFormData(prev => ({...prev, kategori_olahraga_id: opt.id})); 
                      setKategoriDisplay(opt.nama_cabor); 
                      setKategoriOptions([]); 
                      setKategoriQuery('');
                    }} className="px-4 py-2 cursor-pointer transition-colors hover:bg-[#14BBF0] hover:text-white">{opt.nama_cabor}</li>                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skala Event</label>
              <div className="relative">
                <select name="skala_event" value={formData.skala_event} onChange={handleInputChange} className={selectClasses}>
                  <option value="Lokal">Lokal</option>
                  <option value="Nasional">Nasional</option>
                  <option value="Internasional">Internasional</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
            <div className="flex gap-2">
              <input type="text" value={currentSponsor} onChange={(e) => setCurrentSponsor(e.target.value)} placeholder="Ketik nama sponsor lalu klik Tambah" className={inputClasses} />
              <button type="button" onClick={handleAddSponsor} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-semibold whitespace-nowrap">Tambah</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.sponsors.map((sponsor, index) => (
                <div key={index} className="flex items-center bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                  <span>{sponsor}</span>
                  <button type="button" onClick={() => handleRemoveSponsor(sponsor)} className="ml-2 text-gray-500 hover:text-gray-700 font-bold">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-6 py-2.5 rounded-lg transition-colors">Batal</button>
            <button type="submit" disabled={isSubmitting} className="font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-6 py-2.5 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
              {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui Event' : 'Simpan Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;