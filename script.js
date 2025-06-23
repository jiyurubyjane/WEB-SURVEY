// INI BAGIAN PALING PENTING
// GANTI TULISAN DI BAWAH DENGAN URL WEB APP ANDA
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw369aUwPc2EWywoZXsgeTHdxtgPJZh5e5Tj45YxdEYT8VwMAQd9YHayZYRM1U9MO4/exec';

// Kode di bawah ini jangan diubah-ubah lagi
const form = document.getElementById('survey-form');
const submitButton = document.getElementById('submit-button');
const statusMessage = document.getElementById('status-message');

form.addEventListener('submit', function(e) {
  e.preventDefault(); // Mencegah halaman refresh
  
  submitButton.disabled = true;
  statusMessage.innerText = 'Mohon tunggu, sedang mengirim data...';

  fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: new FormData(form)})
    .then(response => response.json())
    .then(data => {
      if (data.result === 'success') {
        statusMessage.innerText = 'SUKSES! Data berhasil terkirim.';
        form.reset(); // Mengosongkan form
      } else {
        throw new Error('Terjadi kesalahan dari server.');
      }
    })
    .catch(error => {
      statusMessage.innerText = 'ERROR! Gagal mengirim data. Coba lagi.';
      console.error('Error!', error.message);
    })
    .finally(() => {
      // Aktifkan kembali tombol setelah 3 detik, apa pun hasilnya
      setTimeout(() => {
        submitButton.disabled = false;
        statusMessage.innerText = '';
      }, 3000);
    });
});