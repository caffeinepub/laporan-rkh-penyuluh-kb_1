interface LoginPageProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  loginError?: string;
}

export default function LoginPage({
  onLogin,
  isLoggingIn,
  loginError,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a7a4a] text-white py-3 px-6 flex items-center gap-4">
        <img
          src="/assets/uploads/bkkbn-019d1e7a-bd36-77cf-b342-f26ff46cd60b-1.png"
          alt="BKKBN Logo"
          className="h-12 w-auto"
        />
        <h1 className="text-lg font-bold">SISTEM LAPORAN RKH PENYULUH KB</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
          <div className="text-center mb-8">
            <img
              src="/assets/uploads/bkkbn-019d1e7a-bd36-77cf-b342-f26ff46cd60b-1.png"
              alt="BKKBN Logo"
              className="h-20 w-auto mx-auto mb-4"
            />
            <h2 className="text-xl font-bold text-gray-800">
              Laporan RKH Penyuluh KB
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Badan Kependudukan dan Keluarga Berencana Nasional
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-800">
            <p className="font-semibold mb-1">Cara Masuk:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Klik tombol Masuk dengan Internet Identity</li>
              <li>Buat atau gunakan akun Internet Identity Anda</li>
              <li>Daftar sebagai penyuluh dan isi data profil</li>
              <li>Tunggu persetujuan admin dan masukkan token akses</li>
            </ol>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {loginError}
            </div>
          )}

          <button
            type="button"
            onClick={onLogin}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            className="w-full bg-[#1a7a4a] hover:bg-green-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menghubungkan ke Internet Identity...
              </>
            ) : (
              "Masuk dengan Internet Identity"
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Belum memiliki akun? Login untuk mendaftar sebagai penyuluh KB.
          </p>
        </div>
      </div>
    </div>
  );
}
