import { useCallback, useEffect, useState } from "react";
import type { RKH, UserProfile } from "./backend";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPanelPage from "./pages/AdminPanelPage";
import DashboardPage from "./pages/DashboardPage";
import InputLaporanPage from "./pages/InputLaporanPage";
import LoginPage from "./pages/LoginPage";
import ProfilPage from "./pages/ProfilPage";
import RegisterPage from "./pages/RegisterPage";
import RiwayatLaporanPage from "./pages/RiwayatLaporanPage";
import WaitingPage from "./pages/WaitingPage";

export type Page =
  | "dashboard"
  | "input-laporan"
  | "riwayat"
  | "profil"
  | "admin";

export default function App() {
  const { identity, isInitializing, login, clear } = useInternetIdentity();
  const { actor } = useActor();
  const [appState, setAppState] = useState<
    "loading" | "login" | "register" | "waiting" | "main"
  >("loading");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingRkh, setEditingRkh] = useState<RKH | null>(null);

  const checkStatus = useCallback(async () => {
    if (!actor || !identity) return;
    const principal = identity.getPrincipal();
    if (principal.isAnonymous()) {
      setAppState("login");
      return;
    }
    try {
      const [prof, approved, admin] = await Promise.all([
        actor.getCallerUserProfile(),
        actor.isCallerApproved(),
        actor.isCallerAdmin(),
      ]);
      setIsAdmin(admin);
      if (!prof) {
        setAppState("register");
        return;
      }
      setProfile(prof);
      if (!approved) {
        setAppState("waiting");
        return;
      }
      const hasToken = localStorage.getItem("rkh_access_token") !== null;
      if (!hasToken) {
        setAppState("waiting");
        return;
      }
      setAppState("main");
    } catch (e) {
      console.error(e);
      setAppState("login");
    }
  }, [actor, identity]);

  useEffect(() => {
    if (isInitializing) return;
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setAppState("login");
      return;
    }
    if (!actor) {
      setAppState("loading");
      return;
    }
    checkStatus();
  }, [identity, actor, isInitializing, checkStatus]);

  const handleLogout = () => {
    localStorage.removeItem("rkh_access_token");
    clear();
    setAppState("login");
    setProfile(null);
  };

  if (appState === "loading" || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  if (appState === "login") {
    return <LoginPage onLogin={login} />;
  }

  if (appState === "register") {
    return (
      <RegisterPage
        actor={actor!}
        onRegistered={(prof) => {
          setProfile(prof);
          setAppState("waiting");
        }}
      />
    );
  }

  if (appState === "waiting") {
    return (
      <WaitingPage
        profile={profile}
        actor={actor!}
        onTokenVerified={() => {
          localStorage.setItem("rkh_access_token", "granted");
          setAppState("main");
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => {
        setCurrentPage(page);
        setEditingRkh(null);
      }}
      profile={profile}
      isAdmin={isAdmin}
      onLogout={handleLogout}
    >
      {currentPage === "dashboard" && (
        <DashboardPage actor={actor!} identity={identity!} profile={profile} />
      )}
      {currentPage === "input-laporan" && (
        <InputLaporanPage
          actor={actor!}
          editingRkh={editingRkh}
          onSaved={() => {
            setCurrentPage("riwayat");
            setEditingRkh(null);
          }}
          onCancel={() => setCurrentPage("riwayat")}
        />
      )}
      {currentPage === "riwayat" && (
        <RiwayatLaporanPage
          actor={actor!}
          identity={identity!}
          profile={profile}
          onEdit={(rkh) => {
            setEditingRkh(rkh);
            setCurrentPage("input-laporan");
          }}
        />
      )}
      {currentPage === "profil" && (
        <ProfilPage
          actor={actor!}
          profile={profile}
          onSaved={(p) => setProfile(p)}
        />
      )}
      {currentPage === "admin" && isAdmin && (
        <AdminPanelPage actor={actor!} identity={identity!} />
      )}
    </Layout>
  );
}
