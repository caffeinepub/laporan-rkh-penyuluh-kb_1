import { useState } from "react";
import type { UserProfile, backendInterface } from "../backend";

interface RegisterPageProps {
  actor: backendInterface;
  onRegistered: (profile: UserProfile) => void;
}

const JABATAN_OPTIONS = [
  "PKB AHLI",
  "PKB MAHIR",
  "PKB PENYELIA",
  "PKB TERAMPIL",
  "PLKB",
  "PKB",
  "Koordinator Penyuluh KB",
];

export default function RegisterPage({
  actor,
  onRegistered,
}: RegisterPageProps) {
  const [form, setForm] = useState({
    namalengkap: "",
    nip: "",
    jabatan: "",
    unitKerja: "",
    wilayahKerja: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.namalengkap ||
      !form.nip ||
      !form.jabatan ||
      !form.unitKerja ||
      !form.wilayahKerja ||
      !form.phoneNumber
    ) {
      setError("Semua field wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profile: UserProfile = {
        namalengkap: form.namalengkap,
        nip: form.nip,
        jabatan: form.jabatan,
        unitKerja: form.unitKerja,
        wilayahKerja: form.wilayahKerja,
        phoneNumber: form.phoneNumber,
      };
      await actor.saveCallerUserProfile(profile);
      await actor.requestApproval();
      onRegistered(profile);
    } catch (err) {
      setError("Gagal mendaftar. Silakan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    as?: string;
    options?: string[];
  }[] = [
    {
      id: "namalengkap",
      label: "Nama Lengkap",
      type: "text",
      placeholder: "Masukkan nama lengkap",
    },
    {
      id: "nip",
      label: "NIP",
      type: "text",
      placeholder: "Nomor Induk Pegawai",
    },
    {
      id: "jabatan",
      label: "Jabatan",
      as: "select",
      placeholder: "",
      options: JABATAN_OPTIONS,
    },
    {
      id: "unitKerja",
      label: "Unit Kerja",
      type: "text",
      placeholder: "Contoh: SUBANG",
    },
    {
      id: "wilayahKerja",
      label: "Wilayah Kerja",
      type: "text",
      placeholder: "Contoh: CISALAK",
    },
    {
      id: "phoneNumber",
      label: "Nomor HP",
      type: "tel",
      placeholder: "08xxxxxxxxxx",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-[#1a7a4a] text-white py-3 px-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-[#1a7a4a] font-bold text-xs">BKKBN</span>
        </div>
        <h1 className="text-lg font-bold">SISTEM LAPORAN RKH PENYULUH KB</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-2xl">
          <div className="bg-[#1a7a4a] text-white p-4 rounded-t-lg">
            <h2 className="font-bold text-lg">Pendaftaran Penyuluh KB</h2>
            <p className="text-sm opacity-80">
              Isi data diri Anda untuk mendaftar
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ id, label, type, placeholder, as, options }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {label} <span className="text-red-500">*</span>
                  </label>
                  {as === "select" ? (
                    <select
                      id={id}
                      value={form[id as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [id]: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    >
                      <option value="">Pilih {label}</option>
                      {options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type={type}
                      value={form[id as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [id]: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      placeholder={placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a7a4a] hover:bg-green-800 text-white font-semibold py-2 px-6 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
