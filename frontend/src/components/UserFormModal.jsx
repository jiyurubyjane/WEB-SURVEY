import React, { useState, useEffect } from 'react';
import { apiFetch } from '../context/AuthContext';
import Swal from 'sweetalert2';

function UserFormModal({ isOpen, onClose, onSuccess, userData }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [peran, setPeran] = useState('Surveyor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(userData?.id);

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && userData) {
            setNama(userData.nama || '');
            setEmail(userData.email || '');
            setPeran(userData.peran || 'Surveyor');
            setPassword('');
        } else {
            setNama('');
            setEmail('');
            setPassword('');
            setPeran('Surveyor');
        }
        setError('');
    }
  }, [isOpen, userData, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = { nama, email, peran };
    if (password) {
      payload.password = password;
    }
    
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
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0]";
  const selectClasses = `${inputClasses} appearance-none`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#202262]">{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className={inputClasses} required />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {isEditMode ? 'Password Baru (Opsional)' : 'Password'}
            </label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder={isEditMode ? 'Kosongkan jika tidak ingin diubah' : ''} />
          </div>

          <div>
            <label htmlFor="peran" className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
            <div className="relative">
              <select id="peran" value={peran} onChange={(e) => setPeran(e.target.value)} className={selectClasses}>
                <option value="Surveyor">Surveyor</option>
                <option value="Admin">Admin</option>
                <option value="Instansi">Instansi</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 px-6 py-2.5 rounded-lg transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-6 py-2.5 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
