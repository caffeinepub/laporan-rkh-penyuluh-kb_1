import type { Identity } from "@icp-sdk/core/agent";
import { Edit3, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  isAdmin: boolean;
  onEdit: (rkh: RKH) => void;
}

export default function RiwayatLaporanPage({
  actor,
  identity,
  profile,
  isAdmin,
  onEdit,
}: RiwayatLaporanPageProps) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [rkhList, setRkhList] = useState<RKH[]>([]);
  const [loading, setLoading] = useState(false);
  const [printingRkh, setPrintingRkh] = useState<RKH | null>(null);

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

  useEffect(() => {
    const handler = () => setPrintingRkh(null);
    window.onafterprint = handler;
    return () => {
      window.onafterprint = null;
    };
  }, []);

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

  const handlePrint = () => {
    setPrintingRkh(null);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintSingle = (rkh: RKH) => {
    setPrintingRkh(rkh);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingRkh(null), 500);
    }, 200);
  };

  const sigUrl = profile?.signature?.getDirectURL?.();
  const periodLabel = `${BULAN[bulan]} ${tahun}`;
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const signatureBlock = (
    <div
      style={{ marginTop: "24px", textAlign: "right", paddingRight: "40px" }}
    >
      <p style={{ color: "#1a5276" }}>Mengetahui,</p>
      <p style={{ color: "#1a5276" }}>Koordinator Penyuluh KB</p>
      <div style={{ marginTop: "8px", marginBottom: 0 }}>
        {sigUrl && (
          <img
            src={sigUrl}
            alt="Tanda Tangan"
            style={{
              height: "60px",
              objectFit: "contain",
              display: "block",
              marginLeft: "auto",
            }}
          />
        )}
      </div>
      <p style={{ fontWeight: "bold", color: "#1a5276", marginTop: "2px" }}>
        {profile?.namalengkap}
      </p>
      <p style={{ color: "#1a5276" }}>NIP: {profile?.nip}</p>
      <p style={{ color: "#1a5276" }}>{profile?.jabatan}</p>
    </div>
  );

  const profileBlock = (
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
              <span style={{ color: "#1a5276", fontWeight: "bold" }}>
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
  );

  const reportHeader = (
    <div style={{ textAlign: "center", marginBottom: "16px" }}>
      <p style={{ fontWeight: "bold", fontSize: "11pt" }}>
        BADAN KEPENDUDUKAN DAN KELUARGA BERENCANA NASIONAL
      </p>
      <p style={{ fontSize: "9pt" }}>Perwakilan Provinsi</p>
      <p style={{ fontWeight: "bold", fontSize: "12pt", marginTop: "8px" }}>
        LAPORAN RENCANA KEGIATAN HARIAN (RKH)
      </p>
      <p style={{ color: "#1a5276", fontWeight: "bold" }}>
        PENYULUH KELUARGA BERENCANA
      </p>
      <p>Periode: {periodLabel}</p>
      <hr style={{ marginTop: "8px", borderColor: "#333" }} />
    </div>
  );

  const tableHeaders = [
    "No",
    "Tanggal",
    "Kegiatan",
    "Sasaran",
    "Jumlah",
    "Lokasi",
    "Hasil Kegiatan",
    "Ket.",
  ];

  // Section header style for single report vertical layout
  const sectionHeaderStyle: React.CSSProperties = {
    backgroundColor: "#1a5276",
    color: "white",
    padding: "6px 12px",
    fontWeight: "bold",
    fontSize: "10pt",
    marginTop: "16px",
    marginBottom: "0",
    letterSpacing: "0.5px",
  };

  const detailRowStyle = (even: boolean): React.CSSProperties => ({
    backgroundColor: even ? "#f5f8fa" : "#ffffff",
    borderBottom: "1px solid #ddd",
  });

  const detailLabelStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontWeight: "600",
    color: "#2c3e50",
    width: "180px",
    verticalAlign: "top",
    fontSize: "9.5pt",
    borderRight: "1px solid #ddd",
  };

  const detailValueStyle: React.CSSProperties = {
    padding: "6px 12px",
    color: "#333",
    fontSize: "9.5pt",
    verticalAlign: "top",
  };

  const renderSingleReport = (rkh: RKH) => {
    const nomorLaporan = rkh.action.toString().slice(-8).toUpperCase();
    const hasImage = !!rkh.image;
    const hasDocument = !!rkh.document;
    const totalAttachments = (hasImage ? 1 : 0) + (hasDocument ? 1 : 0);

    const detailRows: [string, string][] = [
      ["Nomor Laporan", nomorLaporan],
      ["Tanggal", formatDate(rkh.date)],
      ["Nama Kegiatan", getKegiatan(rkh.completedAction)],
      ["Hasil Kegiatan", getHasil(rkh.completedAction)],
      ["Nama Register / Sasaran", rkh.targetGroup],
      ["Indikator Keberhasilan", rkh.targetGroup],
      ["Volume / Jumlah", rkh.numTargeted.toString()],
      ["Metode Kegiatan", "-"],
      ["Lokasi Kegiatan", rkh.place],
      ["Waktu Pelaksanaan", formatDate(rkh.date)],
      ["Sumber Dana", "-"],
      ["Keterangan", rkh.remarks || "-"],
    ];

    return (
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10pt" }}>
        {/* ── PAGE 1: Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "3px solid #1a5276",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <img
            src="/assets/uploads/bkkbn-019d1e7a-bd36-77cf-b342-f26ff46cd60b-1.png"
            alt="Logo BKKBN"
            style={{
              height: "60px",
              objectFit: "contain",
              marginRight: "16px",
            }}
          />
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "12pt",
                color: "#1a5276",
                lineHeight: 1.3,
              }}
            >
              LAPORAN RENCANA KERJA HARIAN PENYULUH KB
            </div>
            <div style={{ fontSize: "9pt", color: "#555", marginTop: "2px" }}>
              Badan Kependudukan dan Keluarga Berencana Nasional (Perwakilan)
            </div>
            <div style={{ fontSize: "9pt", color: "#555", marginTop: "2px" }}>
              Nomor: {nomorLaporan}
            </div>
          </div>
        </div>

        {/* ── IDENTITAS PENYULUH ── */}
        <div style={sectionHeaderStyle}>IDENTITAS PENYULUH</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <tbody>
            {[
              ["Nama", profile?.namalengkap || "-"],
              ["NIP", profile?.nip || "-"],
              ["Unit Kerja", profile?.unitKerja || "-"],
              ["Wilayah", profile?.wilayahKerja || "-"],
            ].map(([label, value], i) => (
              <tr key={label} style={detailRowStyle(i % 2 === 0)}>
                <td style={detailLabelStyle}>{label}</td>
                <td
                  style={{
                    ...detailValueStyle,
                    fontWeight: label === "Nama" ? "bold" : "normal",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── DETAIL LAPORAN ── */}
        <div style={sectionHeaderStyle}>DETAIL LAPORAN</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <tbody>
            {detailRows.map(([label, value], i) => (
              <tr key={label} style={detailRowStyle(i % 2 === 0)}>
                <td style={detailLabelStyle}>{label}</td>
                <td style={detailValueStyle}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── LAMPIRAN ── */}
        {totalAttachments > 0 && (
          <>
            <div style={sectionHeaderStyle}>LAMPIRAN</div>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "10px 12px",
                backgroundColor: "#fafafa",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  marginBottom: "8px",
                  color: "#555",
                  fontSize: "9pt",
                }}
              >
                Ada {totalAttachments} file lampiran yang terlampir pada halaman
                berikutnya.
              </p>
              <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "9.5pt" }}>
                {hasImage && (
                  <li style={{ marginBottom: "4px" }}>
                    Lampiran 1 : Foto/Gambar
                  </li>
                )}
                {hasDocument && (
                  <li style={{ marginBottom: "4px" }}>
                    Lampiran {hasImage ? 2 : 1} : Dokumen PDF
                  </li>
                )}
              </ol>
            </div>
          </>
        )}

        {/* ── TANDA TANGAN ── */}
        <div
          style={{
            marginTop: "28px",
            display: "flex",
            justifyContent: "flex-end",
            paddingRight: "40px",
          }}
        >
          <div style={{ textAlign: "center", minWidth: "160px" }}>
            <p style={{ marginBottom: "4px", color: "#333" }}>
              Yang Membuat Laporan,
            </p>
            <div
              style={{
                height: "70px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {sigUrl ? (
                <img
                  src={sigUrl}
                  alt="Tanda Tangan"
                  style={{ maxHeight: "65px", objectFit: "contain" }}
                />
              ) : (
                <div style={{ height: "65px" }} />
              )}
            </div>
            <p
              style={{
                fontWeight: "bold",
                color: "#1a5276",
                marginTop: "4px",
                borderTop: "1px solid #1a5276",
                paddingTop: "4px",
              }}
            >
              {profile?.namalengkap}
            </p>
            <p style={{ color: "#555", fontSize: "9pt" }}>
              NIP: {profile?.nip}
            </p>
          </div>
        </div>

        {/* ── ATTACHMENT PAGES ── */}
        {hasImage && rkh.image && (
          <div style={{ pageBreakBefore: "always" }}>
            <div
              style={{
                backgroundColor: "#1a5276",
                color: "white",
                padding: "10px 16px",
                fontWeight: "bold",
                fontSize: "11pt",
                marginBottom: "16px",
                letterSpacing: "0.5px",
              }}
            >
              LAMPIRAN 1 – FOTO/GAMBAR
            </div>
            <img
              src={rkh.image.getDirectURL()}
              alt="Lampiran Foto"
              style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
            />
          </div>
        )}
        {hasDocument && rkh.document && (
          <div style={{ pageBreakBefore: "always" }}>
            <div
              style={{
                backgroundColor: "#1a5276",
                color: "white",
                padding: "10px 16px",
                fontWeight: "bold",
                fontSize: "11pt",
                marginBottom: "16px",
                letterSpacing: "0.5px",
              }}
            >
              LAMPIRAN {hasImage ? 2 : 1} – DOKUMEN PDF
            </div>
            <p
              style={{
                fontSize: "9.5pt",
                color: "#555",
                marginBottom: "12px",
                fontStyle: "italic",
              }}
            >
              Dokumen terlampir di bawah ini:
            </p>
            <embed
              src={rkh.document.getDirectURL()}
              type="application/pdf"
              style={{ width: "100%", height: "500px" }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Print area */}
      <div
        className="hidden print:block"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "10pt",
          margin: "20px",
        }}
      >
        {printingRkh ? (
          /* Single report print — vertical detail layout */
          renderSingleReport(printingRkh)
        ) : (
          /* Full gabungan print (admin only) */
          <div>
            {reportHeader}
            {profileBlock}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9pt",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  {tableHeaders.map((h) => (
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
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {formatDate(rkh.date)}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {getKegiatan(rkh.completedAction)}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
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
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {rkh.place}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {getHasil(rkh.completedAction)}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
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
            {signatureBlock}
          </div>
        )}
      </div>

      {/* Screen view */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Riwayat Laporan RKH
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={handlePrint}
              data-ocid="riwayat.primary_button"
              className="flex items-center gap-2 bg-[#1a5276] hover:bg-blue-900 text-white text-sm font-semibold py-2 px-4 rounded"
            >
              <Printer size={14} />
              Cetak Laporan Gabungan
            </button>
          )}
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
                data-ocid="riwayat.select"
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
                      data-ocid={`riwayat.item.${idx + 1}`}
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
                            onClick={() => handlePrintSingle(rkh)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Cetak Laporan Ini"
                            data-ocid={`riwayat.secondary_button.${idx + 1}`}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(rkh)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Edit"
                            data-ocid={`riwayat.edit_button.${idx + 1}`}
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
