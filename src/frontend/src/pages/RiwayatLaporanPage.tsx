import type { Identity } from "@icp-sdk/core/agent";
import { CheckCircle, Edit3, Printer, Trash2, X } from "lucide-react";
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

/** Muat pdfjs-dist dari CDN secara dinamis dan kembalikan referensi library */
async function loadPdfjsLib(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  const PDFJS_VERSION = "3.11.174";
  const cdnUrls = [
    `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
  ];

  for (const src of cdnUrls) {
    try {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
      if ((window as any).pdfjsLib) break;
    } catch (e) {
      console.warn("CDN load failed, trying next:", e);
    }
  }

  const lib = (window as any).pdfjsLib;
  if (!lib) throw new Error("pdfjs-dist failed to load from all CDN sources");

  const workerUrls = [
    `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`,
  ];
  lib.GlobalWorkerOptions.workerSrc = workerUrls[0];

  return lib;
}

/** Render semua halaman PDF ke array data-URL gambar menggunakan pdfjs-dist dari CDN */
async function renderPdfToImages(pdfUrl: string): Promise<string[]> {
  const pdfjsLib = await loadPdfjsLib();

  const response = await fetch(pdfUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageImages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    pageImages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  return pageImages;
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
  const [printImageDataUrl, setPrintImageDataUrl] = useState<string | null>(
    null,
  );
  const [printDocPageUrls, setPrintDocPageUrls] = useState<string[]>([]);
  const [preparingPrint, setPreparingPrint] = useState(false);
  const [deletingAction, setDeletingAction] = useState<bigint | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

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
    const handler = () => {
      setPrintingRkh(null);
      setPrintImageDataUrl(null);
      setPrintDocPageUrls([]);
    };
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

  const handleDelete = async (rkh: RKH) => {
    const confirmed = window.confirm(
      "Hapus laporan ini? Tindakan tidak dapat dibatalkan.",
    );
    if (!confirmed) return;
    setDeletingAction(rkh.action);
    try {
      await (actor as any).deleteRKH(rkh.action);
      await loadRKH();
      showToast("success", "Laporan berhasil dihapus.");
    } catch (e) {
      console.error("Gagal menghapus laporan:", e);
      showToast("error", "Gagal menghapus laporan. Silakan coba lagi.");
    } finally {
      setDeletingAction(null);
    }
  };

  const handlePrintSingle = async (rkh: RKH) => {
    setPreparingPrint(true);
    let imageDataUrl: string | null = null;
    let docPageUrls: string[] = [];

    if (rkh.image) {
      try {
        const url = rkh.image.getDirectURL();
        const response = await fetch(url);
        const blob = await response.blob();
        imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to preload image", e);
      }
    }

    if (rkh.document) {
      try {
        const pdfUrl = rkh.document.getDirectURL();
        docPageUrls = await renderPdfToImages(pdfUrl);
      } catch (e) {
        console.error("Failed to render PDF pages", e);
      }
    }

    setPrintImageDataUrl(imageDataUrl);
    setPrintDocPageUrls(docPageUrls);
    setPrintingRkh(rkh);
    setPreparingPrint(false);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintingRkh(null);
        setPrintImageDataUrl(null);
        setPrintDocPageUrls([]);
      }, 500);
    }, 300);
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

  const renderSingleReport = (
    rkh: RKH,
    imageDataUrl?: string | null,
    docPageUrls?: string[],
  ) => {
    const nomorLaporan = rkh.action.toString().slice(-8).toUpperCase();
    const hasImage = !!rkh.image;
    const hasDocument = !!rkh.document;
    const totalAttachments = (hasImage ? 1 : 0) + (hasDocument ? 1 : 0);
    const imageSrc = imageDataUrl || rkh.image?.getDirectURL();
    const pdfPages = docPageUrls ?? [];

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

        <div style={sectionHeaderStyle}>IDENTITAS PENYULUH</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <tbody>
            {(
              [
                ["Nama", profile?.namalengkap || "-"],
                ["NIP", profile?.nip || "-"],
                ["Unit Kerja", profile?.unitKerja || "-"],
                ["Wilayah", profile?.wilayahKerja || "-"],
              ] as [string, string][]
            ).map(([label, value], i) => (
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

        {hasImage && imageSrc && (
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
              src={imageSrc}
              alt="Lampiran Foto"
              style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
            />
          </div>
        )}

        {hasDocument &&
          pdfPages.length > 0 &&
          pdfPages.map((pageDataUrl, pageIdx) => (
            <div
              key={pageDataUrl.slice(-20)}
              style={{ pageBreakBefore: pageIdx === 0 ? "always" : "auto" }}
            >
              {pageIdx === 0 && (
                <div
                  style={{
                    backgroundColor: "#1a5276",
                    color: "white",
                    padding: "10px 16px",
                    fontWeight: "bold",
                    fontSize: "11pt",
                    marginBottom: "12px",
                    letterSpacing: "0.5px",
                  }}
                >
                  LAMPIRAN {hasImage ? 2 : 1} – DOKUMEN PDF
                </div>
              )}
              <img
                src={pageDataUrl}
                alt={`Halaman PDF ${pageIdx + 1}`}
                style={{
                  maxWidth: "100%",
                  display: "block",
                  margin: "0 auto 8px auto",
                  pageBreakInside: "avoid",
                }}
              />
            </div>
          ))}

        {hasDocument && pdfPages.length === 0 && (
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
              style={{ fontSize: "9.5pt", color: "#555", fontStyle: "italic" }}
            >
              Dokumen PDF terlampir (gagal memuat pratinjau halaman).
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          data-ocid="riwayat.toast"
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <X size={16} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 opacity-75 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {preparingPrint && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-8 py-6 shadow-xl text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1a5276] border-t-transparent mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              Mempersiapkan lampiran PDF...
            </p>
            <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      <div
        className="hidden print:block"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "10pt",
          margin: "20px",
        }}
      >
        {printingRkh ? (
          renderSingleReport(printingRkh, printImageDataUrl, printDocPageUrls)
        ) : (
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
            <div
              className="p-8 text-center text-gray-400"
              data-ocid="riwayat.loading_state"
            >
              Memuat data...
            </div>
          ) : rkhList.length === 0 ? (
            <div
              className="p-8 text-center text-gray-400"
              data-ocid="riwayat.empty_state"
            >
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
                          <button
                            type="button"
                            onClick={() => handleDelete(rkh)}
                            className="text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Hapus Laporan"
                            disabled={deletingAction === rkh.action}
                            data-ocid={`riwayat.delete_button.${idx + 1}`}
                          >
                            {deletingAction === rkh.action ? (
                              <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
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
