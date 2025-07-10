import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../context/AuthContext';
import UserFormModal from '../../components/UserFormModal';
import Swal from 'sweetalert2';

function KelolaPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/users');
      if (!res.ok) throw new Error('Gagal mengambil data pengguna.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId, userName) => {
    await Swal.fire({
      title: 'Anda yakin?',
      text: `Anda akan menghapus pengguna "${userName}". Aksi ini tidak bisa dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        actions: 'gap-4',
        confirmButton: 'font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-colors',
        cancelButton: 'font-semibold text-gray-600 bg-white hover:bg-gray-200 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors'
      }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                Swal.fire('Terhapus!', data.message, 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('Gagal!', error.message, 'error');
            }
        }
    });
  };

  if (isLoading) return <div className="text-center p-12">Memuat data pengguna...</div>;
  if (error) return <div className="text-center p-12 text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#202262]">Manajemen Pengguna</h1>
          <p className="mt-1 text-gray-500">Tambah, edit, dan hapus data pengguna sistem.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#14BBF0] text-white font-semibold px-5 py-3 rounded-full hover:bg-[#0085CE] transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Peran</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold leading-tight rounded-full ${
                      user.peran === 'Admin' ? 'text-green-800 bg-green-100' : 
                      user.peran === 'Surveyor' ? 'text-blue-800 bg-blue-100' : 'text-purple-800 bg-purple-100'
                    }`}>
                      {user.peran}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 sm:gap-4">
                      <button onClick={() => handleOpenEditModal(user)} title="Edit" className="text-gray-500 hover:text-[#14BBF0] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteUser(user.id, user.nama)} title="Hapus" className="text-gray-500 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        userData={userToEdit}
      />
    </>
  );
}

export default KelolaPenggunaPage;
