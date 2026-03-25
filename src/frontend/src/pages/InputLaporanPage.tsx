import { Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ExternalBlob, RKH, backendInterface } from "../backend";
import { ExternalBlob as ExtBlob } from "../backend";

interface InputLaporanPageProps {
  actor: backendInterface;
  editingRkh: RKH | null;
  onSaved: () => void;
  onCancel: () => void;
}

const parseKegiatan = (ca: string) => {
  const parts = ca.split("||");
  return { kegiatan: parts[0] || "", hasil: parts[1] || "" };
};

const parseRemarks = (r?: string) => {
  if (!r) return { metode: "", keterangan: "" };
  const parts = r.split("||");
  if (parts.length >= 2)
    return { metode: parts[0] || "", keterangan: parts[1] || "" };
  // legacy: no separator, treat as keterangan only
  return { metode: "", keterangan: r };
};

export default function InputLaporanPage({
  actor,
  editingRkh,
  onSaved,
  onCancel,
}: InputLaporanPageProps) {
  const isEdit = editingRkh !== null;

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    kegiatan: "",
    sasaran: "",
    jumlah: "",
    lokasi: "",
    hasil: "",
    metode: "",
    keterangan: "",
  });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initForm = useCallback(() => {
    if (editingRkh) {
      const { kegiatan, hasil } = parseKegiatan(editingRkh.completedAction);
      const { metode, keterangan } = parseRemarks(editingRkh.remarks);
      const dateMs = Number(editingRkh.date / BigInt(1_000_000));
      const d = new Date(dateMs);
      const dateStr = d.toISOString().split("T")[0];
      setForm({
        tanggal: dateStr,
        kegiatan,
        sasaran: editingRkh.targetGroup,
        jumlah: editingRkh.numTargeted.toString(),
        lokasi: editingRkh.place,
        hasil,
        metode,
        keterangan,
      });
    }
  }, [editingRkh]);

  useEffect(() => {
    initForm();
  }, [initForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.tanggal ||
      !form.kegiatan ||
      !form.sasaran ||
      !form.jumlah ||
      !form.lokasi ||
      !form.hasil
    ) {
      setError("Mohon isi semua field yang wajib.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let docBlob: ExternalBlob | undefined = editingRkh?.document;
      let imgBlob: ExternalBlob | undefined = editingRkh?.image;

      if (docFile) {
        const bytes = new Uint8Array(await docFile.arrayBuffer());
        docBlob = ExtBlob.fromBytes(bytes);
      }
      if (imgFile) {
        const bytes = new Uint8Array(await imgFile.arrayBuffer());
        imgBlob = ExtBlob.fromBytes(bytes);
      }

      const dateObj = new Date(`${form.tanggal}T00:00:00`);
      const dateNs = BigInt(dateObj.getTime()) * BigInt(1_000_000);

      // Pack metode and keterangan into remarks
      const remarksValue = `${form.metode}||${form.keterangan}`;

      const rkh: RKH = {
        action: editingRkh ? editingRkh.action : BigInt(Date.now()),
        date: dateNs,
        targetGroup: form.sasaran,
        numTargeted: BigInt(Number.parseInt(form.jumlah) || 0),
        place: form.lokasi,
        completedAction: `${form.kegiatan}||${form.hasil}`,
        remarks: remarksValue || undefined,
        document: docBlob,
        image: imgBlob,
      };

      if (editingRkh) {
        await actor.deleteRKH(editingRkh.action);
      }
      await actor.addRKH(rkh);
      onSaved();
    } catch (err) {
      setError("Gagal menyimpan laporan. Silakan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#1a7a4a] text-white p-4">
          <h2 className="font-bold text-lg">
            {isEdit ? "Edit Laporan RKH" : "Input Laporan RKH Baru"}
          </h2>
          <p className="text-sm opacity-80">
            Rencana Kegiatan Harian Penyuluh KB
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tanggal"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Kegiatan <span className="text-red-500">*</span>
              </label>
              <input
                id="tanggal"
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="kegiatan"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kegiatan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="kegiatan"
              value={form.kegiatan}
              onChange={(e) => setForm({ ...form, kegiatan: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="Contoh: Pertemuan BKB"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sasaran"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sasaran <span className="text-red-500">*</span>
              </label>
              <input
                id="sasaran"
                type="text"
                value={form.sasaran}
                onChange={(e) => setForm({ ...form, sasaran: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="PUS dan Anggota Poktan serta Kader"
              />
            </div>
            <div>
              <label
                htmlFor="jumlahsasaran"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jumlah Sasaran <span className="text-red-500">*</span>
              </label>
              <input
                id="jumlahsasaran"
                type="number"
                value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lokasi"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              id="lokasi"
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              placeholder="BKB Delima 1 RW 01, Desa Darmaga"
            />
          </div>

          <div>
            <label
              htmlFor="hasil"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Hasil Kegiatan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="hasil"
              value={form.hasil}
              onChange={(e) => setForm({ ...form, hasil: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="Deskripsikan hasil yang dicapai..."
            />
          </div>

          <div>
            <label
              htmlFor="metode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Metode Kegiatan{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              id="metode"
              type="text"
              value={form.metode}
              onChange={(e) => setForm({ ...form, metode: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              placeholder="Contoh: Ceramah, Diskusi, Penyuluhan"
            />
          </div>

          <div>
            <label
              htmlFor="keterangan"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Keterangan{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              id="keterangan"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="Catatan tambahan jika ada..."
            />
          </div>

          {/* Lampiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dokumen"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dokumen / PDF{" "}
                <span className="text-gray-400 font-normal">
                  (maks. 1 file)
                </span>
              </label>
              {docFile ? (
                <div className="flex items-center gap-2 border border-red-200 rounded p-2 bg-red-50 text-sm">
                  <span className="text-red-500 flex-1 truncate">
                    {docFile.name}
                  </span>
                  <button type="button" onClick={() => setDocFile(null)}>
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="dokumen"
                  className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded p-4 cursor-pointer hover:border-green-400 transition-colors"
                >
                  <Upload size={20} className="text-green-500" />
                  <span className="text-xs text-green-600">
                    Klik untuk memilih file
                  </span>
                  <span className="text-xs text-gray-400">PDF, Word, dll</span>
                  <input
                    id="dokumen"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>

            <div>
              <label
                htmlFor="gambar"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gambar / Foto{" "}
                <span className="text-gray-400 font-normal">
                  (maks. 1 file, otomatis dikecilkan)
                </span>
              </label>
              {imgFile ? (
                <div className="flex items-center gap-2 border border-blue-200 rounded p-2 bg-blue-50 text-sm">
                  <span className="text-blue-500 flex-1 truncate">
                    {imgFile.name}
                  </span>
                  <button type="button" onClick={() => setImgFile(null)}>
                    <X size={14} className="text-blue-500" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="gambar"
                  className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded p-4 cursor-pointer hover:border-green-400 transition-colors"
                >
                  <Upload size={20} className="text-green-500" />
                  <span className="text-xs text-green-600">
                    Klik untuk memilih foto
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG, dll</span>
                  <input
                    id="gambar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1a7a4a] hover:bg-green-800 text-white font-semibold py-2 px-6 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Menyimpan..." : "Simpan Laporan"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2 px-6 rounded text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
