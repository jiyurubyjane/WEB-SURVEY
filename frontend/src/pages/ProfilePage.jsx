import React, { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../context/AuthContext';
import Swal from 'sweetalert2';

const StatCard = ({ label, value }) => (
  <div className="bg-white p-4 rounded-xl text-center border border-gray-200 shadow-sm flex flex-col justify-center items-center h-28">
    <p className="text-4xl font-bold text-[#202262]">{value}</p>
    <p className="text-xs text-gray-500 mt-2 font-semibold tracking-wider uppercase">{label}</p>
  </div>
);

const AdminStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4">
    <StatCard label="Total User" value={stats.total_pengguna || 0} />
    <StatCard label="Event Aktif" value={stats.total_event_aktif || 0} />
    <StatCard label="Data Survei" value={stats.total_data_survei || 0} />
  </div>
);

const SurveyorStats = ({ stats }) => (
  <div className="grid grid-cols-2 gap-4">
    <StatCard label="Survei Diinput" value={stats.total_survei || 0} />
    <StatCard label="Event Diikuti" value={stats.total_event || 0} />
  </div>
);

const ProfileHeader = () => {
  const { user } = useAuth();

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start items-center h-16">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Halo, {user?.nama}!</span>
          </div>
        </div>
      </div>
    </header>
  );
};

function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({ nama: '', email: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

  useEffect(() => {
    if (user) {
      setFormData({ nama: user.nama, email: user.email });
      
      if (user.peran === 'Surveyor' || user.peran === 'Admin') {
        apiFetch('/api/me/stats')
          .then(res => {
            if (!res.ok) {
              console.error('Gagal memuat statistik, server merespons dengan status:', res.status);
              return; 
            }
            return res.json();
          })
          .then(data => {
            if (data) setStats(data);
          })
          .catch(err => console.error("Gagal memuat statistik:", err));
      }
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      const updatedUser = await res.json();
      if (!res.ok) throw new Error(updatedUser.error || 'Gagal memperbarui profil.');
      
      const userWithSamePeran = { ...user, ...updatedUser };
      setUser(userWithSamePeran);
      
      setIsEditing(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Profile Anda telah diubah!',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] transition-colors'
        }
      });
    } catch (err) {
      Swal.fire({
        title: 'Oops...',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] transition-colors'
        }
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return Swal.fire('Oops...', 'Password baru dan konfirmasi tidak cocok.', 'error');
    }
    try {
      const res = await apiFetch('/api/me/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      Swal.fire({
        title: 'Berhasil!',
        text: 'Password Anda telah diubah!',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] transition-colors'
        }
      });
    } catch (err) {
      Swal.fire('Oops...', err.message || 'Gagal mengubah password.', 'error');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14BBF0] focus:border-[#14BBF0]";

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      <ProfileHeader />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#14BBF0] to-[#0085CE] text-white flex items-center justify-center text-5xl font-bold mx-auto mb-4 border-4 border-white shadow-md">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{user.nama}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="mt-4 inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">{user.peran}</span>
            </div>

            {(user.peran === 'Surveyor' || user.peran === 'Admin') && (
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold text-xl mb-4 text-[#202262]">Statistik Kinerja</h3>
                {user.peran === 'Admin' && <AdminStats stats={stats} />}
                {user.peran === 'Surveyor' && <SurveyorStats stats={stats} />}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-[#202262]">Informasi Akun</h3>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-medium text-[#14BBF0] hover:text-[#0085CE]">
                  {isEditing ? 'Batal' : 'Edit Profil'}
                </button>
              </div>
              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClasses} />
                  </div>
                  <button type="submit" className="w-full font-semibold text-white bg-green-500 hover:bg-green-600 px-6 py-2.5 rounded-lg transition-colors">Simpan Perubahan</button>
                </form>
              ) : (
                <div className="space-y-3 text-gray-700">
                  <p><strong>Nama:</strong> {user.nama}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Peran:</strong> {user.peran}</p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-xl mb-6 text-[#202262]">Ubah Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <input type="password" placeholder="Password Lama" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} className={inputClasses} required />
                <input type="password" placeholder="Password Baru" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className={inputClasses} required />
                <input type="password" placeholder="Konfirmasi Password Baru" value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})} className={inputClasses} required />
                <button type="submit" className="w-full font-semibold text-white bg-[#14BBF0] hover:bg-[#0085CE] px-6 py-2.5 rounded-lg transition-colors">Simpan Password Baru</button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-800 font-semibold hover:underline"
          >
            Logout dari Akun
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
