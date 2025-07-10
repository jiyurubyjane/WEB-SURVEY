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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
        setIsPasswordVisible(false);
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

      Swal.fire({
        title: 'Berhasil!',
        text: data.message,
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] transition-colors'
        }
      });

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

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

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
            <div className="relative">
              <input 
                type={isPasswordVisible ? 'text' : 'password'} 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={inputClasses} 
                placeholder={isEditMode ? 'Kosongkan jika tidak ingin diubah' : ''} 
              />
              <button 
                type="button" 
                onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
            <button type="button" onClick={onClose} className="font-semibold text-gray-600 bg-white hover:bg-gray-200 border border-gray-300 px-6 py-2.5 rounded-lg transition-colors">
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