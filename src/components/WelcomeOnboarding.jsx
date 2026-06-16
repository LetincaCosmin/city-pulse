"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Compass,
  Map,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "resita-pulse-onboarding-v1";
const hiddenPaths = [
  "/login",
  "/reset-password",
  "/privacy",
  "/terms",
  "/cookies",
];

const steps = [
  {
    icon: Compass,
    title: "Bine ai venit in Resita Pulse",
    body: "Locul unde vezi rapid ce se intampla in oras: noutati, evenimente, business-uri locale si locuri de urmarit pe harta.",
  },
  {
    icon: Map,
    title: "Descopera orasul mai usor",
    body: "Gasesti localuri, magazine, servicii, oferte si evenimente din Resita, toate intr-un singur loc.",
  },
  {
    icon: Store,
    title: "Pentru oameni si business-uri",
    body: "Utilizatorii urmaresc ce e nou, iar business-urile isi pot crea profil, posta noutati si promova evenimente.",
  },
];

export default function WelcomeOnboarding() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const shouldHideOnRoute = useMemo(
    () => hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname],
  );

  useEffect(() => {
    if (shouldHideOnRoute) return undefined;

    const timeout = window.setTimeout(() => {
      const hasSeenOnboarding = window.localStorage.getItem(STORAGE_KEY);
      if (!hasSeenOnboarding) {
        setIsVisible(true);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [shouldHideOnRoute]);

  const closeOnboarding = () => {
    window.localStorage.setItem(STORAGE_KEY, "seen");
    setIsVisible(false);
  };

  if (!isVisible || shouldHideOnRoute) return null;

  const step = steps[activeStep];
  const StepIcon = step.icon;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-md sm:items-center sm:p-5">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/12 bg-[#101014] shadow-[0_28px_90px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={closeOnboarding}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:text-white"
          aria-label="Inchide introducerea"
        >
          <X size={18} strokeWidth={1.8} />
        </button>

        <div className="relative min-h-[190px] overflow-hidden border-b border-white/10 bg-[#09090b] px-6 pb-5 pt-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,0,60,0.28),transparent_42%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-[#ff003c]/60 shadow-[0_0_22px_rgba(255,0,60,0.75)]" />

          <div className="relative">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff003c]/45 bg-[#ff003c]/12 text-[#ff003c] shadow-[0_0_22px_rgba(255,0,60,0.22)]">
              <StepIcon size={30} strokeWidth={1.5} />
            </div>

            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-[#ff003c]">
              Ghid rapid
            </p>
            <h2 className="max-w-[300px] text-2xl font-semibold leading-tight text-white">
              {step.title}
            </h2>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="min-h-[72px] text-sm font-light leading-relaxed text-zinc-300">
            {step.body}
          </p>

          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-4">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CalendarDays size={16} className="text-[#ff003c]" />
              Evenimente, noutati si activitate locala
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <Store size={16} className="text-[#ff003c]" />
              Profiluri pentru business-uri din oras
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <Bell size={16} className="text-[#ff003c]" />
              Urmeaza notificari si functii noi pentru comunitate
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`h-2 rounded-full transition-all ${
                  activeStep === index ? "w-7 bg-[#ff003c]" : "w-2 bg-zinc-700"
                }`}
                aria-label={`Mergi la pasul ${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-3">
            {isLastStep ? (
              <button
                type="button"
                onClick={closeOnboarding}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff003c] px-4 py-3.5 text-sm font-medium text-white shadow-[0_0_22px_rgba(255,0,60,0.24)] transition-colors hover:bg-[#d60032]"
              >
                Exploreaza aplicatia
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStep((stepIndex) => stepIndex + 1)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff003c] px-4 py-3.5 text-sm font-medium text-white shadow-[0_0_22px_rgba(255,0,60,0.24)] transition-colors hover:bg-[#d60032]"
              >
                Mai departe
                <ArrowRight size={16} />
              </button>
            )}

            {!user && (
              <Link
                href="/login"
                onClick={closeOnboarding}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[#ff003c]/40 hover:text-white"
              >
                <UserPlus size={16} />
                Creeaza cont
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
