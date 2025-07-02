import { useEffect, useState } from 'react';
import { apiFetch } from '../../context/AuthContext';
import Swal from 'sweetalert2'; // Import SweetAlert2

function SurveyDesigner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesioner, setSelectedKuesioner] = useState(null);
  const [pertanyaanList, setPertanyaanList] = useState([]);

  // Fungsi untuk mengambil data event
  const fetchEvents = async () => {
    try {
      const res = await apiFetch('/api/events?status=aktif');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Gagal memuat event:", error);
    }
  };

  // Fungsi untuk mengambil data kuesioner
  const fetchKuesioner = async () => {
    if (!selectedEventId) {
      setKuesionerList([]);
      setSelectedKuesioner(null);
      return;
    }
    try {
      const res = await apiFetch(`/api/events/${selectedEventId}/kuesioner`);
      const data = await res.json();
      setKuesionerList(data);
      setSelectedKuesioner(null);
    } catch (error) {
      console.error("Gagal memuat kuesioner:", error);
    }
  };

  // Fungsi untuk mengambil pertanyaan
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
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchKuesioner();
  }, [selectedEventId]);

  useEffect(() => {
    fetchPertanyaan();
  }, [selectedKuesioner]);

  // =================================================================
  // === PERUBAHAN: Fungsi Tambah Tipe Responden dengan SweetAlert ===
  // =================================================================
  const handleAddKuesioner = async () => {
    const { value: tipeResponden } = await Swal.fire({
      title: 'Tambah Tipe Responden Baru',
      input: 'text',
      inputLabel: 'Nama Tipe Responden (contoh: Penonton, UMKM)',
      inputPlaceholder: 'Masukkan nama tipe...',
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value) {
          return 'Anda perlu mengisi nama tipe responden!'
        }
      }
    });

    if (tipeResponden && selectedEventId) {
      try {
        await apiFetch('/api/kuesioner', {
          method: 'POST',
          body: JSON.stringify({ event_id: selectedEventId, tipe_responden: tipeResponden, nama_kuesioner: `Kuesioner untuk ${tipeResponden}` })
        });
        fetchKuesioner(); // Refresh daftar
        Swal.fire('Berhasil!', `Tipe responden "${tipeResponden}" telah ditambahkan.`, 'success');
      } catch (error) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menambah kuesioner.', 'error');
      }
    }
  };

  // =================================================================
  // === PERUBAHAN: Fungsi Hapus Tipe Responden dengan SweetAlert ===
  // =================================================================
  const handleDeleteKuesioner = async (id, namaTipe) => {
    const result = await Swal.fire({
        title: 'Anda yakin?',
        text: `Anda akan menghapus tipe responden "${namaTipe}". Aksi ini tidak bisa dibatalkan!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            await apiFetch(`/api/kuesioner/${id}`, { method: 'DELETE' });
            fetchKuesioner(); // Refresh daftar
            if (selectedKuesioner?.id === id) {
                setSelectedKuesioner(null);
            }
            Swal.fire('Terhapus!', `Tipe responden "${namaTipe}" berhasil dihapus.`, 'success');
        } catch (error) {
            Swal.fire('Gagal!', 'Gagal menghapus tipe responden.', 'error');
            console.error(error);
        }
    }
  };

  // =================================================================
  // === PERUBAHAN: Fungsi Tambah Pertanyaan dengan SweetAlert ===
  // =================================================================
  const handleAddPertanyaan = async () => {
    if (!selectedKuesioner) {
        Swal.fire('Peringatan', 'Pilih tipe responden terlebih dahulu.', 'warning');
        return;
    }
    
    const { value: formValues } = await Swal.fire({
        title: 'Tambah Pertanyaan Baru',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Teks pertanyaan...">' +
            '<select id="swal-input2" class="swal2-select">' +
                '<option value="teks">Teks</option>' +
                '<option value="angka">Angka</option>' +
                '<option value="nominal">Nominal (Rp)</option>' +
                '<option value="ya_tidak">Ya/Tidak</option>' +
            '</select>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const teks = document.getElementById('swal-input1').value;
            const tipe = document.getElementById('swal-input2').value;
            if (!teks) {
                Swal.showValidationMessage('Teks pertanyaan tidak boleh kosong');
                return null;
            }
            return { teks_pertanyaan: teks, tipe_jawaban: tipe };
        }
    });

    if (formValues) {
        try {
            await apiFetch('/api/pertanyaan', {
                method: 'POST',
                body: JSON.stringify({
                    kuesioner_id: selectedKuesioner.id,
                    teks_pertanyaan: formValues.teks_pertanyaan,
                    tipe_jawaban: formValues.tipe_jawaban,
                    urutan: pertanyaanList.length + 1
                })
            });
            fetchPertanyaan();
            Swal.fire('Berhasil!', 'Pertanyaan baru telah ditambahkan.', 'success');
        } catch (error) {
            Swal.fire('Gagal!', 'Gagal menambah pertanyaan.', 'error');
        }
    }
  };

  // =================================================================
  // === PERUBAHAN: Fungsi Hapus Pertanyaan dengan SweetAlert ===
  // =================================================================
  const handleDeletePertanyaan = async (id, teksPertanyaan) => {
    const result = await Swal.fire({
        title: "Anda yakin?",
        text: `Anda akan menghapus pertanyaan: "${teksPertanyaan}"`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            await apiFetch(`/api/pertanyaan/${id}`, { method: 'DELETE' });
            fetchPertanyaan();
            Swal.fire('Terhapus!', 'Pertanyaan berhasil dihapus.', 'success');
        } catch (error) {
            console.error("Gagal menghapus pertanyaan:", error);
            Swal.fire('Gagal!', 'Gagal menghapus pertanyaan.', 'error');
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
                <li key={k.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100">
                  <span onClick={() => setSelectedKuesioner(k)} className={`cursor-pointer ${selectedKuesioner?.id === k.id ? 'text-white bg-blue-500 p-1 rounded' : ''}`}>
                    {k.tipe_responden}
                  </span>
                  <button onClick={() => handleDeleteKuesioner(k.id, k.tipe_responden)} className="text-red-500 hover:underline text-sm">Hapus</button>
                </li>
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
                  <div>
                    <p className="font-medium">{p.urutan}. {p.teks_pertanyaan}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{p.tipe_jawaban}</span>
                    <button
                      onClick={() => handleDeletePertanyaan(p.id, p.teks_pertanyaan)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
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