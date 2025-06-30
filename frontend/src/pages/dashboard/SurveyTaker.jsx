import { useState, useEffect } from "react";
import { apiFetch, useAuth } from "../../context/AuthContext";

function SurveyTaker() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesionerId, setSelectedKuesionerId] = useState('');
  const [pertanyaanList, setPertanyaanList] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    apiFetch('/api/events?status=aktif').then(res => res.json()).then(setEvents);
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setKuesionerList([]); return; }
    apiFetch(`/api/events/${selectedEventId}/kuesioner`).then(res => res.json()).then(setKuesionerList);
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedKuesionerId) { setPertanyaanList([]); return; }
    apiFetch(`/api/kuesioner/${selectedKuesionerId}/pertanyaan`).then(res => res.json()).then(setPertanyaanList);
  }, [selectedKuesionerId]);

  const handleJawabanChange = (pertanyaanId, value) => {
    setJawaban(prev => ({ ...prev, [pertanyaanId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    const formattedJawaban = Object.entries(jawaban).map(([pertanyaan_id, isi_jawaban]) => ({ pertanyaan_id, isi_jawaban }));

    try {
      const res = await apiFetch('/api/submit-survey', {
        method: 'POST',
        body: JSON.stringify({ kuesioner_id: selectedKuesionerId, jawaban: formattedJawaban }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");

      setMessage({ type: 'success', text: 'Data survei berhasil disimpan! Form dibersihkan untuk responden berikutnya.' });
      setJawaban({});
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Formulir Input Survei</h1>
      <p className="mb-6 text-gray-600">Surveyor: <strong>{user?.nama}</strong></p>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}

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

        {pertanyaanList.length > 0 && <hr />}

        {pertanyaanList.map(p => (
          <div key={p.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{p.urutan}. {p.teks_pertanyaan}</label>
            {p.tipe_jawaban === 'teks' && <input type="text" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />}
            {p.tipe_jawaban === 'angka' && <input type="number" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />}
            {p.tipe_jawaban === 'nominal' && <input type="number" value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} placeholder="Rp." className="w-full px-3 py-2 border border-gray-300 rounded-md" />}
            {p.tipe_jawaban === 'ya_tidak' && (
              <select value={jawaban[p.id] || ''} onChange={e => handleJawabanChange(p.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">-- Pilih --</option>
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
              </select>
            )}
          </div>
        ))}
        
        {pertanyaanList.length > 0 && (
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              {isSubmitting ? 'Menyimpan...' : 'Submit Data Survei'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default SurveyTaker;
