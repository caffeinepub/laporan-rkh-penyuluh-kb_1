import type { Identity } from "@icp-sdk/core/agent";
import { Edit3, Printer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RKH, UserProfile, backendInterface } from "../backend";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface RiwayatLaporanPageProps {
  actor: backendInterface;
  identity: Identity;
  profile: UserProfile | null;
  onEdit: (rkh: RKH) => void;
}

export default function RiwayatLaporanPage({
  actor,
  identity,
  profile,
  onEdit,
}: RiwayatLaporanPageProps) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [rkhList, setRkhList] = useState<RKH[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const loadRKH = useCallback(async () => {
    setLoading(true);
    try {
      const principal = identity.getPrincipal();
      const start = new Date(tahun, bulan, 1);
      const end = new Date(tahun, bulan + 1, 0, 23, 59, 59);
      const startNs = BigInt(start.getTime()) * BigInt(1_000_000);
      const endNs = BigInt(end.getTime()) * BigInt(1_000_000);
      const result = await actor.getMonthRKH(principal, startNs, endNs);
      const sorted = [...result].sort((a, b) => Number(a.date - b.date));
      setRkhList(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor, identity, bulan, tahun]);

  useEffect(() => {
    loadRKH();
  }, [loadRKH]);

  const formatDate = (dateNs: bigint) => {
    const ms = Number(dateNs / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getKegiatan = (ca: string) => ca.split("||")[0] || ca;
  const getHasil = (ca: string) => ca.split("||")[1] || ca;

  const handlePrint = () => window.print();

  const sigUrl = profile?.signature?.getDirectURL?.();
  const periodLabel = `${BULAN[bulan]} ${tahun}`;
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div>
      {/* Print area */}
      <div ref={printRef} className="hidden print:block">
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "10pt",
            margin: "20px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <p style={{ fontWeight: "bold", fontSize: "11pt" }}>
              BADAN KEPENDUDUKAN DAN KELUARGA BERENCANA NASIONAL
            </p>
            <p style={{ fontSize: "9pt" }}>Perwakilan Provinsi</p>
            <p
              style={{ fontWeight: "bold", fontSize: "12pt", marginTop: "8px" }}
            >
              LAPORAN RENCANA KEGIATAN HARIAN (RKH)
            </p>
            <p style={{ color: "#1a7a4a", fontWeight: "bold" }}>
              PENYULUH KELUARGA BERENCANA
            </p>
            <p>Periode: {periodLabel}</p>
            <hr style={{ marginTop: "8px", borderColor: "#333" }} />
          </div>
          <div style={{ marginBottom: "12px", fontSize: "10pt" }}>
            <table style={{ width: "60%" }}>
              <tbody>
                <tr>
                  <td style={{ width: "120px" }}>Nama</td>
                  <td>
                    : <strong>{profile?.namalengkap}</strong>
                  </td>
                </tr>
                <tr>
                  <td>NIP</td>
                  <td>: {profile?.nip}</td>
                </tr>
                <tr>
                  <td>Jabatan</td>
                  <td>
                    :{" "}
                    <span style={{ color: "#1a7a4a", fontWeight: "bold" }}>
                      {profile?.jabatan}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Unit Kerja</td>
                  <td>: {profile?.unitKerja}</td>
                </tr>
                <tr>
                  <td>Wilayah Kerja</td>
                  <td>: {profile?.wilayahKerja}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "9pt",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                {[
                  "No",
                  "Tanggal",
                  "Kegiatan",
                  "Sasaran",
                  "Jumlah",
                  "Lokasi",
                  "Hasil Kegiatan",
                  "Ket.",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      border: "1px solid #ccc",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rkhList.map((rkh, idx) => (
                <tr key={rkh.action.toString()}>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {formatDate(rkh.date)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {getKegiatan(rkh.completedAction)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {rkh.targetGroup}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}
                  >
                    {rkh.numTargeted.toString()}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {rkh.place}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {getHasil(rkh.completedAction)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                    {rkh.remarks || ""}
                  </td>
                </tr>
              ))}
              {rkhList.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      border: "1px solid #ccc",
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    Tidak ada laporan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div
            style={{
              marginTop: "24px",
              textAlign: "right",
              paddingRight: "40px",
            }}
          >
            <p style={{ color: "#1a7a4a" }}>Mengetahui,</p>
            <p style={{ color: "#1a7a4a" }}>Koordinator Penyuluh KB</p>
            <div
              style={{ height: "60px", marginTop: "8px", marginBottom: "8px" }}
            >
              {sigUrl && (
                <img
                  src={sigUrl}
                  alt="Tanda Tangan"
                  style={{ height: "60px", objectFit: "contain" }}
                />
              )}
            </div>
            <p style={{ fontWeight: "bold", color: "#1a7a4a" }}>
              {profile?.namalengkap}
            </p>
            <p style={{ color: "#1a7a4a" }}>NIP: {profile?.nip}</p>
            <p style={{ color: "#1a7a4a" }}>{profile?.jabatan}</p>
          </div>
        </div>
      </div>

      {/* Screen view */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Riwayat Laporan RKH
          </h2>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#1a7a4a] hover:bg-green-800 text-white text-sm font-semibold py-2 px-4 rounded"
          >
            <Printer size={14} />
            Cetak Laporan Gabungan
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex gap-4">
            <div>
              <label
                htmlFor="filter-bulan"
                className="block text-xs text-gray-500 mb-1"
              >
                Bulan
              </label>
              <select
                id="filter-bulan"
                value={bulan}
                onChange={(e) => setBulan(Number.parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              >
                {BULAN.map((b, i) => (
                  <option key={b} value={i}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-tahun"
                className="block text-xs text-gray-500 mb-1"
              >
                Tahun
              </label>
              <select
                id="filter-tahun"
                value={tahun}
                onChange={(e) => setTahun(Number.parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">
              Laporan Bulan {BULAN[bulan]} {tahun}
            </h3>
            <p className="text-sm text-gray-500">
              {rkhList.length} laporan ditemukan
            </p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Memuat data...</div>
          ) : rkhList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Tidak ada laporan untuk periode ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "NO",
                      "TANGGAL",
                      "KEGIATAN",
                      "SASARAN",
                      "JML",
                      "LOKASI",
                      "HASIL KEGIATAN",
                      "LAMPIRAN",
                      "AKSI",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-xs text-gray-500 font-semibold uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rkhList.map((rkh, idx) => (
                    <tr
                      key={rkh.action.toString()}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatDate(rkh.date)}
                      </td>
                      <td className="px-3 py-3">
                        {getKegiatan(rkh.completedAction)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          {rkh.targetGroup}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {rkh.numTargeted.toString()}
                      </td>
                      <td className="px-3 py-3">{rkh.place}</td>
                      <td className="px-3 py-3 max-w-xs">
                        <p className="line-clamp-2 text-gray-600">
                          {getHasil(rkh.completedAction)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {rkh.document || rkh.image ? (
                          <span className="text-xs text-green-600">Ada</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="text-gray-400 hover:text-green-600"
                            title="Cetak"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(rkh)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
