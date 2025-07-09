import React, { useState, useEffect } from "react";
import { apiFetch, useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';

const CurrencyInput = ({ value, onChange, ...props }) => {
  const format = (numStr) => {
    if (!numStr) return '';
    return new Intl.NumberFormat('id-ID').format(Number(numStr));
  };

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue === '') {
        onChange('');
        return;
    }
    const numericValue = String(Number(rawValue));
    onChange(numericValue);
  };

  return (
    <input 
      type="text" 
      inputMode="numeric" 
      value={value ? `Rp ${format(value)}` : ''} 
      onChange={handleChange} 
      {...props} 
    />
  );
};


function SurveyTaker() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesionerId, setSelectedKuesionerId] = useState('');
  const [pertanyaanList, setPertanyaanList] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/events?status=aktif').then(res => res.json()).then(setEvents);
  }, []);

  useEffect(() => {
    if (!selectedEventId) { 
      setKuesionerList([]);
      setPertanyaanList([]);
      setSelectedKuesionerId('');
      setJawaban({}); // <-- PERBAIKAN: Reset jawaban di sini
      return; 
    }
    apiFetch(`/api/events/${selectedEventId}/kuesioner`).then(res => res.json()).then(setKuesionerList);
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedKuesionerId) { 
      setPertanyaanList([]);
      setJawaban({});
      return; 
    }
    apiFetch(`/api/kuesioner/${selectedKuesionerId}/pertanyaan`).then(res => res.json()).then(setPertanyaanList);
  }, [selectedKuesionerId]);

  const handleJawabanChange = (pertanyaanId, value) => {
    setJawaban(prev => ({ ...prev, [pertanyaanId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedJawaban = Object.entries(jawaban).map(([pertanyaan_id, jawaban_teks]) => ({ 
      pertanyaan_id: parseInt(pertanyaan_id, 10),
      isi_jawaban: jawaban_teks
    }));

    const dataToSubmit = {
      kuesionerId: selectedKuesionerId,
      jawaban: formattedJawaban,
    };

    try {
      const res = await apiFetch('/api/jawaban', {
        method: 'POST',
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan saat submit");

      Swal.fire({
        title: 'Berhasil!',
        text: data.message,
        icon: 'success',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors',
        }
      });
      setJawaban({});

    } catch (err) {
      Swal.fire({
        title: 'Gagal!',
        text: err.message,
        icon: 'error',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (pertanyaan) => {
    const commonClasses = "w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0]";
    const selectClasses = `${commonClasses} appearance-none`;

    switch (pertanyaan.tipe_jawaban) {
      case 'teks':
        return <input type="text" value={jawaban[pertanyaan.id] || ''} onChange={e => handleJawabanChange(pertanyaan.id, e.target.value)} className={commonClasses} required />;
      case 'angka':
        return <input type="text" inputMode="numeric" pattern="\d*" value={jawaban[pertanyaan.id] || ''} onChange={e => handleJawabanChange(pertanyaan.id, e.target.value)} className={commonClasses} required />;
      case 'nominal':
        return <CurrencyInput 
                  value={jawaban[pertanyaan.id] || ''} 
                  onChange={(val) => handleJawabanChange(pertanyaan.id, val)}
                  className={commonClasses}
                  placeholder="Ketik nominal..."
                  required
                />;
      case 'ya_tidak':
        return (
          <div className="relative">
            <select value={jawaban[pertanyaan.id] || ''} onChange={e => handleJawabanChange(pertanyaan.id, e.target.value)} className={selectClasses} required>
              <option value="" disabled>-- Pilih Jawaban --</option>
              <option value="Ya">Ya</option>
              <option value="Tidak">Tidak</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#202262]">Formulir Input Survei</h1>
        <p className="mt-1 text-gray-500">Anda login sebagai Surveyor: <span className="font-semibold">{user?.nama}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8">
        <div>
          <h2 className="text-xl font-bold text-[#202262] mb-4">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Event</label>
              <div className="relative">
                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0] appearance-none" required>
                  <option value="" disabled>-- Daftar Event Aktif --</option>
                  {events.map(event => <option key={event.id} value={event.id}>{event.nama_event}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tipe Responden</label>
              <div className="relative">
                <select value={selectedKuesionerId} onChange={e => setSelectedKuesionerId(e.target.value)} className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0] appearance-none" disabled={!selectedEventId} required>
                  <option value="" disabled>-- Daftar Tipe Responden --</option>
                  {kuesionerList.map(k => <option key={k.id} value={k.id}>{k.tipe_responden}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {pertanyaanList.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-[#202262] mb-6">Pertanyaan Survei</h2>
            <div className="space-y-6">
              {pertanyaanList.map((p, index) => (
                <div key={p.id}>
                  <label className="block text-base font-semibold text-gray-800">{index + 1}. {p.teks_pertanyaan}</label>
                  {renderInput(p)}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-8 mt-8 border-t border-gray-200">
              <button type="submit" disabled={isSubmitting} className="bg-[#14BBF0] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#0085CE] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Submit Data Survei'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </>
  );
}

export default SurveyTaker;
