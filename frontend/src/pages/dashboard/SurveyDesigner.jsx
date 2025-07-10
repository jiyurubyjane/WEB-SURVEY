import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../context/AuthContext';
import Swal from 'sweetalert2';

function SurveyDesigner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [kuesionerList, setKuesionerList] = useState([]);
  const [selectedKuesioner, setSelectedKuesioner] = useState(null);
  const [pertanyaanList, setPertanyaanList] = useState([]);

  const fetchEvents = async () => {
    try {
      const res = await apiFetch('/api/events?status=aktif');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Gagal memuat event:", error);
    }
  };

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

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { fetchKuesioner(); }, [selectedEventId]);
  useEffect(() => { fetchPertanyaan(); }, [selectedKuesioner]);

  const handleAddKuesioner = async () => {
    const { value: tipeResponden } = await Swal.fire({
      title: 'Tambah Tipe Responden',
      input: 'text',
      inputLabel: 'Nama Tipe Responden (contoh: Penonton, UMKM)',
      inputPlaceholder: 'Masukkan nama tipe...',
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      },
      inputValidator: (value) => !value && 'Anda perlu mengisi nama tipe responden!'
    });

    if (tipeResponden && selectedEventId) {
      try {
        await apiFetch('/api/kuesioner', {
          method: 'POST',
          body: JSON.stringify({ event_id: selectedEventId, tipe_responden: tipeResponden, nama_kuesioner: `Kuesioner untuk ${tipeResponden}` })
        });
        fetchKuesioner();
        Swal.fire({
            title: 'Berhasil!', 
            text: `Tipe responden "${tipeResponden}" telah ditambahkan.`, 
            icon: 'success',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors'
            }
        });
      } catch (error) {
        Swal.fire({
            title: 'Gagal!', 
            text: 'Terjadi kesalahan saat menambah kuesioner.', 
            icon: 'error',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors'
            }
        });
      }
    }
  };

  const handleDeleteKuesioner = async (id, namaTipe) => {
    await Swal.fire({
      title: 'Anda yakin?',
      text: `Anda akan menghapus tipe responden "${namaTipe}". Aksi ini tidak bisa dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await apiFetch(`/api/kuesioner/${id}`, { method: 'DELETE' });
                fetchKuesioner();
                if (selectedKuesioner?.id === id) setSelectedKuesioner(null);
                Swal.fire({
                    title: 'Terhapus!', 
                    text: `Tipe responden "${namaTipe}" berhasil dihapus.`, 
                    icon: 'success',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors'
                    }
                });
            } catch (error) {
                Swal.fire({
                    title: 'Gagal!', 
                    text: 'Gagal menghapus tipe responden.', 
                    icon: 'error',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors'
                    }
                });
            }
        }
    });
  };

  const handleAddPertanyaan = async () => {
    if (!selectedKuesioner) {
      Swal.fire({
        title: 'Peringatan', 
        text: 'Pilih tipe responden terlebih dahulu.', 
        icon: 'warning',
        buttonsStyling: false,
        customClass: {
            confirmButton: 'font-semibold text-white bg-yellow-500 hover:bg-yellow-600 px-5 py-2.5 rounded-lg transition-colors'
        }
      });
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
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      },
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
        Swal.fire({
            title: 'Berhasil!', 
            text: 'Pertanyaan baru telah ditambahkan.', 
            icon: 'success',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors'
            }
        });
      } catch (error) {
        Swal.fire({
            title: 'Gagal!', 
            text: 'Gagal menambah pertanyaan.', 
            icon: 'error',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors'
            }
        });
      }
    }
  };

  const handleDeletePertanyaan = async (id, teksPertanyaan) => {
    await Swal.fire({
      title: "Anda yakin?",
      text: `Anda akan menghapus pertanyaan: "${teksPertanyaan}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await apiFetch(`/api/pertanyaan/${id}`, { method: 'DELETE' });
                fetchPertanyaan();
                Swal.fire({
                    title: 'Terhapus!', 
                    text: 'Pertanyaan berhasil dihapus.', 
                    icon: 'success',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-5 py-2.5 rounded-lg transition-colors'
                    }
                });
            } catch (error) {
                Swal.fire({
                    title: 'Gagal!', 
                    text: 'Gagal menghapus pertanyaan.', 
                    icon: 'error',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors'
                    }
                });
            }
        }
    });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#202262]">Perancangan Kuesioner</h1>
        <p className="mt-1 text-gray-500">Pilih event, lalu atur tipe responden dan daftar pertanyaan untuk setiap survei.</p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <label htmlFor="event-selector" className="block text-sm font-bold text-gray-800 mb-2">1. Pilih Event untuk Dirancang</label>
        <div className="relative w-full max-w-lg">
          <select 
            id="event-selector" 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)} 
            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0] appearance-none"
          >
            <option value="">-- Pilih Event --</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.nama_event}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl text-[#202262] mb-4">2. Tipe Responden</h3>
            <ul className="space-y-2">
              {kuesionerList.map(k => (
                <li key={k.id} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedKuesioner?.id === k.id ? 'bg-[#14BBF0] text-white' : 'hover:bg-gray-100'}`} onClick={() => setSelectedKuesioner(k)}>
                  <span className="font-medium">{k.tipe_responden}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteKuesioner(k.id, k.tipe_responden); }} className={`text-sm ${selectedKuesioner?.id === k.id ? 'hover:text-red-200' : 'text-gray-400 hover:text-red-600'}`}>Hapus</button>
                </li>
              ))}
            </ul>
            <button onClick={handleAddKuesioner} className="w-full mt-4 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-200 text-sm transition-colors">+ Tambah Tipe</button>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-xl text-[#202262]">3. Daftar Pertanyaan</h3>
                <p className="text-sm text-gray-500">Untuk: <span className="font-semibold text-gray-800">{selectedKuesioner?.tipe_responden || '...'}</span></p>
              </div>
              <button onClick={handleAddPertanyaan} disabled={!selectedKuesioner} className="bg-[#14BBF0] text-white font-semibold px-4 py-2 rounded-full hover:bg-[#0085CE] disabled:bg-gray-300 transition-colors shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <span>Tambah</span>
              </button>
            </div>
            <div className="space-y-3">
              {pertanyaanList.length > 0 ? pertanyaanList.map((p, index) => (
                <div key={p.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{index + 1}. {p.teks_pertanyaan}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{p.tipe_jawaban}</span>
                    <button onClick={() => handleDeletePertanyaan(p.id, p.teks_pertanyaan)} className="text-gray-400 hover:text-red-600" title="Hapus Pertanyaan">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-12">
                  <p>{selectedKuesioner ? 'Belum ada pertanyaan untuk tipe ini.' : 'Pilih tipe responden di sebelah kiri untuk melihat pertanyaannya.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SurveyDesigner;
