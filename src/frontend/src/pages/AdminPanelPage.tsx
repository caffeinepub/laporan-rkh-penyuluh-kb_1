import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  BarChart2,
  FileText,
  Key,
  Layers,
  Printer,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  RKHWithUser,
  UserApprovalInfo,
  UserSummary,
  backendInterface,
} from "../backend";
import { ApprovalStatus } from "../backend";

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

interface AdminPanelPageProps {
  actor: backendInterface;
  identity: Identity;
}

type TabType = "pengguna" | "laporan" | "rekap" | "token" | "gabungan";

export default function AdminPanelPage({ actor }: AdminPanelPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("pengguna");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [allRkh, setAllRkh] = useState<RKHWithUser[]>([]);
  const [approvals, setApprovals] = useState<UserApprovalInfo[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [bulan, setBulan] = useState(new Date().getMonth());
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [rekapData, setRekapData] = useState<RKHWithUser[]>([]);

  // Gabungkan state
  const [gabungUser, setGabungUser] = useState<string>("");
  const [gabungBulan, setGabungBulan] = useState(new Date().getMonth());
  const [gabungTahun, setGabungTahun] = useState(new Date().getFullYear());
  const [gabungRkhList, setGabungRkhList] = useState<RKHWithUser[]>([]);
  const [gabungSelected, setGabungSelected] = useState<Set<string>>(new Set());
  const [gabungLoading, setGabungLoading] = useState(false);
  const [gabungPrintList, setGabungPrintList] = useState<RKHWithUser[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, rkhData, approvalsData] = await Promise.all([
        actor.listAllUsers(),
        actor.listAllRKH(),
        actor.listApprovals(),
      ]);
      setUsers(usersData);
      setAllRkh(rkhData);
      setApprovals(approvalsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  const loadRekap = useCallback(async () => {
    try {
      const start = new Date(tahun, bulan, 1);
      const end = new Date(tahun, bulan + 1, 0, 23, 59, 59);
      const startNs = BigInt(start.getTime()) * BigInt(1_000_000);
      const endNs = BigInt(end.getTime()) * BigInt(1_000_000);
      const data = await actor.getMonthlyRecap(startNs, endNs);
      setRekapData(data);
    } catch (e) {
      console.error(e);
    }
  }, [actor, bulan, tahun]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "rekap") loadRekap();
  }, [activeTab, loadRekap]);

  const handleSetApproval = async (
    principal: ReturnType<typeof Principal.fromText>,
    status: ApprovalStatus,
  ) => {
    try {
      await actor.setApproval(principal, status);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateToken = async (
    principal: ReturnType<typeof Principal.fromText>,
  ) => {
    try {
      const token = await actor.generateUserToken(principal);
      setTokens((prev) => ({ ...prev, [principal.toString()]: token }));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateNs: bigint) => {
    const ms = Number(dateNs / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getApprovalStatus = (
    principal: ReturnType<typeof Principal.fromText>,
  ): ApprovalStatus | null => {
    const ap = approvals.find(
      (a) => a.principal.toString() === principal.toString(),
    );
    return ap?.status || null;
  };

  const getKegiatan = (ca: string) => ca.split("||")[0] || ca;
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );

  const loadGabungRkh = async () => {
    if (!gabungUser) return;
    setGabungLoading(true);
    try {
      const principal = Principal.fromText(gabungUser);
      const start = new Date(gabungTahun, gabungBulan, 1);
      const end = new Date(gabungTahun, gabungBulan + 1, 0, 23, 59, 59);
      const startNs = BigInt(start.getTime()) * BigInt(1_000_000);
      const endNs = BigInt(end.getTime()) * BigInt(1_000_000);
      const result = await actor.getMonthRKH(principal, startNs, endNs);
      const sorted = [...result].sort((a, b) => Number(a.date - b.date));
      const mapped: RKHWithUser[] = sorted.map((rkh) => ({
        rkh,
        user: principal,
      }));
      setGabungRkhList(mapped);
      setGabungSelected(new Set(sorted.map((r) => r.action.toString())));
    } catch (e) {
      console.error(e);
    } finally {
      setGabungLoading(false);
    }
  };

  const gabungUserProfile = users.find(
    (u) => u.user.toString() === gabungUser,
  )?.profile;

  const tabs: {
    id: TabType;
    label: string;
    Icon: React.FC<{ size?: number }>;
  }[] = [
    { id: "pengguna", label: "Pengguna", Icon: Users },
    { id: "laporan", label: "Semua Laporan", Icon: FileText },
    { id: "rekap", label: "Rekap", Icon: BarChart2 },
    { id: "token", label: "Token Akses", Icon: Key },
    { id: "gabungan", label: "Gabungkan Laporan", Icon: Layers },
  ];

  return (
    <div>
      {/* Gabungan print area */}
      {gabungPrintList.length > 0 && (
        <div
          className="hidden print:block"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "10pt",
            margin: "20px",
          }}
        >
          {gabungPrintList.map((item, idx) => (
            <div key={item.rkh.action.toString()}>
              {/* Report header */}
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <p style={{ fontWeight: "bold", fontSize: "11pt" }}>
                  BADAN KEPENDUDUKAN DAN KELUARGA BERENCANA NASIONAL
                </p>
                <p style={{ fontSize: "9pt" }}>Perwakilan Provinsi</p>
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "12pt",
                    marginTop: "8px",
                  }}
                >
                  LAPORAN RENCANA KEGIATAN HARIAN (RKH)
                </p>
                <p style={{ color: "#1a7a4a", fontWeight: "bold" }}>
                  PENYULUH KELUARGA BERENCANA
                </p>
                <p>
                  Periode: {BULAN[gabungBulan]} {gabungTahun}
                </p>
                <hr style={{ marginTop: "8px", borderColor: "#333" }} />
              </div>

              {/* Profile info */}
              <div style={{ marginBottom: "12px", fontSize: "10pt" }}>
                <table style={{ width: "60%" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "120px" }}>Nama</td>
                      <td>
                        : <strong>{gabungUserProfile?.namalengkap}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>NIP</td>
                      <td>: {gabungUserProfile?.nip}</td>
                    </tr>
                    <tr>
                      <td>Jabatan</td>
                      <td>
                        :{" "}
                        <span style={{ color: "#1a7a4a", fontWeight: "bold" }}>
                          {gabungUserProfile?.jabatan}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Unit Kerja</td>
                      <td>: {gabungUserProfile?.unitKerja}</td>
                    </tr>
                    <tr>
                      <td>Wilayah Kerja</td>
                      <td>: {gabungUserProfile?.wilayahKerja}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Report table */}
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
                  <tr>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "4px 6px",
                        textAlign: "center",
                      }}
                    >
                      1
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {formatDate(item.rkh.date)}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {getKegiatan(item.rkh.completedAction)}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {item.rkh.targetGroup}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "4px 6px",
                        textAlign: "center",
                      }}
                    >
                      {item.rkh.numTargeted.toString()}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {item.rkh.place}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {item.rkh.completedAction.split("||")[1] ||
                        item.rkh.completedAction}
                    </td>
                    <td
                      style={{ border: "1px solid #ccc", padding: "4px 6px" }}
                    >
                      {item.rkh.remarks || ""}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Lampiran */}
              {(item.rkh.document || item.rkh.image) && (
                <div style={{ marginTop: "16px" }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      borderBottom: "1px solid #333",
                      paddingBottom: "4px",
                    }}
                  >
                    LAMPIRAN
                  </p>
                  {item.rkh.image && (
                    <img
                      src={item.rkh.image.getDirectURL()}
                      alt="Lampiran Foto"
                      style={{ maxWidth: "100%", marginTop: "12px" }}
                    />
                  )}
                  {item.rkh.document && (
                    <div style={{ marginTop: "8px" }}>
                      <p>Dokumen terlampir:</p>
                      <embed
                        src={item.rkh.document.getDirectURL()}
                        type="application/pdf"
                        style={{
                          width: "100%",
                          height: "400px",
                          marginTop: "8px",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Signature */}
              <div
                style={{
                  marginTop: "24px",
                  textAlign: "right",
                  paddingRight: "40px",
                }}
              >
                <p style={{ color: "#1a7a4a" }}>Mengetahui,</p>
                <p style={{ color: "#1a7a4a" }}>Koordinator Penyuluh KB</p>
                <div style={{ marginTop: "8px", marginBottom: 0 }}>
                  {gabungUserProfile?.signature && (
                    <img
                      src={gabungUserProfile.signature.getDirectURL()}
                      alt="TTD"
                      style={{
                        height: "60px",
                        objectFit: "contain",
                        display: "block",
                        marginLeft: "auto",
                      }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontWeight: "bold",
                    color: "#1a7a4a",
                    marginTop: "2px",
                  }}
                >
                  {gabungUserProfile?.namalengkap}
                </p>
                <p style={{ color: "#1a7a4a" }}>
                  NIP: {gabungUserProfile?.nip}
                </p>
                <p style={{ color: "#1a7a4a" }}>{gabungUserProfile?.jabatan}</p>
              </div>

              {/* Page break between reports */}
              {idx < gabungPrintList.length - 1 && (
                <div style={{ pageBreakAfter: "always" }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden print:hidden">
        <div className="bg-[#1a7a4a] text-white p-4">
          <h2 className="font-bold text-lg">Panel Admin</h2>
          <p className="text-sm opacity-80">
            Kelola pengguna dan laporan seluruh penyuluh KB
          </p>
        </div>

        <div className="p-4">
          <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id)}
                data-ocid={`admin.${id}.tab`}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  activeTab === id
                    ? "border-green-600 text-green-700 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 whitespace-nowrap"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="py-8 text-center text-gray-400">Memuat data...</div>
          )}

          {!loading && activeTab === "pengguna" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "NO",
                      "NAMA",
                      "NIP",
                      "JABATAN",
                      "WILAYAH KERJA",
                      "UNIT KERJA",
                      "TOTAL LAPORAN",
                      "STATUS",
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
                  {users.map((u, idx) => {
                    const status = getApprovalStatus(u.user);
                    return (
                      <tr
                        key={u.user.toString()}
                        className="hover:bg-gray-50"
                        data-ocid={`admin.pengguna.item.${idx + 1}`}
                      >
                        <td className="px-3 py-3">{idx + 1}</td>
                        <td className="px-3 py-3 font-medium">
                          {u.profile?.namalengkap || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs">
                          {u.profile?.nip || "-"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {u.profile?.jabatan || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {u.profile?.wilayahKerja || "-"}
                        </td>
                        <td className="px-3 py-3">
                          {u.profile?.unitKerja || "-"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-green-700 font-semibold">
                            {u.totalReports.toString()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              status === ApprovalStatus.approved
                                ? "bg-green-100 text-green-700"
                                : status === ApprovalStatus.rejected
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {status === ApprovalStatus.approved
                              ? "Disetujui"
                              : status === ApprovalStatus.rejected
                                ? "Ditolak"
                                : "Pending"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            {status !== ApprovalStatus.approved && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetApproval(
                                    u.user,
                                    ApprovalStatus.approved,
                                  )
                                }
                                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded"
                              >
                                Setujui
                              </button>
                            )}
                            {status !== ApprovalStatus.rejected && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetApproval(
                                    u.user,
                                    ApprovalStatus.rejected,
                                  )
                                }
                                className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
                              >
                                Tolak
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-8 text-center text-gray-400"
                      >
                        Belum ada pengguna
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === "laporan" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "NO",
                      "PENYULUH",
                      "TANGGAL",
                      "KEGIATAN",
                      "SASARAN",
                      "JML",
                      "LOKASI",
                      "HASIL",
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
                  {allRkh.map((item, idx) => {
                    const userInfo = users.find(
                      (u) => u.user.toString() === item.user.toString(),
                    );
                    return (
                      <tr
                        key={item.rkh.action.toString()}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-3 py-3">{idx + 1}</td>
                        <td className="px-3 py-3 text-xs">
                          {userInfo?.profile?.namalengkap ||
                            `${item.user.toString().slice(0, 8)}...`}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {formatDate(item.rkh.date)}
                        </td>
                        <td className="px-3 py-3">
                          {getKegiatan(item.rkh.completedAction)}
                        </td>
                        <td className="px-3 py-3">{item.rkh.targetGroup}</td>
                        <td className="px-3 py-3 text-center">
                          {item.rkh.numTargeted.toString()}
                        </td>
                        <td className="px-3 py-3">{item.rkh.place}</td>
                        <td className="px-3 py-3 max-w-xs">
                          <p className="line-clamp-2 text-xs text-gray-600">
                            {item.rkh.completedAction.split("||")[1] ||
                              item.rkh.completedAction}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                  {allRkh.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-8 text-center text-gray-400"
                      >
                        Belum ada laporan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === "rekap" && (
            <div>
              <div className="flex gap-4 mb-4">
                <div>
                  <label
                    htmlFor="bulan"
                    className="block text-xs text-gray-500 mb-1"
                  >
                    Bulan
                  </label>
                  <select
                    id="bulan"
                    value={bulan}
                    onChange={(e) => setBulan(Number.parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
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
                    htmlFor="tahun"
                    className="block text-xs text-gray-500 mb-1"
                  >
                    Tahun
                  </label>
                  <select
                    id="tahun"
                    value={tahun}
                    onChange={(e) => setTahun(Number.parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 border rounded p-3 mb-3">
                <p className="text-sm font-semibold">
                  Rekap {BULAN[bulan]} {tahun}:{" "}
                  <span className="text-green-700">
                    {rekapData.length} laporan
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        "NO",
                        "PENYULUH",
                        "TANGGAL",
                        "KEGIATAN",
                        "LOKASI",
                        "JML SASARAN",
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
                    {rekapData.map((item, idx) => {
                      const userInfo = users.find(
                        (u) => u.user.toString() === item.user.toString(),
                      );
                      return (
                        <tr
                          key={item.rkh.action.toString()}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-3">{idx + 1}</td>
                          <td className="px-3 py-3">
                            {userInfo?.profile?.namalengkap || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {formatDate(item.rkh.date)}
                          </td>
                          <td className="px-3 py-3">
                            {getKegiatan(item.rkh.completedAction)}
                          </td>
                          <td className="px-3 py-3">{item.rkh.place}</td>
                          <td className="px-3 py-3 text-center">
                            {item.rkh.numTargeted.toString()}
                          </td>
                        </tr>
                      );
                    })}
                    {rekapData.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-gray-400"
                        >
                          Tidak ada data rekap
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === "token" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Kelola token akses unik untuk setiap pengguna. Token digunakan
                untuk verifikasi saat masuk dashboard.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["NO", "NAMA", "NIP", "TOKEN", "AKSI"].map((h) => (
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
                    {users.map((u, idx) => {
                      const token = tokens[u.user.toString()];
                      return (
                        <tr
                          key={u.user.toString()}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-3">{idx + 1}</td>
                          <td className="px-3 py-3 font-medium">
                            {u.profile?.namalengkap || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs">
                            {u.profile?.nip || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {token ? (
                              <span className="bg-green-100 text-green-700 font-mono font-bold text-xs px-2 py-1 rounded">
                                {token}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">
                                Belum diatur
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => handleGenerateToken(u.user)}
                              className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded"
                            >
                              <Key size={11} /> Set Token
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-gray-400"
                        >
                          Belum ada pengguna
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === "gabungan" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Pilih pengguna, periode, dan laporan yang akan digabungkan untuk
                dicetak.
              </p>

              {/* Filter row */}
              <div className="flex gap-3 mb-4 flex-wrap items-end">
                <div>
                  <label
                    htmlFor="gabung-pengguna"
                    className="block text-xs text-gray-500 mb-1"
                  >
                    Pilih Pengguna
                  </label>
                  <select
                    id="gabung-pengguna"
                    value={gabungUser}
                    onChange={(e) => setGabungUser(e.target.value)}
                    data-ocid="admin.gabungan.select"
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 min-w-[200px]"
                  >
                    <option value="">-- Pilih Pengguna --</option>
                    {users.map((u) => (
                      <option key={u.user.toString()} value={u.user.toString()}>
                        {u.profile?.namalengkap ||
                          `${u.user.toString().slice(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="gabung-bulan"
                    className="block text-xs text-gray-500 mb-1"
                  >
                    Bulan
                  </label>
                  <select
                    id="gabung-bulan"
                    value={gabungBulan}
                    onChange={(e) =>
                      setGabungBulan(Number.parseInt(e.target.value))
                    }
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
                    htmlFor="gabung-tahun"
                    className="block text-xs text-gray-500 mb-1"
                  >
                    Tahun
                  </label>
                  <select
                    id="gabung-tahun"
                    value={gabungTahun}
                    onChange={(e) =>
                      setGabungTahun(Number.parseInt(e.target.value))
                    }
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadGabungRkh}
                  disabled={!gabungUser || gabungLoading}
                  data-ocid="admin.gabungan.button"
                  className="bg-[#1a7a4a] hover:bg-green-800 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-medium"
                >
                  {gabungLoading ? "Memuat..." : "Muat Laporan"}
                </button>
              </div>

              {/* RKH list with checkboxes */}
              {gabungRkhList.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">
                      {gabungRkhList.length} laporan ditemukan
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setGabungSelected(
                            new Set(
                              gabungRkhList.map((r) => r.rkh.action.toString()),
                            ),
                          )
                        }
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setGabungSelected(new Set())}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Hapus Pilihan
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 w-8">
                            <input
                              type="checkbox"
                              checked={
                                gabungSelected.size === gabungRkhList.length &&
                                gabungRkhList.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGabungSelected(
                                    new Set(
                                      gabungRkhList.map((r) =>
                                        r.rkh.action.toString(),
                                      ),
                                    ),
                                  );
                                } else {
                                  setGabungSelected(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">
                            TANGGAL
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">
                            KEGIATAN
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">
                            LOKASI
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">
                            LAMPIRAN
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gabungRkhList.map((item, idx) => {
                          const key = item.rkh.action.toString();
                          const checked = gabungSelected.has(key);
                          return (
                            <tr
                              key={key}
                              className="border-t hover:bg-gray-50"
                              data-ocid={`admin.gabungan.item.${idx + 1}`}
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const s = new Set(gabungSelected);
                                    if (checked) {
                                      s.delete(key);
                                    } else {
                                      s.add(key);
                                    }
                                    setGabungSelected(s);
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2">
                                {formatDate(item.rkh.date)}
                              </td>
                              <td className="px-3 py-2">
                                {item.rkh.completedAction.split("||")[0]}
                              </td>
                              <td className="px-3 py-2">{item.rkh.place}</td>
                              <td className="px-3 py-2">
                                {item.rkh.document || item.rkh.image ? (
                                  <span className="text-xs text-green-600">
                                    Ada
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {gabungSelected.size > 0 && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedList = gabungRkhList.filter((r) =>
                            gabungSelected.has(r.rkh.action.toString()),
                          );
                          setGabungPrintList(selectedList);
                          setTimeout(() => {
                            window.print();
                            setTimeout(() => setGabungPrintList([]), 500);
                          }, 200);
                        }}
                        data-ocid="admin.gabungan.primary_button"
                        className="flex items-center gap-2 bg-[#1a7a4a] hover:bg-green-800 text-white px-5 py-2 rounded text-sm font-semibold"
                      >
                        <Printer size={14} /> Gabungkan & Cetak (
                        {gabungSelected.size} laporan)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {gabungRkhList.length === 0 && gabungUser && !gabungLoading && (
                <div
                  className="py-8 text-center text-gray-400"
                  data-ocid="admin.gabungan.empty_state"
                >
                  Tidak ada laporan untuk periode ini
                </div>
              )}

              {!gabungUser && (
                <div className="py-8 text-center text-gray-300">
                  <Layers size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Pilih pengguna untuk memuat laporan</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
