import { useState, useEffect } from "react";
import { apiFetch, useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';

function SurveyTaker() {
  const { user } = useAuth();
  
  // State dari server
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesionerId, setSelectedKuesionerId] = useState('');
  const [pertanyaanList, setPertanyaanList] = useState([]);
  
  // State untuk data input form (HANYA JAWABAN)
  const [jawaban, setJawaban] = useState({});

  // State untuk UI
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data events
  useEffect(() => {
    apiFetch('/api/events?status=aktif').then(res => res.json()).then(setEvents);
  }, []);

  // Fetch kuesioner berdasarkan event
  useEffect(() => {
    if (!selectedEventId) { 
      setKuesionerList([]);
      setPertanyaanList([]);
      setSelectedKuesionerId('');
      return; 
    }
    apiFetch(`/api/events/${selectedEventId}/kuesioner`).then(res => res.json()).then(setKuesionerList);
  }, [selectedEventId]);

  // Fetch pertanyaan berdasarkan kuesioner
  useEffect(() => {
    if (!selectedKuesionerId) { 
      setPertanyaanList([]);
      setJawaban({}); // Reset jawaban jika kuesioner diubah
      return; 
    }
    apiFetch(`/api/kuesioner/${selectedKuesionerId}/pertanyaan`).then(res => res.json()).then(setPertanyaanList);
  }, [selectedKuesionerId]);

  // Fungsi untuk handle perubahan input jawaban
  const handleJawabanChange = (pertanyaanId, value) => {
    setJawaban(prev => ({ ...prev, [pertanyaanId]: value }));
  };

  // Fungsi utama untuk submit survei
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mengubah format jawaban dari objek ke array
    const formattedJawaban = Object.entries(jawaban).map(([pertanyaan_id, jawaban_teks]) => ({ 
        pertanyaan_id: parseInt(pertanyaan_id, 10),
        jawaban_teks 
    }));

    // Mengumpulkan semua data untuk dikirim (tanpa data responden)
    const dataToSubmit = {
      kuesionerId: selectedKuesionerId,
      jawaban: formattedJawaban,
    };

    try {
      // Mengirim ke endpoint yang benar: /api/jawaban
      const res = await apiFetch('/api/jawaban', {
        method: 'POST',
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan saat submit");

      Swal.fire('Berhasil!', data.message, 'success');
      
      // Reset form jawaban untuk entri berikutnya
      setJawaban({});
      // Opsional: reset dropdown jika perlu
      // setSelectedKuesionerId('');
      // setPertanyaanList([]);

    } catch (err) {
      Swal.fire('Gagal!', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Formulir Input Survei</h1>
      <p className="mb-6 text-gray-600">Surveyor: <strong>{user?.nama}</strong></p>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
            <option value="">-- Pilih Event --</option>
            {events.map(event => <option key={event.id} value={event.id}>{event.nama_event}</option>)}
          </select>
          <select value={selectedKuesionerId} onChange={e => setSelectedKuesionerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={!selectedEventId} required>
            <option value="">-- Pilih Tipe Responden --</option>
            {kuesionerList.map(k => <option key={k.id} value={k.id}>{k.tipe_responden}</option>)}
          </select>
        </div>

        {pertanyaanList.length > 0 && (
          <>
            <hr />
            {/* Bagian Pertanyaan Survei */}
            <h2 className="text-xl font-semibold text-gray-800">Pertanyaan Survei</h2>
            {pertanyaanList.map((p, index) => (
              <div key={p.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{index + 1}. {p.teks_pertanyaan}</label>
                {p.tipe_jawaban === 'teks' && <input type="text" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />}
                {p.tipe_jawaban === 'angka' && <input type="number" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />}
                {p.tipe_jawaban === 'nominal' && <input type="number" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} placeholder="Rp." className="w-full px-3 py-2 border border-gray-300 rounded-md" required />}
                {p.tipe_jawaban === 'ya_tidak' && (
                  <select value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">-- Pilih --</option>
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                )}
              </div>
            ))}
            
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? 'Menyimpan...' : 'Submit Data Survei'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default SurveyTaker;