import { Clock, Key } from "lucide-react";
import { useState } from "react";
import type { UserProfile, backendInterface } from "../backend";

interface WaitingPageProps {
  profile: UserProfile | null;
  actor: backendInterface;
  onTokenVerified: () => void;
  onLogout: () => void;
}

export default function WaitingPage({
  profile,
  onTokenVerified,
  onLogout,
}: WaitingPageProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Masukkan kode token terlebih dahulu.");
      return;
    }
    localStorage.setItem("rkh_access_token", token.trim());
    onTokenVerified();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-[#1a7a4a] text-white py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/assets/uploads/bkkbn-019d1e7a-bd36-77cf-b342-f26ff46cd60b-1.png"
            alt="BKKBN Logo"
            className="h-12 w-auto"
          />
          <h1 className="text-lg font-bold">SISTEM LAPORAN RKH PENYULUH KB</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-white text-sm opacity-80 hover:opacity-100"
        >
          Keluar
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Menunggu Persetujuan
            </h2>
            {profile && (
              <p className="text-gray-600 text-sm mt-1">
                {profile.namalengkap} - NIP: {profile.nip}
              </p>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
            <p>
              Akun Anda sedang menunggu persetujuan dari admin. Setelah
              disetujui, admin akan memberikan kode token akses kepada Anda.
            </p>
          </div>
          <form onSubmit={handleTokenSubmit}>
            <div className="mb-4">
              <label
                htmlFor="token-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <span className="flex items-center gap-2">
                  <Key size={14} /> Masukkan Kode Token Akses
                </span>
              </label>
              <input
                id="token-input"
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError("");
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="Masukkan token yang diberikan admin"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-[#1a7a4a] hover:bg-green-800 text-white font-semibold py-2 px-4 rounded text-sm"
            >
              Verifikasi Token &amp; Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
