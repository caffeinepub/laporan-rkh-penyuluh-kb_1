import {
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../App";
import type { UserProfile } from "../backend";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  profile: UserProfile | null;
  isAdmin: boolean;
  onLogout: () => void;
  children: ReactNode;
}

const menuItems = [
  { id: "dashboard" as Page, label: "Dashboard", Icon: LayoutDashboard },
  { id: "input-laporan" as Page, label: "Input Laporan (RKH)", Icon: FileText },
  { id: "riwayat" as Page, label: "Riwayat Laporan", Icon: Clock },
  { id: "profil" as Page, label: "Profil Saya", Icon: User },
];

export default function Layout({
  currentPage,
  onNavigate,
  profile,
  isAdmin,
  onLogout,
  children,
}: LayoutProps) {
  const allItems = isAdmin
    ? [
        ...menuItems,
        { id: "admin" as Page, label: "Admin Panel", Icon: Shield },
      ]
    : menuItems;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-[#1a7a4a] text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#1a7a4a] font-bold text-xs">BKKBN</span>
            </div>
            <div className="text-xs hidden sm:block leading-tight">
              <div className="font-bold">BADAN KEPENDUDUKAN</div>
              <div>KELUARGA BERENCANA NASIONAL</div>
            </div>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-center flex-1 mx-4">
            SISTEM LAPORAN RKH PENYULUH KB
          </h1>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs hidden sm:block">
              <div className="font-semibold">{profile?.namalengkap || ""}</div>
              <div className="opacity-80">NIP: {profile?.nip || ""}</div>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#1a7a4a] font-bold text-xs">KEMKES</span>
            </div>
          </div>
        </div>
      </div>
      {/* Navbar */}
      <nav className="bg-gray-900 text-gray-300 px-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            {allItems.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${
                  currentPage === id
                    ? "border-green-400 text-white"
                    : "border-transparent hover:text-white hover:border-gray-500"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            {profile?.namalengkap} | NIP: {profile?.nip}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white py-2.5 ml-2"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>
      {/* Body */}
      <div className="flex flex-1">
        <aside className="w-52 bg-white shadow-sm border-r border-gray-200 hidden md:block">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              MENU UTAMA
            </p>
            {allItems.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm mb-1 transition-colors ${
                  currentPage === id
                    ? "text-green-700 bg-green-50 font-medium border-l-2 border-green-700"
                    : "text-gray-600 hover:bg-gray-50 border-l-2 border-transparent"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 overflow-auto min-h-0">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-4 text-center text-xs">
        <p>
          Sistem Informasi Laporan RKH &nbsp;|&nbsp; BKKBN &nbsp;|&nbsp;
          Penyuluh KB
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-8 h-8 bg-[#1a7a4a] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">BKKBN</span>
          </div>
        </div>
        <p className="text-white font-semibold mt-1">LAPORAN RKH PENYULUH KB</p>
        <p>Badan Kependudukan dan Keluarga Berencana Nasional</p>
        <p className="mt-1">© 2026. Dibuat dengan ♥ menggunakan caffeine.ai</p>
      </footer>
    </div>
  );
}
