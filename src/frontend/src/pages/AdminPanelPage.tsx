import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { BarChart2, FileText, Key, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
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

type TabType = "pengguna" | "laporan" | "rekap" | "token";

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

  const loadData = async () => {
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
  };

  const loadRekap = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (activeTab === "rekap") loadRekap();
  }, [activeTab, bulan, tahun]);

  const handleSetApproval = async (
    principal: Principal,
    status: ApprovalStatus,
  ) => {
    try {
      await actor.setApproval(principal, status);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateToken = async (principal: Principal) => {
    try {
      const token = await actor.generateUserToken(principal);
      setTokens((prev) => ({ ...prev, [principal.toString()]: token }));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateNs: bigint) => {
    const ms = Number(dateNs / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("id-ID");
  };

  const getApprovalStatus = (principal: Principal): ApprovalStatus | null => {
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

  const tabs: {
    id: TabType;
    label: string;
    Icon: React.FC<{ size?: number }>;
  }[] = [
    { id: "pengguna", label: "Pengguna", Icon: Users },
    { id: "laporan", label: "Semua Laporan", Icon: FileText },
    { id: "rekap", label: "Rekap", Icon: BarChart2 },
    { id: "token", label: "Token Akses", Icon: Key },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#1a7a4a] text-white p-4">
          <h2 className="font-bold text-lg">Panel Admin</h2>
          <p className="text-sm opacity-80">
            Kelola pengguna dan laporan seluruh penyuluh KB
          </p>
        </div>

        <div className="p-4">
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${
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
              onClick={loadData}
              className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2"
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
                      <tr key={idx} className="hover:bg-gray-50">
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
                      <tr key={idx} className="hover:bg-gray-50">
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
                  <label className="block text-xs text-gray-500 mb-1">
                    Bulan
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(Number.parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                  >
                    {BULAN.map((b, i) => (
                      <option key={i} value={i}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tahun
                  </label>
                  <select
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
                        <tr key={idx} className="hover:bg-gray-50">
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
                        <tr key={idx} className="hover:bg-gray-50">
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
        </div>
      </div>
    </div>
  );
}
