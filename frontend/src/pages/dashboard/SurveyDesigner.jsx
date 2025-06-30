import { useEffect, useState } from 'react';
import { apiFetch } from '../../context/AuthContext';

function SurveyDesigner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesioner, setSelectedKuesioner] = useState(null);
  const [pertanyaanList, setPertanyaanList] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiFetch('/api/events?status=aktif');
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Gagal memuat event:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setKuesionerList([]);
      setSelectedKuesioner(null);
      return;
    }
    const fetchKuesioner = async () => {
      try {
        const res = await apiFetch(`/api/events/${selectedEventId}/kuesioner`);
        const data = await res.json();
        setKuesionerList(data);
        setSelectedKuesioner(null);
      } catch (error) {
        console.error("Gagal memuat kuesioner:", error);
      }
    };
    fetchKuesioner();
  }, [selectedEventId]);
  
  const fetchPertanyaan = async () => {
    if (selectedKuesioner) {
      try {
        const res = await apiFetch(`/api/kuesioner/${selectedKuesioner.id}/pertanyaan`);
        const data = await res.json();
        setPertanyaanList(data);
      } catch (error) {
        console.error("Gagal memuat pertanyaan:", error);
      }
    } else {
      setPertanyaanList([]);
    }
  };

  useEffect(() => {
    fetchPertanyaan();
  }, [selectedKuesioner]);
  
  const handleAddKuesioner = async () => {
    const tipeResponden = prompt("Masukkan Tipe Responden (contoh: Penonton, UMKM):");
    if (tipeResponden && selectedEventId) {
      try {
        await apiFetch('/api/kuesioner', {
          method: 'POST',
          body: JSON.stringify({ event_id: selectedEventId, tipe_responden: tipeResponden, nama_kuesioner: `Kuesioner untuk ${tipeResponden}` })
        });
        const kuesionerRes = await apiFetch(`/api/events/${selectedEventId}/kuesioner`);
        setKuesionerList(await kuesionerRes.json());
      } catch (error) {
        alert('Gagal menambah kuesioner');
      }
    }
  };
  
  const handleAddPertanyaan = async () => {
    if (!selectedKuesioner) return alert('Pilih kuesioner terlebih dahulu');
    const teks_pertanyaan = prompt("Masukkan teks pertanyaan baru:");
    if (teks_pertanyaan) {
      const tipe_jawaban = prompt("Pilih tipe jawaban: (teks, angka, nominal, pilihan_ganda, ya_tidak)", "teks");
      try {
        await apiFetch('/api/pertanyaan', {
          method: 'POST',
          body: JSON.stringify({
            kuesioner_id: selectedKuesioner.id,
            teks_pertanyaan,
            tipe_jawaban,
            urutan: pertanyaanList.length + 1
          })
        });
        fetchPertanyaan();
      } catch (error) {
        alert('Gagal menambah pertanyaan');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Perancangan Kuesioner</h1>
      <div className="mb-6">
        <label htmlFor="event-selector" className="block text-sm font-medium text-gray-700 mb-1">1. Pilih Event untuk Dirancang</label>
        <select id="event-selector" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded-md">
          <option value="">-- Pilih Event --</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.nama_event}</option>
          ))}
        </select>
      </div>
      {selectedEventId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">2. Pilih Tipe Responden</h3>
            <ul className="space-y-2">
              {kuesionerList.map(k => (
                <li key={k.id} onClick={() => setSelectedKuesioner(k)} className={`p-2 rounded-md cursor-pointer ${selectedKuesioner?.id === k.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>{k.tipe_responden}</li>
              ))}
            </ul>
            <button onClick={handleAddKuesioner} className="w-full mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">+ Tambah Tipe Responden</button>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">3. Atur Pertanyaan untuk: <span className="text-blue-600">{selectedKuesioner?.tipe_responden || '...'}</span></h3>
              <button onClick={handleAddPertanyaan} disabled={!selectedKuesioner} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 text-sm">+ Tambah Pertanyaan</button>
            </div>
            <div className="space-y-3">
              {pertanyaanList.length > 0 ? pertanyaanList.map(p => (
                <div key={p.id} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                  <p className="font-medium">{p.urutan}. {p.teks_pertanyaan}</p>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{p.tipe_jawaban}</span>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-8">{selectedKuesioner ? 'Belum ada pertanyaan.' : 'Pilih tipe responden.'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyDesigner;
