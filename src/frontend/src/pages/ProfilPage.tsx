import { Edit3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile, UserProfile, backendInterface } from "../backend";
import { ExternalBlob as ExtBlob } from "../backend";

const JABATAN_OPTIONS = [
  "PKB AHLI",
  "PKB MAHIR",
  "PKB PENYELIA",
  "PKB TERAMPIL",
  "PLKB",
  "PKB",
  "Koordinator Penyuluh KB",
];

interface ProfilPageProps {
  actor: backendInterface;
  profile: UserProfile | null;
  onSaved: (p: UserProfile) => void;
}

export default function ProfilPage({
  actor,
  profile,
  onSaved,
}: ProfilPageProps) {
  const [form, setForm] = useState({
    namalengkap: "",
    nip: "",
    jabatan: "",
    unitKerja: "",
    wilayahKerja: "",
    phoneNumber: "",
  });
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        namalengkap: profile.namalengkap || "",
        nip: profile.nip || "",
        jabatan: profile.jabatan || "",
        unitKerja: profile.unitKerja || "",
        wilayahKerja: profile.wilayahKerja || "",
        phoneNumber: profile.phoneNumber || "",
      });
      if (profile.signature) {
        const url = profile.signature.getDirectURL?.();
        if (url) setSigPreview(url);
      }
    }
  }, [profile]);

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      let sigBlob: import("../backend").ExternalBlob | null = null;
      if (sigFile) {
        const bytes = new Uint8Array(await sigFile.arrayBuffer());
        sigBlob = ExtBlob.fromBytes(bytes);
      }
      const profileData: Profile = {
        namalengkap: form.namalengkap,
        nip: form.nip,
        jabatan: form.jabatan,
        unitKerja: form.unitKerja,
        wilayahKerja: form.wilayahKerja,
        phoneNumber: form.phoneNumber,
      };
      await actor.saveCallerProfile(profileData, sigBlob);
      const updated: UserProfile = { ...profileData };
      onSaved(updated);
      setSuccess(true);
    } catch (err) {
      setError("Gagal menyimpan profil. Silakan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#1a7a4a] text-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👤</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Profil Saya</h2>
            <p className="text-sm opacity-80">Kelola informasi profil Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 mb-4 text-sm">
              Profil berhasil disimpan!
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="namalengkap"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                id="namalengkap"
                type="text"
                value={form.namalengkap}
                onChange={(e) =>
                  setForm({ ...form, namalengkap: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="nip"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                NIP <span className="text-red-500">*</span>
              </label>
              <input
                id="nip"
                type="text"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="jabatan"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jabatan <span className="text-red-500">*</span>
              </label>
              <select
                id="jabatan"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="">Pilih Jabatan</option>
                {JABATAN_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="unitkerja"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unit Kerja <span className="text-red-500">*</span>
              </label>
              <input
                id="unitkerja"
                type="text"
                value={form.unitKerja}
                onChange={(e) =>
                  setForm({ ...form, unitKerja: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="wilayahkerja"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Wilayah Kerja <span className="text-red-500">*</span>
              </label>
              <input
                id="wilayahkerja"
                type="text"
                value={form.wilayahKerja}
                onChange={(e) =>
                  setForm({ ...form, wilayahKerja: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="nomorhp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nomor HP <span className="text-red-500">*</span>
              </label>
              <input
                id="nomorhp"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Edit3 size={14} /> Tanda Tangan
            </h3>
            {sigPreview ? (
              <div className="flex items-center gap-4">
                <img
                  src={sigPreview}
                  alt="Tanda Tangan"
                  className="h-16 object-contain border border-gray-200 rounded p-1"
                />
                <span className="text-sm text-green-600">
                  Tanda tangan berhasil diunggah
                </span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 cursor-pointer hover:bg-gray-50">
                    <Edit3 size={12} /> Ganti
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSigChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSigPreview(null);
                      setSigFile(null);
                    }}
                    className="flex items-center gap-1 text-sm text-red-500 border border-red-300 rounded px-3 py-1 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                <div className="w-32 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-green-400 transition-colors">
                  <span className="text-xs text-center px-2">
                    Upload Tanda Tangan
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSigChange}
                />
              </label>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Format: JPG, PNG, atau GIF. Disarankan menggunakan tanda tangan
              dengan latar belakang transparan atau putih.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1a7a4a] hover:bg-green-800 text-white font-semibold py-2 px-6 rounded text-sm disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}
