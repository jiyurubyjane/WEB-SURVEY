import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-9xl font-extrabold text-gray-700">404</h1>
      <h2 className="text-3xl font-bold text-gray-800">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-4 text-gray-500">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link to="/" className="mt-6">
        <button className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700">
          Kembali ke Halaman Utama
        </button>
      </Link>
    </div>
  );
}

export default NotFound;