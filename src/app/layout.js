"use client";

import { Inter } from "next/font/google";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  Map,
  Plus,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const accountHref = user
    ? user.role === "business"
      ? "/dashboard"
      : "/profile"
    : "/login";
  const accountLabel = user
    ? user.role === "business"
      ? "Dashboard"
      : "Profil"
    : "Cont";
  const mobileAccountLabel = user
    ? user.role === "business"
      ? "Dash"
      : "Profil"
    : "Cont";
  const AccountIcon = user?.role === "business" ? LayoutDashboard : User;

  const openPublisher = () => {
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("open-post-modal"));
      return;
    }

    window.location.href = "/?publish=post";
  };

  const getNavLinkClass = (path) => {
    const isActive = pathname === path || pathname.startsWith(`${path}/`);
    if (isActive) {
      return "flex items-center gap-4 px-4 py-3 bg-[#ff003c]/15 border border-[#ff003c]/50 text-[#ff003c] font-medium text-xs rounded-xl transition-all shadow-[inset_0_0_12px_rgba(255,0,60,0.2)]";
    }
    return "flex items-center gap-4 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-900/50 text-xs font-light rounded-xl transition-all group";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased flex justify-center items-start w-full px-0">
      <div className="flex w-full max-w-[1200px] justify-center relative">
        <aside className="hidden md:flex flex-col w-[280px] lg:w-[320px] sticky top-0 h-screen bg-[#09090b] px-6 pt-8 pb-0 justify-between overflow-hidden border-r border-zinc-900/50 shrink-0 z-30">
          <div className="flex flex-col z-20 relative bg-transparent h-full pb-6 justify-start">
            <div className="flex flex-col mb-8">
              <div className="w-[100px] h-[50px] flex items-end">
                <svg
                  viewBox="0 0 140 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-[0_0_10px_rgba(255,0,60,0.8)]"
                >
                  <path
                    d="M5 65H135"
                    stroke="#ff003c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 65V50H25V58H38V42H52V65"
                    stroke="#ff003c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M59 65L63 10H73L77 65"
                    stroke="#ff003c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M84 65V46H98L104 38L110 46H118V54H128V65"
                    stroke="#ff003c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-2">
                <h1 className="text-2xl font-light tracking-[0.25em] text-white uppercase">
                  Resita
                </h1>
                <p className="text-[#ff003c] text-[10px] font-medium tracking-[0.45em] uppercase mt-0.5">
                  Pulse
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <h2 className="text-xl font-light leading-tight tracking-tight">
                Orasul tau. <br />
                <span className="text-[#ff003c] font-normal">
                  In timp real.
                </span>
              </h2>
              <p className="text-zinc-500 text-[11px] font-light leading-relaxed max-w-[220px]">
                Descopera ce e nou in Resita, evenimente, localuri, oferte si
                oameni.
              </p>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Link href="/" className={getNavLinkClass("/")}>
                <Home size={16} strokeWidth={1.5} /> Acasa
              </Link>
              <Link href="/events" className={getNavLinkClass("/events")}>
                <CalendarDays
                  size={16}
                  strokeWidth={1.5}
                  className={
                    pathname !== "/events"
                      ? "group-hover:text-[#ff003c] transition-colors"
                      : ""
                  }
                />
                Events
              </Link>
              <Link href="/business" className={getNavLinkClass("/business")}>
                <Store
                  size={16}
                  strokeWidth={1.5}
                  className={
                    pathname !== "/business"
                      ? "group-hover:text-[#ff003c] transition-colors"
                      : ""
                  }
                />
                Business-uri
              </Link>
              <Link href="/map" className={getNavLinkClass("/map")}>
                <Map
                  size={16}
                  strokeWidth={1.5}
                  className={
                    pathname !== "/map"
                      ? "group-hover:text-[#ff003c] transition-colors"
                      : ""
                  }
                />
                Harta Live
              </Link>
              <Link href={accountHref} className={getNavLinkClass(accountHref)}>
                <AccountIcon
                  size={16}
                  strokeWidth={1.5}
                  className={
                    pathname !== accountHref
                      ? "group-hover:text-[#ff003c] transition-colors"
                      : ""
                  }
                />
                {accountLabel}
              </Link>
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[35vh] w-full z-0 select-none pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#09090b] via-[#09090b]/60 to-transparent z-10" />
            <img
              src="/images/resita-bg.png"
              alt="Resita"
              className="w-full h-full object-cover opacity-90 brightness-[1] contrast-[1.3]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#ff003c]/15 via-transparent to-transparent z-10" />
          </div>
        </aside>

        <main className="flex-1 max-w-[550px] min-w-[320px] bg-[#09090b] pb-24 md:pb-8 min-h-screen md:border-r md:border-zinc-900/50 relative">
          {children}
          <footer className="px-4 pb-8 pt-3 text-[10px] text-zinc-600 sm:px-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/privacy"
                className="transition-colors hover:text-[#ff003c]"
              >
                Confidentialitate
              </Link>
              <span>/</span>
              <Link
                href="/terms"
                className="transition-colors hover:text-[#ff003c]"
              >
                Termeni
              </Link>
              <span>/</span>
              <Link
                href="/cookies"
                className="transition-colors hover:text-[#ff003c]"
              >
                Cookies
              </Link>
            </div>
          </footer>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-t border-zinc-900 bg-[#09090b]/95 px-1 pb-2 backdrop-blur-md md:hidden">
        <Link
          href="/"
          className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center ${pathname === "/" ? "text-[#ff003c]" : "text-zinc-500"}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium mt-1">Acasa</span>
        </Link>
        <Link
          href="/events"
          className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center ${pathname.startsWith("/events") ? "text-[#ff003c]" : "text-zinc-500"}`}
        >
          <CalendarDays size={20} />
          <span className="text-[10px] font-light mt-1">Events</span>
        </Link>
        <Link
          href="/business"
          className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center ${pathname.startsWith("/business") ? "text-[#ff003c]" : "text-zinc-500"}`}
        >
          <Store size={20} />
          <span className="text-[9px] font-light mt-1">Business</span>
        </Link>
        <Link
          href="/map"
          className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center ${pathname === "/map" ? "text-[#ff003c]" : "text-zinc-500"}`}
        >
          <Map size={20} />
          <span className="text-[10px] font-light mt-1">Harta</span>
        </Link>
        <Link
          href={accountHref}
          className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center ${
            pathname === accountHref || pathname.startsWith(`${accountHref}/`)
              ? "text-[#ff003c]"
              : "text-zinc-500"
          }`}
        >
          <AccountIcon size={20} />
          <span className="text-[10px] font-light mt-1">
            {mobileAccountLabel}
          </span>
        </Link>
        {user?.role === "business" && (
          <button
            type="button"
            onClick={openPublisher}
            className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center border-none bg-transparent text-[#ff003c]"
            aria-label="Creeaza postare"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff003c] text-white shadow-[0_0_14px_rgba(255,0,60,0.45)]">
              <Plus size={19} strokeWidth={1.8} />
            </span>
            <span className="mt-1 text-[9px] font-light">Post</span>
          </button>
        )}
      </nav>

      <PwaInstallPrompt />
      <WelcomeOnboarding />
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Resita Pulse" />
        <link rel="icon" type="image/png" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.className} bg-[#09090b] text-white antialiased`}
      >
        <AuthProvider>
          <ModalProvider>
            <LayoutContent>{children}</LayoutContent>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
