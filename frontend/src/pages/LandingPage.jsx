const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Selamat Datang di Aplikasi Survei Event Olahraga</h1>
      <p className="text-gray-700 mb-6">
        Aplikasi ini digunakan untuk mengukur dampak event olahraga terhadap pertumbuhan ekonomi Indonesia.
      </p>
      <div className="flex gap-4">
        <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login</a>
        <a href="/register" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Daftar</a>
      </div>
    </div>
  );
};

export default LandingPage;
