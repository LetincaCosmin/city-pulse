"use client";

import { useEffect, useState } from "react";
import { Download, Plus, Share2, Smartphone, X } from "lucide-react";

const DISMISSED_KEY = "resita-pulse-install-dismissed-at-v2";
const INSTALLED_KEY = "resita-pulse-installed";
const DISMISS_DAYS = 2;

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
  if (!dismissedAt) return false;

  const dismissWindow = DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < dismissWindow;
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [promptType, setPromptType] = useState(null);
  const [showManualHelp, setShowManualHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Nu am putut inregistra service worker-ul:", error);
      });
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return undefined;
    }

    window.addEventListener("load", registerServiceWorker);
    return () => window.removeEventListener("load", registerServiceWorker);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleBeforeInstallPrompt = (event) => {
      if (
        !isAndroidDevice() ||
        isStandaloneMode() ||
        localStorage.getItem(INSTALLED_KEY) === "true" ||
        wasRecentlyDismissed()
      ) {
        return;
      }

      event.preventDefault();
      setInstallPrompt(event);
      setShowManualHelp(false);
      setPromptType("android");
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setInstallPrompt(null);
      setPromptType(null);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (
      !isAndroidDevice() ||
      isStandaloneMode() ||
      localStorage.getItem(INSTALLED_KEY) === "true" ||
      wasRecentlyDismissed()
    ) {
      return undefined;
    }

    const showAndroidFallback = window.setTimeout(() => {
      setPromptType((currentType) => currentType || "android");
      setShowManualHelp(true);
      setIsVisible(true);
    }, 1200);

    return () => window.clearTimeout(showAndroidFallback);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (
      !isIosDevice() ||
      isStandaloneMode() ||
      localStorage.getItem(INSTALLED_KEY) === "true" ||
      wasRecentlyDismissed()
    ) {
      return undefined;
    }

    const showIosPrompt = window.setTimeout(() => {
      setPromptType("ios");
      setIsVisible(true);
    }, 900);

    return () => window.clearTimeout(showIosPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowManualHelp(true);
      return;
    }

    setIsInstalling(true);

    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice?.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
      }

      setInstallPrompt(null);
      setPromptType(null);
      setIsVisible(false);
    } catch (error) {
      console.error("Nu am putut porni instalarea PWA:", error);
      setShowManualHelp(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowManualHelp(false);
    setPromptType(null);
    setIsVisible(false);
  };

  if (!isVisible || !promptType) return null;

  const isIosPrompt = promptType === "ios";
  const needsManualAndroidInstall = !isIosPrompt && (!installPrompt || showManualHelp);

  return (
    <div className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-[520px] md:bottom-6">
      <div className="rounded-[26px] border border-[#ff003c]/35 bg-[#111115]/95 p-3 shadow-[0_0_36px_rgba(255,0,60,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff003c]/15 text-[#ff003c]">
            <Smartphone size={22} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">
              Instaleaza Resita Pulse
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              {isIosPrompt
                ? "Adauga aplicatia pe ecranul principal."
                : "Pune aplicatia pe ecranul telefonului."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-800 text-zinc-500 transition hover:border-zinc-700 hover:text-white"
            aria-label="Ascunde instalarea"
          >
            <X size={16} />
          </button>
        </div>

        {isIosPrompt ? (
          <div className="mt-3 grid gap-2">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff003c]/10 text-[#ff003c]">
                <Share2 size={16} strokeWidth={1.8} />
              </span>
              <p className="text-xs leading-relaxed text-zinc-300">
                In Safari, apasa butonul <span className="text-white">Share</span>.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff003c]/10 text-[#ff003c]">
                <Plus size={17} strokeWidth={1.9} />
              </span>
              <p className="text-xs leading-relaxed text-zinc-300">
                Alege <span className="text-white">Add to Home Screen</span>,
                apoi confirma.
              </p>
            </div>
          </div>
        ) : (
          <>
            {installPrompt ? (
              <button
                type="button"
                onClick={handleInstall}
                disabled={isInstalling}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff003c] px-4 py-3 text-sm font-bold text-white shadow-[0_0_22px_rgba(255,0,60,0.24)] transition hover:bg-[#d60032] disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Download size={17} strokeWidth={1.9} />
                {isInstalling ? "Se deschide instalarea..." : "Instaleaza acum"}
              </button>
            ) : (
              <div className="mt-3 rounded-2xl border border-[#ff003c]/25 bg-[#ff003c]/10 px-3 py-2.5">
                <p className="text-xs font-medium leading-relaxed text-[#ff8aa4]">
                  Instalarea automata nu este disponibila in acest browser sau
                  pe acest link local.
                </p>
              </div>
            )}

            {needsManualAndroidInstall && (
              <div className="mt-3 grid gap-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-zinc-300">
                    Daca testezi pe IP local, Chrome poate bloca instalarea
                    automata. Pe linkul de Vercel, cu HTTPS, butonul va deschide
                    direct fereastra de instalare.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff003c]/10 text-[#ff003c]">
                    <Plus size={17} strokeWidth={1.9} />
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    Pentru test local: Chrome{" "}
                    <span className="text-white">meniu cu trei puncte</span>,
                    apoi{" "}
                    <span className="text-white">Adauga pe ecranul principal</span>.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
