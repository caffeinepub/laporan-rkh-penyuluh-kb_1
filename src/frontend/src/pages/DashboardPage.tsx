import type { Identity } from "@icp-sdk/core/agent";
import { Calendar, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserProfile, backendInterface } from "../backend";

interface DashboardPageProps {
  actor: backendInterface;
  identity: Identity;
  profile: UserProfile | null;
}

export default function DashboardPage({
  actor,
  identity,
  profile,
}: DashboardPageProps) {
  const [monthCount, setMonthCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const principal = identity.getPrincipal();
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        const startNs = BigInt(start.getTime()) * BigInt(1_000_000);
        const endNs = BigInt(end.getTime()) * BigInt(1_000_000);
        const [monthRkh, allRkh] = await Promise.all([
          actor.getMonthRKH(principal, startNs, endNs),
          actor.getYearRKH(
            principal,
            BigInt(new Date(now.getFullYear(), 0, 1).getTime()) *
              BigInt(1_000_000),
            BigInt(new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime()) *
              BigInt(1_000_000),
          ),
        ]);
        setMonthCount(monthRkh.length);
        setTotalCount(allRkh.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [actor, identity]);

  const now = new Date();
  const bulanNama = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang,{" "}
          <span className="font-semibold text-green-700">
            {profile?.namalengkap || "Penyuluh"}
          </span>
          {profile?.nip && (
            <span className="text-gray-400"> — NIP: {profile.nip}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Laporan Bulan Ini
              </p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {loading ? "..." : monthCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">{bulanNama}</p>
            </div>
            <Calendar size={32} className="text-green-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Laporan Tahun Ini
              </p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {loading ? "..." : totalCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tahun {now.getFullYear()}
              </p>
            </div>
            <FileText size={32} className="text-blue-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Jabatan
              </p>
              <p className="text-sm font-bold text-purple-700 mt-1">
                {profile?.jabatan || "-"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {profile?.unitKerja || ""}
              </p>
            </div>
            <CheckCircle size={32} className="text-purple-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Wilayah Kerja
              </p>
              <p className="text-sm font-bold text-orange-700 mt-1">
                {profile?.wilayahKerja || "-"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {profile?.phoneNumber || ""}
              </p>
            </div>
            <TrendingUp size={32} className="text-orange-300" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-3">Informasi Sistem</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            • Gunakan menu <strong>Input Laporan (RKH)</strong> untuk menambah
            laporan kegiatan harian.
          </p>
          <p>
            • Gunakan menu <strong>Riwayat Laporan</strong> untuk melihat dan
            mencetak laporan per bulan.
          </p>
          <p>
            • Lengkapi <strong>Profil Saya</strong> termasuk tanda tangan untuk
            cetak laporan resmi.
          </p>
          {profile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-800">Data Profil Anda:</p>
              <p>
                Nama: {profile.namalengkap} | NIP: {profile.nip}
              </p>
              <p>
                Jabatan: {profile.jabatan} | Unit: {profile.unitKerja} |
                Wilayah: {profile.wilayahKerja}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
