import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../context/AuthContext';
import UserFormModal from '../../components/UserFormModal'; // Import modal baru
import Swal from 'sweetalert2';

function KelolaPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk modal
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
    setUserToEdit(null); // Pastikan tidak ada data edit
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
        title: 'Anda yakin?',
        text: `Anda akan menghapus pengguna "${userName}". Aksi ini tidak bisa dibatalkan!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            Swal.fire('Terhapus!', data.message, 'success');
            fetchUsers(); // Refresh daftar pengguna
        } catch (error) {
            Swal.fire('Gagal!', error.message, 'error');
        }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Memuat data pengguna...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Manajemen Pengguna</h1>
          <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            + Tambah Pengguna Baru
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peran</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{user.nama}</td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{user.email}</td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                      user.peran === 'Admin' ? 'text-green-900 bg-green-200' : 
                      user.peran === 'Surveyor' ? 'text-blue-900 bg-blue-200' : 'text-purple-900 bg-purple-200'
                    } rounded-full`}>
                      <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                      <span className="relative">{user.peran}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                    <button onClick={() => handleDeleteUser(user.id, user.nama)} className="ml-4 text-red-600 hover:text-red-900 font-medium">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render komponen modal */}
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