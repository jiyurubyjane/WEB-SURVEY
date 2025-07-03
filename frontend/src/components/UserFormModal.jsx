import React, { useState, useEffect } from 'react';
import { apiFetch } from '../context/AuthContext';
import Swal from 'sweetalert2';

function UserFormModal({ isOpen, onClose, onSuccess, userData }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [peran, setPeran] = useState('Surveyor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(userData);

  useEffect(() => {
    if (isEditMode && userData) {
      setNama(userData.nama || '');
      setEmail(userData.email || '');
      setPeran(userData.peran || 'Surveyor');
      setPassword(''); // Kosongkan password saat mode edit
    } else {
      // Reset form untuk mode tambah
      setNama('');
      setEmail('');
      setPassword('');
      setPeran('Surveyor');
    }
  }, [isOpen, userData, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { nama, email, peran };
    // Hanya tambahkan password ke payload jika diisi
    if (password) {
      payload.password = password;
    }
    
    // Jika mode tambah, password wajib diisi
    if (!isEditMode && !password) {
        Swal.fire('Peringatan', 'Password wajib diisi untuk pengguna baru.', 'warning');
        setIsSubmitting(false);
        return;
    }

    try {
      const url = isEditMode ? `/api/users/${userData.id}` : '/api/users';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.');

      Swal.fire('Berhasil!', data.message, 'success');
      onSuccess(); // Panggil callback untuk refresh data di halaman utama
      onClose();   // Tutup modal
    } catch (error) {
      Swal.fire('Gagal!', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input type="text" id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label htmlFor="password">{isEditMode ? 'Password Baru (Opsional)' : 'Password'}</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : ''} />
            </div>
            <div>
              <label htmlFor="peran" className="block text-sm font-medium text-gray-700">Peran</label>
              <select id="peran" value={peran} onChange={(e) => setPeran(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option value="Surveyor">Surveyor</option>
                <option value="Admin">Admin</option>
                <option value="Instansi">Instansi</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;